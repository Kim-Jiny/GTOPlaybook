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
import { ISO_RAISE_ACTIONS } from './actionColors';

type HeroClass = 'hj' | 'co' | 'btn' | 'sb';
type LimperClass = 'ep' | 'hj' | 'co' | 'btn';

type IsoProfile = {
  raiseThreshold: number;
  callThreshold: number;
};

type HandFeatures = {
  ranks: [number, number];
  pair: boolean;
  suited: boolean;
  broadwayCount: number;
  connectorGap: number;
  wheelAce: boolean;
  ace: boolean;
  kingHigh: boolean;
};

const VALUE_BY_RANK: Record<string, number> = Object.fromEntries(
  RANKS.map((rank, index) => [rank, 14 - index]),
) as Record<string, number>;

const HERO_POSITIONS: HeroClass[] = ['hj', 'co', 'btn', 'sb'];

const ISO_PROFILES: Record<HeroClass, Record<LimperClass, IsoProfile>> = {
  hj: {
    ep: { raiseThreshold: 8.8, callThreshold: 7.1 },
    hj: { raiseThreshold: 8.3, callThreshold: 6.8 },
    co: { raiseThreshold: 8.0, callThreshold: 6.4 },
    btn: { raiseThreshold: 8.0, callThreshold: 6.3 },
  },
  co: {
    ep: { raiseThreshold: 8.4, callThreshold: 6.8 },
    hj: { raiseThreshold: 7.9, callThreshold: 6.4 },
    co: { raiseThreshold: 7.7, callThreshold: 6.0 },
    btn: { raiseThreshold: 7.7, callThreshold: 5.9 },
  },
  btn: {
    ep: { raiseThreshold: 8.0, callThreshold: 6.2 },
    hj: { raiseThreshold: 7.5, callThreshold: 5.8 },
    co: { raiseThreshold: 7.2, callThreshold: 5.3 },
    btn: { raiseThreshold: 7.1, callThreshold: 5.2 },
  },
  sb: {
    ep: { raiseThreshold: 8.4, callThreshold: 6.3 },
    hj: { raiseThreshold: 8.0, callThreshold: 5.9 },
    co: { raiseThreshold: 7.7, callThreshold: 5.5 },
    btn: { raiseThreshold: 7.6, callThreshold: 5.4 },
  },
};

