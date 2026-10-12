import {
  ChartDef,
  FreqMap,
  MaxPlayers,
  RANKS,
  StackDepth,
  handLabel,
  positionsForPlayerCount,
} from './helpers';
import { COLD_CALL_3BET_ACTIONS } from './actionColors';
import { enforceMonotone } from './rfiTables';

type HeroClass = 'hj' | 'co' | 'btn' | 'sb' | 'bb';
type OpenerClass = 'ep' | 'hj' | 'co' | 'btn' | 'sb';
type ContextClass = 'headsup' | 'multiway';

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

type CallProfile = {
  callThreshold: number;
};

const VALUE_BY_RANK: Record<string, number> = Object.fromEntries(
  RANKS.map((rank, index) => [rank, 14 - index]),
) as Record<string, number>;

// BB is intentionally absent: its spots are the 'Defend' (vs a single open) and 'Squeeze'
// (vs open + caller) charts. Duplicates here disagreed with them (BB vs UTG: 30% vs 12%).
const HERO_CLASSES: HeroClass[] = ['hj', 'co', 'btn', 'sb'];

const PROFILES: Record<HeroClass, Record<OpenerClass, Record<ContextClass, CallProfile>>> = {
  hj: {
    ep: { headsup: { callThreshold: 8.5 }, multiway: { callThreshold: 9.0 } },
    hj: { headsup: { callThreshold: 8.0 }, multiway: { callThreshold: 8.5 } },
    co: { headsup: { callThreshold: 7.8 }, multiway: { callThreshold: 8.2 } },
    btn: { headsup: { callThreshold: 7.7 }, multiway: { callThreshold: 8.1 } },
    sb: { headsup: { callThreshold: 7.7 }, multiway: { callThreshold: 8.1 } },
  },
  co: {
    ep: { headsup: { callThreshold: 8.0 }, multiway: { callThreshold: 8.5 } },
    hj: { headsup: { callThreshold: 7.6 }, multiway: { callThreshold: 8.0 } },
    co: { headsup: { callThreshold: 7.3 }, multiway: { callThreshold: 7.7 } },
    btn: { headsup: { callThreshold: 7.2 }, multiway: { callThreshold: 7.6 } },
    sb: { headsup: { callThreshold: 7.2 }, multiway: { callThreshold: 7.6 } },
  },
  btn: {
    ep: { headsup: { callThreshold: 7.8 }, multiway: { callThreshold: 8.2 } },
    hj: { headsup: { callThreshold: 7.3 }, multiway: { callThreshold: 7.8 } },
    co: { headsup: { callThreshold: 6.9 }, multiway: { callThreshold: 7.3 } },
    btn: { headsup: { callThreshold: 6.8 }, multiway: { callThreshold: 7.2 } },
    sb: { headsup: { callThreshold: 6.8 }, multiway: { callThreshold: 7.2 } },
  },
  sb: {
    ep: { headsup: { callThreshold: 9.1 }, multiway: { callThreshold: 9.6 } },
    hj: { headsup: { callThreshold: 8.7 }, multiway: { callThreshold: 9.1 } },
    co: { headsup: { callThreshold: 8.3 }, multiway: { callThreshold: 8.7 } },
    btn: { headsup: { callThreshold: 8.0 }, multiway: { callThreshold: 8.5 } },
    sb: { headsup: { callThreshold: 8.0 }, multiway: { callThreshold: 8.5 } },
  },
  bb: {
    ep: { headsup: { callThreshold: 7.2 }, multiway: { callThreshold: 7.6 } },
    hj: { headsup: { callThreshold: 6.9 }, multiway: { callThreshold: 7.3 } },
    co: { headsup: { callThreshold: 6.4 }, multiway: { callThreshold: 6.9 } },
    btn: { headsup: { callThreshold: 6.1 }, multiway: { callThreshold: 6.6 } },
    sb: { headsup: { callThreshold: 6.0 }, multiway: { callThreshold: 6.5 } },
  },
};

function positionClass(position: string): HeroClass | OpenerClass | null {
  switch (position) {
    case 'HJ':
      return 'hj';
    case 'CO':
      return 'co';
    case 'BTN':
      return 'btn';
    case 'SB':
      return 'sb';
    case 'BB':
      return 'bb';
    case 'UTG':
    case 'UTG+1':
    case 'UTG+2':
    case 'MP':
      return 'ep';
    default:
      return null;
  }
}

