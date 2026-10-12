import {
  ChartDef,
  FreqMap,
  MaxPlayers,
  RANKS,
  StackDepth,
  handLabel,
  positionsForPlayerCount,
} from './helpers';
import { SQUEEZE_ACTIONS } from './actionColors';
import { enforceMonotone, parseRange, monotoneTable, tableShare, comboCount, FreqTable } from './rfiTables';

type HeroClass = 'co' | 'btn' | 'sb' | 'bb';
type OpenerClass = 'ep' | 'hj' | 'co' | 'btn' | 'sb';
type CallerClass = 'tight' | 'late' | 'blind';

type HandFeatures = {
  ranks: [number, number];
  pair: boolean;
  suited: boolean;
  broadwayCount: number;
  connectorGap: number;
  ace: boolean;
  wheelAce: boolean;
  kingHigh: boolean;
};

type SqueezeProfile = {
  squeezeThreshold: number;
  callThreshold: number;
};

const VALUE_BY_RANK: Record<string, number> = Object.fromEntries(
  RANKS.map((rank, index) => [rank, 14 - index]),
) as Record<string, number>;

const HERO_CLASSES: HeroClass[] = ['co', 'btn', 'sb', 'bb'];

const PROFILES: Record<HeroClass, Record<OpenerClass, Record<CallerClass, SqueezeProfile>>> = {
  co: {
    ep: {
      tight: { squeezeThreshold: 9.7, callThreshold: 7.8 },
      late: { squeezeThreshold: 9.4, callThreshold: 7.4 },
      blind: { squeezeThreshold: 9.4, callThreshold: 7.4 },
    },
    hj: {
      tight: { squeezeThreshold: 9.3, callThreshold: 7.4 },
      late: { squeezeThreshold: 9.0, callThreshold: 7.0 },
      blind: { squeezeThreshold: 9.0, callThreshold: 7.0 },
    },
    co: {
      tight: { squeezeThreshold: 8.9, callThreshold: 6.9 },
      late: { squeezeThreshold: 8.6, callThreshold: 6.6 },
      blind: { squeezeThreshold: 8.6, callThreshold: 6.6 },
    },
    btn: {
      tight: { squeezeThreshold: 9.0, callThreshold: 6.8 },
      late: { squeezeThreshold: 8.8, callThreshold: 6.5 },
      blind: { squeezeThreshold: 8.8, callThreshold: 6.5 },
    },
    sb: {
      tight: { squeezeThreshold: 8.9, callThreshold: 6.8 },
      late: { squeezeThreshold: 8.7, callThreshold: 6.5 },
      blind: { squeezeThreshold: 8.7, callThreshold: 6.5 },
    },
  },
  btn: {
    ep: {
      tight: { squeezeThreshold: 9.2, callThreshold: 7.4 },
      late: { squeezeThreshold: 8.9, callThreshold: 7.0 },
      blind: { squeezeThreshold: 8.9, callThreshold: 7.0 },
    },
    hj: {
      tight: { squeezeThreshold: 8.8, callThreshold: 7.0 },
      late: { squeezeThreshold: 8.5, callThreshold: 6.6 },
      blind: { squeezeThreshold: 8.5, callThreshold: 6.6 },
    },
    co: {
      tight: { squeezeThreshold: 8.4, callThreshold: 6.5 },
      late: { squeezeThreshold: 8.1, callThreshold: 6.2 },
      blind: { squeezeThreshold: 8.1, callThreshold: 6.2 },
    },
    btn: {
      tight: { squeezeThreshold: 8.5, callThreshold: 6.3 },
      late: { squeezeThreshold: 8.2, callThreshold: 6.0 },
      blind: { squeezeThreshold: 8.2, callThreshold: 6.0 },
    },
    sb: {
      tight: { squeezeThreshold: 8.4, callThreshold: 6.3 },
      late: { squeezeThreshold: 8.1, callThreshold: 6.0 },
      blind: { squeezeThreshold: 8.1, callThreshold: 6.0 },
    },
  },
  sb: {
    ep: {
      tight: { squeezeThreshold: 9.4, callThreshold: 7.1 },
      late: { squeezeThreshold: 9.1, callThreshold: 6.8 },
      blind: { squeezeThreshold: 9.1, callThreshold: 6.8 },
    },
    hj: {
      tight: { squeezeThreshold: 9.0, callThreshold: 6.8 },
      late: { squeezeThreshold: 8.7, callThreshold: 6.4 },
      blind: { squeezeThreshold: 8.7, callThreshold: 6.4 },
    },
    co: {
      tight: { squeezeThreshold: 8.6, callThreshold: 6.3 },
      late: { squeezeThreshold: 8.3, callThreshold: 6.0 },
      blind: { squeezeThreshold: 8.3, callThreshold: 6.0 },
    },
    btn: {
      tight: { squeezeThreshold: 8.4, callThreshold: 6.1 },
      late: { squeezeThreshold: 8.1, callThreshold: 5.8 },
      blind: { squeezeThreshold: 8.1, callThreshold: 5.8 },
    },
    sb: {
      tight: { squeezeThreshold: 8.4, callThreshold: 6.1 },
      late: { squeezeThreshold: 8.1, callThreshold: 5.8 },
      blind: { squeezeThreshold: 8.1, callThreshold: 5.8 },
    },
  },
  bb: {
    ep: {
      tight: { squeezeThreshold: 9.0, callThreshold: 7.2 },
      late: { squeezeThreshold: 8.7, callThreshold: 6.9 },
      blind: { squeezeThreshold: 8.7, callThreshold: 6.9 },
    },
    hj: {
      tight: { squeezeThreshold: 8.6, callThreshold: 6.9 },
      late: { squeezeThreshold: 8.3, callThreshold: 6.5 },
      blind: { squeezeThreshold: 8.3, callThreshold: 6.5 },
    },
    co: {
      tight: { squeezeThreshold: 8.2, callThreshold: 6.4 },
      late: { squeezeThreshold: 7.9, callThreshold: 6.1 },
      blind: { squeezeThreshold: 7.9, callThreshold: 6.1 },
    },
    btn: {
      tight: { squeezeThreshold: 8.0, callThreshold: 6.2 },
      late: { squeezeThreshold: 7.7, callThreshold: 5.9 },
      blind: { squeezeThreshold: 7.7, callThreshold: 5.9 },
    },
    sb: {
      tight: { squeezeThreshold: 7.9, callThreshold: 6.1 },
      late: { squeezeThreshold: 7.6, callThreshold: 5.8 },
      blind: { squeezeThreshold: 7.6, callThreshold: 5.8 },
    },
  },
};

