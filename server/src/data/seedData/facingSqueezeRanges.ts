import {
  ChartDef,
  FreqMap,
  MaxPlayers,
  RANKS,
  StackDepth,
  handLabel,
  positionsForPlayerCount,
  smoothFrequencies,
} from './helpers';
import { FACING_3BET_ACTIONS } from './actionColors';

type HeroClass = 'ep' | 'hj' | 'co' | 'btn' | 'sb';
type CallerClass = 'tight' | 'late' | 'blind';
type SqueezerClass = 'tight' | 'late' | 'blind';

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

type FacingSqueezeProfile = {
  fourBetThreshold: number;
  callThreshold: number;
};

type FacingSqueezeMixed = Record<string, { '4bet': number; call: number; fold: number }>;

const VALUE_BY_RANK: Record<string, number> = Object.fromEntries(
  RANKS.map((rank, index) => [rank, 14 - index]),
) as Record<string, number>;

const HERO_CLASSES: HeroClass[] = ['ep', 'hj', 'co', 'btn', 'sb'];

const PROFILES: Record<HeroClass, Record<CallerClass, Record<SqueezerClass, FacingSqueezeProfile>>> = {
  ep: {
    tight: {
      tight: { fourBetThreshold: 10.2, callThreshold: 8.35 },
      late: { fourBetThreshold: 9.95, callThreshold: 8.1 },
      blind: { fourBetThreshold: 9.9, callThreshold: 8.0 },
    },
    late: {
      tight: { fourBetThreshold: 10.0, callThreshold: 8.2 },
      late: { fourBetThreshold: 9.7, callThreshold: 7.95 },
      blind: { fourBetThreshold: 9.65, callThreshold: 7.9 },
    },
    blind: {
      tight: { fourBetThreshold: 10.0, callThreshold: 8.15 },
      late: { fourBetThreshold: 9.7, callThreshold: 7.9 },
      blind: { fourBetThreshold: 9.6, callThreshold: 7.85 },
    },
  },
  hj: {
    tight: {
      tight: { fourBetThreshold: 9.8, callThreshold: 8.0 },
      late: { fourBetThreshold: 9.45, callThreshold: 7.7 },
      blind: { fourBetThreshold: 9.4, callThreshold: 7.65 },
    },
    late: {
      tight: { fourBetThreshold: 9.55, callThreshold: 7.8 },
      late: { fourBetThreshold: 9.2, callThreshold: 7.5 },
      blind: { fourBetThreshold: 9.15, callThreshold: 7.45 },
    },
    blind: {
      tight: { fourBetThreshold: 9.5, callThreshold: 7.8 },
      late: { fourBetThreshold: 9.15, callThreshold: 7.5 },
      blind: { fourBetThreshold: 9.1, callThreshold: 7.4 },
    },
  },
  co: {
    tight: {
      tight: { fourBetThreshold: 9.35, callThreshold: 7.55 },
      late: { fourBetThreshold: 9.0, callThreshold: 7.25 },
      blind: { fourBetThreshold: 8.95, callThreshold: 7.2 },
    },
    late: {
      tight: { fourBetThreshold: 9.05, callThreshold: 7.3 },
      late: { fourBetThreshold: 8.7, callThreshold: 7.0 },
      blind: { fourBetThreshold: 8.65, callThreshold: 6.95 },
    },
    blind: {
      tight: { fourBetThreshold: 9.0, callThreshold: 7.3 },
      late: { fourBetThreshold: 8.65, callThreshold: 7.0 },
      blind: { fourBetThreshold: 8.6, callThreshold: 6.9 },
    },
  },
  btn: {
    tight: {
      tight: { fourBetThreshold: 9.0, callThreshold: 7.2 },
      late: { fourBetThreshold: 8.7, callThreshold: 6.95 },
      blind: { fourBetThreshold: 8.55, callThreshold: 6.85 },
    },
    late: {
      tight: { fourBetThreshold: 8.8, callThreshold: 7.0 },
      late: { fourBetThreshold: 8.45, callThreshold: 6.7 },
      blind: { fourBetThreshold: 8.35, callThreshold: 6.6 },
    },
    blind: {
      tight: { fourBetThreshold: 8.75, callThreshold: 6.95 },
      late: { fourBetThreshold: 8.4, callThreshold: 6.65 },
      blind: { fourBetThreshold: 8.3, callThreshold: 6.55 },
    },
  },
  sb: {
    tight: {
      tight: { fourBetThreshold: 9.1, callThreshold: 7.25 },
      late: { fourBetThreshold: 8.8, callThreshold: 6.95 },
      blind: { fourBetThreshold: 8.7, callThreshold: 6.9 },
    },
    late: {
      tight: { fourBetThreshold: 8.9, callThreshold: 7.05 },
      late: { fourBetThreshold: 8.6, callThreshold: 6.75 },
      blind: { fourBetThreshold: 8.5, callThreshold: 6.65 },
    },
    blind: {
      tight: { fourBetThreshold: 8.85, callThreshold: 7.0 },
      late: { fourBetThreshold: 8.55, callThreshold: 6.7 },
      blind: { fourBetThreshold: 8.45, callThreshold: 6.6 },
    },
  },
};