function depthAdjustment(depth: StackDepth): number {
  switch (depth) {
    case 25:
      return 0.35;
    case 40:
      return 0.15;
    case 60:
      return 0;
    case 100:
      return -0.08;
    default:
      return 0.4;
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

function callScore(features: HandFeatures): number {
  const [hi, lo] = features.ranks;

  if (features.pair) return 7.0 + (hi * 0.34);

  if (features.ace) {
    if (features.suited) return 5.7 + (lo * 0.24) + (features.wheelAce ? 0.2 : 0);
    return 4.3 + (lo * 0.21);
  }

  if (features.broadwayCount == 2) {
    return (features.suited ? 5.8 : 4.8) + ((hi + lo) * (features.suited ? 0.11 : 0.09));
  }

  if (features.suited && features.kingHigh) return 4.8 + (lo * 0.17);

  if (features.suited) {
    const connectivityBonus = features.connectorGap <= 1
      ? 1.2
      : features.connectorGap == 2
        ? 0.82
        : features.connectorGap == 3
          ? 0.42
          : 0;
    return 3.2 + (hi * 0.15) + (lo * 0.09) + connectivityBonus;
  }

  if (features.kingHigh) return 3.2 + (lo * 0.15);

  return 1.5 + (hi * 0.11) + (lo * 0.05);
}

function heroAdjustment(hero: HeroClass): number {
  switch (hero) {
    case 'hj':
      return -0.28;
    case 'co':
      return -0.05;
    case 'btn':
      return 0.18;
    case 'sb':
      return -0.38;
    case 'bb':
      return 0.34;
  }
}

function openerAdjustment(opener: OpenerClass): number {
  switch (opener) {
    case 'ep':
      return -0.34;
    case 'hj':
      return -0.1;
    case 'co':
      return 0.08;
    case 'btn':
      return 0.16;
    case 'sb':
      return 0.2;
  }
}

function contextAdjustment(context: ContextClass): number {
  switch (context) {
    case 'headsup':
      return 0;
    case 'multiway':
      return -0.26;
  }
}

// Max share a premium hand flats; the rest of the time it 3bets (never folds).
const PREMIUM_FLAT_CAP: Record<string, number> = { AA: 0.1, KK: 0.15, QQ: 0.5, AKs: 0.4, AKo: 0.3 };

// Half-width (score units) of the band around the call threshold where a hand mixes.
const MIX_HALF_WIDTH = 0.35;

function callFrequency(
  hand: string,
  hero: HeroClass,
  opener: OpenerClass,
  context: ContextClass,
  depth: StackDepth,
): number {
  const base = callScore(analyzeHand(hand))
    + heroAdjustment(hero)
    + openerAdjustment(opener)
    + contextAdjustment(context);
  const threshold = PROFILES[hero][opener][context].callThreshold + depthAdjustment(depth);
  const f = (base - (threshold - MIX_HALF_WIDTH)) / (2 * MIX_HALF_WIDTH);
  return Math.min(1, Math.max(0, f));
}

/**
 * Call frequency grid for one spot. Frequencies ramp around the threshold (so only
 * borderline hands mix, nothing leaks into distant hands) and are made monotone in
 * hand strength, since the raw score can rank e.g. KJs above AQs.
 */
function coldCallGrid(
  hero: HeroClass,
  opener: OpenerClass,
  context: ContextClass,
  depth: StackDepth,
): Map<string, FreqMap> {
  const freq = new Map<string, number>();
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      freq.set(hand, callFrequency(hand, hero, opener, context, depth));
    }
  }
  enforceMonotone((h) => freq.get(h)!, (h, f) => freq.set(h, f));
  return new Map([...freq].map(([h, f]): [string, FreqMap] => {
    const cap = PREMIUM_FLAT_CAP[h];
    if (cap !== undefined) {
      // Premiums mostly 3bet; only a slowplay share flats (deliberate exception to monotonicity).
      const call = Math.round(Math.min(f, cap) * 100) / 100;
      return [h, { '3bet': Math.round((1 - call) * 100) / 100, call }];
    }
    const call = Math.round(f * 100) / 100;
    return [h, { call, fold: Math.round((1 - call) * 100) / 100 }];
  }));
}

function coldCallRange(hero: HeroClass, opener: OpenerClass, context: ContextClass, depth: StackDepth) {
  let grid: Map<string, FreqMap> | undefined;
  return (row: number, col: number): FreqMap =>
    (grid ??= coldCallGrid(hero, opener, context, depth)).get(handLabel(row, col))!;
}

export function getColdCallCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth < 25) return [];

  const positions = positionsForPlayerCount(maxPlayers);
  const charts: ChartDef[] = [];

  for (let heroIndex = 0; heroIndex < positions.length; heroIndex++) {
    const heroPosition = positions[heroIndex];
    const heroClass = positionClass(heroPosition);
    if (!heroClass || !HERO_CLASSES.includes(heroClass as HeroClass)) continue;

    for (let openerIndex = 0; openerIndex < heroIndex; openerIndex++) {
      const openerPosition = positions[openerIndex];
      if (openerPosition == 'BB') continue;
      const openerClass = positionClass(openerPosition);
      if (!openerClass) continue;

      charts.push({
        position: heroPosition,
        situation: 'Cold Call',
        vsPosition: openerPosition,
        category: 'Cold Call',
        description: `${heroPosition} call vs ${openerPosition} open (${depth}bb, ${maxPlayers}-max)`,
        stackDepth: depth,
        maxPlayers,
        actionTypes: COLD_CALL_3BET_ACTIONS,
        ranges: coldCallRange(heroClass as HeroClass, openerClass as OpenerClass, 'headsup', depth),
      });

      for (let callerIndex = openerIndex + 1; callerIndex < heroIndex; callerIndex++) {
        const callerPosition = positions[callerIndex];
        if (callerPosition == 'BB') continue;
        charts.push({
          position: heroPosition,
          situation: 'Cold Call',
          vsPosition: openerPosition,
          callerPosition: callerPosition,
          category: 'Cold Call',
          description: `${heroPosition} overcall vs ${openerPosition} open + ${callerPosition} call (${depth}bb, ${maxPlayers}-max)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: COLD_CALL_3BET_ACTIONS,
          ranges: coldCallRange(heroClass as HeroClass, openerClass as OpenerClass, 'multiway', depth),
        });
      }
    }
  }

  return charts;
}