function positionClass(position: string): HeroClass | OpenerClass | null {
  switch (position) {
    case 'CO':
      return 'co';
    case 'BTN':
      return 'btn';
    case 'SB':
      return 'sb';
    case 'BB':
      return 'bb';
    case 'HJ':
      return 'hj';
    case 'UTG':
    case 'UTG+1':
    case 'UTG+2':
    case 'MP':
      return 'ep';
    default:
      return null;
  }
}

function classifyCaller(caller: string): CallerClass {
  switch (caller) {
    case 'SB':
    case 'BB':
      return 'blind';
    case 'CO':
    case 'BTN':
      return 'late';
    default:
      return 'tight';
  }
}

function depthAdjustment(depth: StackDepth): { squeeze: number; call: number } {
  switch (depth) {
    case 25:
      return { squeeze: 0.28, call: 0.18 };
    case 40:
      return { squeeze: 0.12, call: 0.08 };
    case 60:
      return { squeeze: 0, call: 0 };
    case 100:
      return { squeeze: -0.08, call: -0.1 };
    default:
      return { squeeze: 0.3, call: 0.2 };
  }
}

function analyzeHand(hand: string): HandFeatures {
  const suited = hand.endsWith('s');
  const pair = hand.length == 2;
  const r1 = VALUE_BY_RANK[hand[0]];
  const r2 = VALUE_BY_RANK[hand[1]];
  const hi = Math.max(r1, r2);
  const lo = Math.min(r1, r2);
  return {
    ranks: [hi, lo],
    pair,
    suited,
    broadwayCount: [hi, lo].filter((rank) => rank >= 10).length,
    connectorGap: hi - lo,
    ace: hi == 14,
    wheelAce: hi == 14 && lo <= 5,
    kingHigh: hi == 13,
  };
}