const FACING_SQUEEZE_MIXED: FacingSqueezeMixed = {
  'QQ': { '4bet': 0.38, call: 0.62, fold: 0 },
  'JJ': { '4bet': 0.18, call: 0.68, fold: 0.14 },
  'TT': { '4bet': 0.06, call: 0.62, fold: 0.32 },
  'AKs': { '4bet': 0.48, call: 0.52, fold: 0 },
  'AKo': { '4bet': 0.32, call: 0.5, fold: 0.18 },
  'AQs': { '4bet': 0.18, call: 0.56, fold: 0.26 },
  'AQo': { '4bet': 0.08, call: 0.42, fold: 0.5 },
  'AJs': { '4bet': 0.04, call: 0.48, fold: 0.48 },
  'KQs': { '4bet': 0.02, call: 0.54, fold: 0.44 },
  'A5s': { '4bet': 0.28, call: 0.18, fold: 0.54 },
  'A4s': { '4bet': 0.22, call: 0.14, fold: 0.64 },
};

function positionClass(position: string): HeroClass | null {
  switch (position) {
    case 'HJ':
      return 'hj';
    case 'CO':
      return 'co';
    case 'BTN':
      return 'btn';
    case 'SB':
      return 'sb';
    case 'UTG':
    case 'UTG+1':
    case 'UTG+2':
    case 'MP':
      return 'ep';
    default:
      return null;
  }
}

function classifyCaller(position: string): CallerClass {
  switch (position) {
    case 'CO':
    case 'BTN':
      return 'late';
    case 'SB':
    case 'BB':
      return 'blind';
    default:
      return 'tight';
  }
}

function classifySqueezer(position: string): SqueezerClass {
  switch (position) {
    case 'CO':
    case 'BTN':
      return 'late';
    case 'SB':
    case 'BB':
      return 'blind';
    default:
      return 'tight';
  }
}