function positionClass(position: string): HeroClass | LimperClass | null {
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

function depthAdjustment(depth: StackDepth): { raise: number; call: number } {
  switch (depth) {
    case 25:
      return { raise: 0.25, call: 0.15 };
    case 40:
      return { raise: 0.1, call: 0.05 };
    case 60:
      return { raise: 0, call: 0 };
    case 100:
      return { raise: -0.05, call: -0.1 };
    default:
      return { raise: 0.3, call: 0.2 };
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
    wheelAce: hi == 14 && lo <= 5,
    ace: hi == 14,
    kingHigh: hi == 13,
  };
}

function isoScore(features: HandFeatures): number {
  const [hi, lo] = features.ranks;

  if (features.pair) {
    return 7.4 + (hi * 0.34);
  }

  if (features.ace) {
    const wheelBonus = lo == 5
        ? 1.35
        : lo == 4
            ? 1.05
            : lo == 3
                ? 0.78
                : lo == 2
                    ? 0.56
                    : 0;
    if (features.suited) {
      return 5.8 + (lo * 0.24) + wheelBonus;
    }
    return 4.55 + (lo * 0.22) + (lo >= 10 ? 0.4 : 0);
  }

  if (features.broadwayCount == 2) {
    return (features.suited ? 5.9 : 4.85) + ((hi + lo) * (features.suited ? 0.11 : 0.09));
  }

  if (features.suited && features.kingHigh) {
    return 4.8 + (lo * 0.18);
  }

  if (features.suited) {
    const connectivityBonus = features.connectorGap <= 1
        ? 1.1
        : features.connectorGap == 2
            ? 0.72
            : features.connectorGap == 3
                ? 0.35
                : 0;
    return 3.0 + (hi * 0.16) + (lo * 0.08) + connectivityBonus;
  }

  if (features.kingHigh) {
    return 3.6 + (lo * 0.16);
  }

  return 1.8 + (hi * 0.12) + (lo * 0.05);
}

function heroAdjustment(hero: HeroClass): number {
  switch (hero) {
    case 'hj':
      return -0.25;
    case 'co':
      return 0.05;
    case 'btn':
      return 0.35;
    case 'sb':
      return 0.18;
  }
}

function limperAdjustment(limper: LimperClass): number {
  switch (limper) {
    case 'ep':
      return -0.35;
    case 'hj':
      return -0.05;
    case 'co':
      return 0.18;
    case 'btn':
      return 0.25;
  }
}

function decideAction(
  hand: string,
  hero: HeroClass,
  limper: LimperClass,
  depth: StackDepth,
): 'raise' | 'call' | 'fold' {
  const features = analyzeHand(hand);
  const base = isoScore(features) + heroAdjustment(hero) + limperAdjustment(limper);
  const profile = ISO_PROFILES[hero][limper];
  const depthAdj = depthAdjustment(depth);

  const raiseThreshold = profile.raiseThreshold + depthAdj.raise;
  const callThreshold = profile.callThreshold + depthAdj.call;

  if (base >= raiseThreshold) return 'raise';
  if (base >= callThreshold) return 'call';
  return 'fold';
}

function buildIsoSets(hero: HeroClass, limper: LimperClass, depth: StackDepth) {
  const raise = new Set<string>();
  const call = new Set<string>();

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      switch (decideAction(hand, hero, limper, depth)) {
        case 'raise':
          raise.add(hand);
          break;
        case 'call':
          call.add(hand);
          break;
        case 'fold':
          break;
      }
    }
  }

  return { raise, call };
}

function isoRange(raiseSet: Set<string>, callSet: Set<string>) {
  return (row: number, col: number): FreqMap => {
    const hand = handLabel(row, col);
    const currentKey = raiseSet.has(hand) ? 'raise' : callSet.has(hand) ? 'call' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: 'raise', set: raiseSet },
      { key: 'call', set: callSet },
    ]);
    if (smooth) return smooth;
    if (raiseSet.has(hand)) return { raise: 1, call: 0, fold: 0 };
    if (callSet.has(hand)) return { raise: 0, call: 1, fold: 0 };
    return { raise: 0, call: 0, fold: 1 };
  };
}

export function getIsoRaiseCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth < 25) return [];

  const positions = positionsForPlayerCount(maxPlayers);
  const charts: ChartDef[] = [];

  for (let heroIndex = 0; heroIndex < positions.length; heroIndex++) {
    const heroPosition = positions[heroIndex];
    if (heroPosition == 'BB') continue;

    const heroClass = positionClass(heroPosition);
    if (!heroClass || !HERO_POSITIONS.includes(heroClass as HeroClass)) continue;

    for (let limperIndex = 0; limperIndex < heroIndex; limperIndex++) {
      const limperPosition = positions[limperIndex];
      if (limperPosition == 'BB') continue;

      const limperClass = positionClass(limperPosition);
      if (!limperClass || limperClass == 'sb') continue;

      const { raise, call } = buildIsoSets(
        heroClass as HeroClass,
        limperClass as LimperClass,
        depth,
      );

      charts.push({
        position: heroPosition,
        situation: 'Iso Raise vs Limp',
        vsPosition: limperPosition,
        category: 'Iso Raise vs Limp',
        description: `${heroPosition} iso vs ${limperPosition} limp (${depth}bb, ${maxPlayers}-max)`,
        stackDepth: depth,
        maxPlayers,
        actionTypes: ISO_RAISE_ACTIONS,
        ranges: isoRange(raise, call),
      });
    }
  }

  return charts;
}