function squeezeScore(features: HandFeatures): number {
  const [hi, lo] = features.ranks;

  if (features.pair) return 7.7 + (hi * 0.36);

  if (features.ace) {
    const wheelBonus = lo == 5
      ? 1.4
      : lo == 4
        ? 1.1
        : lo == 3
          ? 0.82
          : lo == 2
            ? 0.62
            : 0;
    if (features.suited) return 5.9 + (lo * 0.22) + wheelBonus;
    return 4.8 + (lo * 0.2) + (lo >= 10 ? 0.45 : 0);
  }

  if (features.broadwayCount == 2) {
    return (features.suited ? 6.1 : 5.0) + ((hi + lo) * (features.suited ? 0.11 : 0.09));
  }

  if (features.suited && features.kingHigh) return 4.9 + (lo * 0.18);

  if (features.suited) {
    const connectivityBonus = features.connectorGap <= 1
      ? 1.05
      : features.connectorGap == 2
        ? 0.68
        : features.connectorGap == 3
          ? 0.3
          : 0;
    return 2.9 + (hi * 0.16) + (lo * 0.08) + connectivityBonus;
  }

  if (features.kingHigh) return 3.7 + (lo * 0.16);

  return 1.7 + (hi * 0.12) + (lo * 0.05);
}

function heroAdjustment(hero: HeroClass): number {
  switch (hero) {
    case 'co':
      return -0.18;
    case 'btn':
      return 0.18;
    case 'sb':
      return 0.1;
    case 'bb':
      return 0.24;
  }
}

function openerAdjustment(opener: OpenerClass): number {
  switch (opener) {
    case 'ep':
      return -0.42;
    case 'hj':
      return -0.12;
    case 'co':
      return 0.1;
    case 'btn':
      return 0.2;
    case 'sb':
      return 0.24;
  }
}

function callerAdjustment(caller: CallerClass): number {
  switch (caller) {
    case 'tight':
      return -0.12;
    case 'late':
      return 0.12;
    case 'blind':
      return 0.18;
  }
}

// Half-width (in score units) of the band around a threshold where a hand mixes.
const MIX_HALF_WIDTH = 0.35;

const ramp = (score: number, threshold: number): number =>
  Math.min(1, Math.max(0, (score - (threshold - MIX_HALF_WIDTH)) / (2 * MIX_HALF_WIDTH)));

export const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Frequencies from the hand score: 3bet ramps up around the squeeze threshold,
 * continue (3bet + call) ramps up around the call threshold. Hands far from
 * both thresholds are pure, so nothing leaks into unrelated hands.
 */
function squeezeFreqs(
  hand: string,
  hero: HeroClass,
  opener: OpenerClass,
  caller: CallerClass,
  depth: StackDepth,
): FreqMap {
  const base = squeezeScore(analyzeHand(hand))
    + heroAdjustment(hero)
    + openerAdjustment(opener)
    + callerAdjustment(caller);
  const profile = PROFILES[hero][opener][caller];
  const depthAdj = depthAdjustment(depth);

  const threeBet = ramp(base, profile.squeezeThreshold + depthAdj.squeeze);
  const play = Math.max(threeBet, ramp(base, profile.callThreshold + depthAdj.call));
  return {
    '3bet': round2(threeBet),
    call: round2(play - threeBet),
    fold: round2(1 - play),
  };
}

// Authored shapes. The score model above is only used for how WIDE each spot is;
// which hands fill that width comes from these (linear-ish value core, bluff tail).
export const THREE_BET_SHAPE = `
  AA KK QQ AKs AKo JJ:0.8 TT:0.4 AQs:0.7 AQo:0.3 A5s:0.5 A4s:0.4 A3s:0.2 A2s:0.1
  KQs:0.3 99:0.25 88:0.15 77:0.1 66:0.05 AJs:0.3 ATs:0.15 A9s:0.08 A8s:0.06
  KJs:0.1 KTs:0.06 QJs:0.08 JTs:0.08 T9s:0.08 98s:0.08 87s:0.08 76s:0.1 65s:0.1 54s:0.1
  AJo:0.08 KQo:0.1 K9s:0.05 Q9s:0.04
`;
export const CALL_SHAPE = `
  JJ:0.2 TT:0.6 99 88 77 66 55 44 33 22 AQs:0.3 AQo:0.5 AJs ATs A9s A8s A7s A6s A5s:0.5 A4s:0.6 A3s A2s
  KQs KJs KTs K9s K8s:0.5 K7s:0.2 QJs QTs Q9s Q8s:0.4 JTs J9s J8s:0.3 T9s T8s T7s:0.2 98s 97s 87s 86s 76s 75s:0.6 65s 64s:0.4 54s 53s:0.3 43s:0.2
  KQo AJo ATo:0.7 A9o:0.4 A8o:0.2 KJo QJo:0.8 KTo:0.4 QTo:0.4 JTo:0.4 T9o:0.2 98o:0.1
`;