function depthAdjustment(depth: StackDepth): { fourBet: number; call: number } {
  switch (depth) {
    case 25:
      return { fourBet: 0.22, call: 0.16 };
    case 40:
      return { fourBet: 0.08, call: 0.06 };
    case 60:
      return { fourBet: 0, call: 0 };
    case 100:
      return { fourBet: -0.06, call: -0.08 };
    default:
      return { fourBet: 0.24, call: 0.18 };
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

function continueScore(features: HandFeatures): number {
  const [hi, lo] = features.ranks;

  if (features.pair) return 7.3 + (hi * 0.35);

  if (features.ace) {
    const wheelBonus = lo == 5
      ? 1.15
      : lo == 4
        ? 0.92
        : lo == 3
          ? 0.68
          : lo == 2
            ? 0.52
            : 0;
    if (features.suited) return 5.8 + (lo * 0.22) + wheelBonus;
    return 4.5 + (lo * 0.2) + (lo >= 10 ? 0.4 : 0);
  }

  if (features.broadwayCount == 2) {
    return (features.suited ? 5.95 : 4.95) + ((hi + lo) * (features.suited ? 0.11 : 0.09));
  }

  if (features.suited && features.kingHigh) return 4.8 + (lo * 0.18);

  if (features.suited) {
    const connectivityBonus = features.connectorGap <= 1
      ? 1.08
      : features.connectorGap == 2
        ? 0.72
        : features.connectorGap == 3
          ? 0.32
          : 0;
    return 3.0 + (hi * 0.16) + (lo * 0.08) + connectivityBonus;
  }

  if (features.kingHigh) return 3.5 + (lo * 0.15);

  return 1.7 + (hi * 0.11) + (lo * 0.05);
}

function heroAdjustment(hero: HeroClass): number {
  switch (hero) {
    case 'ep':
      return -0.18;
    case 'hj':
      return -0.04;
    case 'co':
      return 0.12;
    case 'btn':
      return 0.28;
    case 'sb':
      return 0.18;
  }
}

function callerAdjustment(caller: CallerClass): number {
  switch (caller) {
    case 'tight':
      return 0.14;
    case 'late':
      return 0.24;
    case 'blind':
      return 0.2;
  }
}

function squeezerAdjustment(squeezer: SqueezerClass): number {
  switch (squeezer) {
    case 'tight':
      return -0.22;
    case 'late':
      return 0.05;
    case 'blind':
      return 0.12;
  }
}

function decideAction(
  hand: string,
  hero: HeroClass,
  caller: CallerClass,
  squeezer: SqueezerClass,
  depth: StackDepth,
): '4bet' | 'call' | 'fold' {
  const features = analyzeHand(hand);
  const score = continueScore(features)
    + heroAdjustment(hero)
    + callerAdjustment(caller)
    + squeezerAdjustment(squeezer);
  const profile = PROFILES[hero][caller][squeezer];
  const adj = depthAdjustment(depth);

  if (score >= profile.fourBetThreshold + adj.fourBet) return '4bet';
  if (score >= profile.callThreshold + adj.call) return 'call';
  return 'fold';
}

function buildSets(
  hero: HeroClass,
  caller: CallerClass,
  squeezer: SqueezerClass,
  depth: StackDepth,
) {
  const fourBet = new Set<string>();
  const call = new Set<string>();

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      switch (decideAction(hand, hero, caller, squeezer, depth)) {
        case '4bet':
          fourBet.add(hand);
          break;
        case 'call':
          call.add(hand);
          break;
        case 'fold':
          break;
      }
    }
  }

  return { fourBet, call };
}

function facingSqueezeRange(fourBetSet: Set<string>, callSet: Set<string>) {
  return (row: number, col: number): FreqMap => {
    const hand = handLabel(row, col);
    if (hand in FACING_SQUEEZE_MIXED) return FACING_SQUEEZE_MIXED[hand];

    const currentKey = fourBetSet.has(hand) ? '4bet' : callSet.has(hand) ? 'call' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: '4bet', set: fourBetSet },
      { key: 'call', set: callSet },
    ]);
    if (smooth) return smooth;

    if (fourBetSet.has(hand)) return { '4bet': 1, call: 0, fold: 0 };
    if (callSet.has(hand)) return { '4bet': 0, call: 1, fold: 0 };
    return { '4bet': 0, call: 0, fold: 1 };
  };
}

export function getFacingSqueezeCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth < 25) return [];

  const positions = positionsForPlayerCount(maxPlayers);
  const charts: ChartDef[] = [];

  for (let openerIndex = 0; openerIndex < positions.length; openerIndex++) {
    const opener = positions[openerIndex];
    if (opener == 'BB') continue;

    const heroClass = positionClass(opener);
    if (!heroClass || !HERO_CLASSES.includes(heroClass)) continue;

    for (let callerIndex = openerIndex + 1; callerIndex < positions.length; callerIndex++) {
      const caller = positions[callerIndex];
      if (caller == 'BB' && opener == 'SB') continue;
      if (caller == 'BB' && callerIndex <= openerIndex) continue;

      for (let squeezerIndex = callerIndex + 1; squeezerIndex < positions.length; squeezerIndex++) {
        const squeezer = positions[squeezerIndex];
        if (squeezer == 'BB' && caller == 'BB') continue;

        const { fourBet, call } = buildSets(
          heroClass,
          classifyCaller(caller),
          classifySqueezer(squeezer),
          depth,
        );

        charts.push({
          position: opener,
          situation: 'Facing Squeeze',
          vsPosition: squeezer,
          category: 'Facing Squeeze',
          description: `${opener} facing ${squeezer} squeeze after ${caller} call (${depth}bb, ${maxPlayers}-max)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_ACTIONS,
          ranges: facingSqueezeRange(fourBet, call),
        });
      }
    }
  }

  return charts;
}
