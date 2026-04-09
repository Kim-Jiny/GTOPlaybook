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
import { COLD_CALL_ACTIONS } from './actionColors';

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

const HERO_CLASSES: HeroClass[] = ['hj', 'co', 'btn', 'sb', 'bb'];

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

function decideAction(
  hand: string,
  hero: HeroClass,
  opener: OpenerClass,
  context: ContextClass,
  depth: StackDepth,
): 'call' | 'fold' {
  const base = callScore(analyzeHand(hand))
    + heroAdjustment(hero)
    + openerAdjustment(opener)
    + contextAdjustment(context);
  const threshold = PROFILES[hero][opener][context].callThreshold + depthAdjustment(depth);
  return base >= threshold ? 'call' : 'fold';
}

function buildCallSet(
  hero: HeroClass,
  opener: OpenerClass,
  context: ContextClass,
  depth: StackDepth,
) {
  const call = new Set<string>();
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      if (decideAction(hand, hero, opener, context, depth) == 'call') {
        call.add(hand);
      }
    }
  }
  return call;
}

function coldCallRange(callSet: Set<string>) {
  return (row: number, col: number): FreqMap => {
    const hand = handLabel(row, col);
    const currentKey = callSet.has(hand) ? 'call' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [{ key: 'call', set: callSet }]);
    if (smooth) return smooth;
    if (callSet.has(hand)) return { call: 1, fold: 0 };
    return { call: 0, fold: 1 };
  };
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

      const headsupSet = buildCallSet(heroClass as HeroClass, openerClass as OpenerClass, 'headsup', depth);
      charts.push({
        position: heroPosition,
        situation: 'Cold Call',
        vsPosition: openerPosition,
        category: 'Cold Call',
        description: `${heroPosition} call vs ${openerPosition} open (${depth}bb, ${maxPlayers}-max)`,
        stackDepth: depth,
        maxPlayers,
        actionTypes: COLD_CALL_ACTIONS,
        ranges: coldCallRange(headsupSet),
      });

      for (let callerIndex = openerIndex + 1; callerIndex < heroIndex; callerIndex++) {
        const callerPosition = positions[callerIndex];
        if (callerPosition == 'BB') continue;
        const multiwaySet = buildCallSet(heroClass as HeroClass, openerClass as OpenerClass, 'multiway', depth);
        charts.push({
          position: heroPosition,
          situation: 'Cold Call',
          vsPosition: openerPosition,
          callerPosition: callerPosition,
          category: 'Cold Call',
          description: `${heroPosition} overcall vs ${openerPosition} open + ${callerPosition} call (${depth}bb, ${maxPlayers}-max)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: COLD_CALL_ACTIONS,
          ranges: coldCallRange(multiwaySet),
        });
      }
    }
  }

  return charts;
}
