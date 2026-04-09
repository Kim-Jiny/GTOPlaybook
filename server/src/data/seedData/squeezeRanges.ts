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
import { SQUEEZE_ACTIONS } from './actionColors';

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

function decideAction(
  hand: string,
  hero: HeroClass,
  opener: OpenerClass,
  caller: CallerClass,
  depth: StackDepth,
): '3bet' | 'call' | 'fold' {
  const features = analyzeHand(hand);
  const base = squeezeScore(features)
    + heroAdjustment(hero)
    + openerAdjustment(opener)
    + callerAdjustment(caller);
  const profile = PROFILES[hero][opener][caller];
  const depthAdj = depthAdjustment(depth);

  const squeezeThreshold = profile.squeezeThreshold + depthAdj.squeeze;
  const callThreshold = profile.callThreshold + depthAdj.call;

  if (base >= squeezeThreshold) return '3bet';
  if (base >= callThreshold) return 'call';
  return 'fold';
}

function buildSqueezeSets(
  hero: HeroClass,
  opener: OpenerClass,
  caller: CallerClass,
  depth: StackDepth,
) {
  const squeeze = new Set<string>();
  const call = new Set<string>();

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      switch (decideAction(hand, hero, opener, caller, depth)) {
        case '3bet':
          squeeze.add(hand);
          break;
        case 'call':
          call.add(hand);
          break;
        case 'fold':
          break;
      }
    }
  }

  return { squeeze, call };
}

function squeezeRange(squeezeSet: Set<string>, callSet: Set<string>) {
  return (row: number, col: number): FreqMap => {
    const hand = handLabel(row, col);
    const currentKey = squeezeSet.has(hand) ? '3bet' : callSet.has(hand) ? 'call' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: '3bet', set: squeezeSet },
      { key: 'call', set: callSet },
    ]);
    if (smooth) return smooth;
    if (squeezeSet.has(hand)) return { '3bet': 1, call: 0, fold: 0 };
    if (callSet.has(hand)) return { '3bet': 0, call: 1, fold: 0 };
    return { '3bet': 0, call: 0, fold: 1 };
  };
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
        const { squeeze, call } = buildSqueezeSets(
          heroClass as HeroClass,
          openerClass as OpenerClass,
          callerClass,
          depth,
        );

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
          ranges: squeezeRange(squeeze, call),
        });
      }
    }
  }

  return charts;
}
