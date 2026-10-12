import { ChartDef, MaxPlayers, StackDepth, handLabel } from './helpers';
import { POSTFLOP_CBET_ACTIONS } from './actionColors';
import { BUCKETS, Bucket, Card, cellBuckets, parseBoard } from './postflopEngine';
import { BTN_100, comboCount } from './rfiTables';

// Postflop Cbet ranges: BTN vs BB (Single Raised Pot), 6 representative flops.
// Actions: bet / check (we are the aggressor, so there is no fold).
//
// Every cell is expanded into its real combos and classified against the actual flop
// (postflopEngine), so sets, straights, flush draws and blocked cards are all accounted
// for. Each texture then maps hand buckets to bet frequencies; the non-value buckets
// (bluffs / weak made hands) are scaled so the overall cbet frequency over BTN's opening
// range hits a target for that texture. Same ranges at every table size.

type BucketFreqs = Record<Bucket, number>;

interface Texture {
  board: string;
  target: number; // overall cbet share of BTN's range at 100bb
  freqs: BucketFreqs;
}

const f = (a: number[]): BucketFreqs =>
  Object.fromEntries(BUCKETS.map((b, i) => [b, a[i]])) as BucketFreqs;
//        monster set  2pair over tpG  tpW  mid  low  combo fd   oesd gut  ovr2 ovr1 air
const TEXTURES: Record<string, Texture> = {
  // Dry ace-high: bet nearly everything small
  A72r: { board: 'As 7d 2c', target: 0.80, freqs: f([0.95, 0.95, 0.92, 0.9, 0.92, 0.85, 0.6, 0.35, 0.8, 0.6, 0.7, 0.55, 0.65, 0.5, 0.35]) },
  // Dry king-high
  K83r: { board: 'Ks 8d 3c', target: 0.72, freqs: f([0.95, 0.95, 0.9, 0.85, 0.88, 0.75, 0.5, 0.3, 0.75, 0.55, 0.6, 0.5, 0.6, 0.4, 0.3]) },
  // Connected broadway: range disadvantage, lots of checks
  QJT: { board: 'Qs Js Td', target: 0.50, freqs: f([0.85, 0.85, 0.8, 0.65, 0.6, 0.5, 0.4, 0.25, 0.85, 0.7, 0.7, 0.55, 0.4, 0.3, 0.2]) },
  // Monotone: slowplay some made hands, bet the nut-flush draws
  '963ss': { board: '9s 6s 3s', target: 0.48, freqs: f([0.7, 0.8, 0.75, 0.55, 0.5, 0.4, 0.3, 0.2, 0.8, 0.6, 0.55, 0.4, 0.35, 0.3, 0.2]) },
  // Paired high board: small bet with almost everything
  KK5: { board: 'Ks Kd 5h', target: 0.82, freqs: f([0.8, 0.75, 0.6, 0.85, 0.85, 0.8, 0.55, 0.45, 0.7, 0.6, 0.6, 0.5, 0.6, 0.55, 0.45]) },
  // Low connected: many draws and straights, bet value and draws
  '876': { board: '8s 7s 6d', target: 0.50, freqs: f([0.85, 0.85, 0.8, 0.6, 0.45, 0.4, 0.35, 0.25, 0.85, 0.65, 0.7, 0.45, 0.4, 0.3, 0.2]) },
};

// Buckets whose frequency is scaled to hit the target (bluffs and weak made hands).
const SCALABLE: Bucket[] = ['midPair', 'lowPair', 'gutshot', 'overcards', 'overcard', 'air'];

// Higher stacks-to-pot flexibility at 60bb: more aggression.
const SHORT_STACK_BOOST = 0.05;

const round2 = (n: number) => Math.round(n * 100) / 100;

function buildGrid(texture: Texture, depth: StackDepth): Map<string, { bet: number; check: number }> {
  const board: Card[] = parseBoard(texture.board);
  const target = Math.min(0.95, texture.target + (depth === 60 ? SHORT_STACK_BOOST : 0));

  const cells: { hand: string; buckets: Map<Bucket, number>; weight: number }[] = [];
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      const buckets = cellBuckets(row, col, board);
      cells.push({ hand, buckets, weight: (BTN_100[hand] ?? 0) * comboCount(hand) });
    }
  }
  const totalWeight = cells.reduce((sum, c) => sum + c.weight, 0);

  // Shift scalable buckets in logit space: frequencies saturate smoothly instead of
  // clipping at 100% (and never turn a hand into a pure bet/check by themselves).
  const shifted = (base: number, shift: number) => {
    const p = Math.min(0.98, Math.max(0.02, base));
    return 1 / (1 + Math.exp(-(Math.log(p / (1 - p)) + shift)));
  };
  const betFor = (buckets: Map<Bucket, number>, shift: number) => {
    let bet = 0;
    for (const [bucket, share] of buckets) {
      const base = texture.freqs[bucket];
      bet += share * (SCALABLE.includes(bucket) ? shifted(base, shift) : base);
    }
    return bet;
  };
  const overall = (shift: number) => cells.reduce((sum, c) => sum + c.weight * betFor(c.buckets, shift), 0) / totalWeight;

  let lo = -6;
  let hi = 6;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (overall(mid) < target) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;

  return new Map(cells.map((c) => {
    const bet = round2(betFor(c.buckets, k));
    return [c.hand, { bet, check: round2(1 - bet) }];
  }));
}

function textureRange(key: string, depth: StackDepth) {
  let grid: Map<string, { bet: number; check: number }> | undefined;
  return (row: number, col: number) => (grid ??= buildGrid(TEXTURES[key], depth)).get(handLabel(row, col))!;
}

// --- Chart builder by stack depth ---

export function getPostflopCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  // No postflop cbet ranges at shallow stacks
  if (depth <= 40) return [];

  // Need at least BTN and BB (3+ players)
  if (maxPlayers < 3) return [];

  const tag = `${depth}bb`;

  return [
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on A72r (Dry High) [${tag}]`,
      flopTexture: 'A72r',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: textureRange('A72r', depth),
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on K83r (Dry Mid) [${tag}]`,
      flopTexture: 'K83r',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: textureRange('K83r', depth),
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on QJT (Wet Broadway) [${tag}]`,
      flopTexture: 'QJT',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: textureRange('QJT', depth),
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on 963ss (Monotone) [${tag}]`,
      flopTexture: '963ss',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: textureRange('963ss', depth),
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on KK5 (Paired) [${tag}]`,
      flopTexture: 'KK5',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: textureRange('KK5', depth),
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on 876 (Low Connected) [${tag}]`,
      flopTexture: '876',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: textureRange('876', depth),
    },
  ];
}

// Backward compatibility
export const POSTFLOP_CHARTS = getPostflopCharts(100);