// How much of the model's call width each hero actually flats (SB rarely does).
const CALL_WIDTH_FACTOR: Record<HeroClass, number> = { co: 1, btn: 1, sb: 0.6, bb: 1 };

function modelWidths(
  hero: HeroClass,
  opener: OpenerClass,
  caller: CallerClass,
  depth: StackDepth,
): { threeBet: number; play: number } {
  let t = 0;
  let p = 0;
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      const f = squeezeFreqs(hand, hero, opener, caller, depth);
      const n = hand.length === 2 ? 6 : hand.endsWith('s') ? 4 : 12;
      t += f['3bet'] * n;
      p += (1 - f.fold) * n;
    }
  }
  return { threeBet: t / 1326, play: p / 1326 };
}

/**
 * Fill a range up to `budget` (share of all combos): hands are taken in priority
 * order (authored frequency, then model score) at full frequency; only the last
 * hand is partial. `taken` lists frequency already used by another action.
 */
export function fillByPriority(
  shape: FreqTable,
  budget: number,
  taken: FreqTable = {},
  score: (hand: string) => number = (hand) => squeezeScore(analyzeHand(hand)),
): FreqTable {
  const order = Object.keys(shape).sort((a, b) => shape[b] - shape[a] || score(b) - score(a));
  const out: FreqTable = {};
  let remaining = budget * 1326;
  for (const hand of order) {
    if (remaining <= 0) break;
    const room = 1 - (taken[hand] ?? 0);
    if (room <= 0) continue;
    const n = comboCount(hand);
    const f = Math.min(room, remaining / n);
    if (f >= 0.02) out[hand] = round2(f);
    remaining -= f * n;
  }
  return out;
}

/** The whole 169-hand grid for one spot: authored shapes filled to the model's widths. */
function squeezeGrid(
  hero: HeroClass,
  opener: OpenerClass,
  caller: CallerClass,
  depth: StackDepth,
): Map<string, FreqMap> {
  const widths = modelWidths(hero, opener, caller, depth);
  const callWidth = (widths.play - widths.threeBet) * CALL_WIDTH_FACTOR[hero];

  const threeBet: FreqTable = monotoneTable(fillByPriority(parseRange(THREE_BET_SHAPE), widths.threeBet));
  const call: FreqTable = fillByPriority(parseRange(CALL_SHAPE), callWidth, threeBet);

  // A dominating hand must continue (3bet + call) at least as often.
  enforceMonotone(
    (h) => (threeBet[h] ?? 0) + (call[h] ?? 0),
    (h, f) => { call[h] = round2(Math.min(f, 1) - (threeBet[h] ?? 0)); },
  );

  const out = new Map<string, FreqMap>();
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      const t = threeBet[hand] ?? 0;
      const c = Math.min(call[hand] ?? 0, 1 - t);
      out.set(hand, { '3bet': round2(t), call: round2(c), fold: round2(1 - t - c) });
    }
  }
  return out;
}

export function getSqueezeCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth < 25) return [];

  const positions = positionsForPlayerCount(maxPlayers);
  const charts: ChartDef[] = [];

  for (let heroIndex = 0; heroIndex < positions.length; heroIndex++) {
    const heroPosition = positions[heroIndex];
    const heroClass = positionClass(heroPosition);
    if (!heroClass || !HERO_CLASSES.includes(heroClass as HeroClass)) continue;

    for (let callerIndex = 1; callerIndex < heroIndex; callerIndex++) {
      const callerPosition = positions[callerIndex];
      if (callerPosition == 'BB') continue;

      for (let openerIndex = 0; openerIndex < callerIndex; openerIndex++) {
        const openerPosition = positions[openerIndex];
        if (openerPosition == 'BB') continue;

        const openerClass = positionClass(openerPosition);
        if (!openerClass) continue;

        const callerClass = classifyCaller(callerPosition);
        const hero = heroClass as HeroClass;
        const opener = openerClass as OpenerClass;

        charts.push({
          position: heroPosition,
          situation: 'Squeeze',
          vsPosition: openerPosition,
          callerPosition: callerPosition,
          category: 'Squeeze',
          description: `${heroPosition} squeeze vs ${openerPosition} open + ${callerPosition} call (${depth}bb, ${maxPlayers}-max)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: SQUEEZE_ACTIONS,
          ranges: (() => {
            let grid: Map<string, FreqMap> | undefined;
            return (row: number, col: number) =>
              (grid ??= squeezeGrid(hero, opener, callerClass, depth)).get(handLabel(row, col))!;
          })(),
        });
      }
    }
  }

  return charts;
}
