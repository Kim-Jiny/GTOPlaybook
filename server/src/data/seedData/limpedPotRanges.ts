import {
  ChartDef,
  FreqMap,
  MaxPlayers,
  RANKS,
  StackDepth,
  handLabel,
  smoothFrequencies,
} from './helpers';
import { LIMPED_POT_ACTIONS } from './actionColors';

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

const VALUE_BY_RANK: Record<string, number> = Object.fromEntries(
  RANKS.map((rank, index) => [rank, 14 - index]),
) as Record<string, number>;

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

function limpAttackScore(features: HandFeatures): number {
  const [hi, lo] = features.ranks;

  if (features.pair) return 7.2 + (hi * 0.34);

  if (features.ace) {
    const wheelBonus = lo == 5
      ? 1.2
      : lo == 4
        ? 0.96
        : lo == 3
          ? 0.72
          : lo == 2
            ? 0.56
            : 0;
    if (features.suited) return 5.8 + (lo * 0.24) + wheelBonus;
    return 4.7 + (lo * 0.22);
  }

  if (features.broadwayCount == 2) {
    return (features.suited ? 5.9 : 4.9) + ((hi + lo) * (features.suited ? 0.11 : 0.09));
  }

  if (features.suited && features.kingHigh) return 4.8 + (lo * 0.18);

  if (features.suited) {
    const connectivityBonus = features.connectorGap <= 1
      ? 1.15
      : features.connectorGap == 2
        ? 0.78
        : features.connectorGap == 3
          ? 0.38
          : 0;
    return 3.1 + (hi * 0.16) + (lo * 0.08) + connectivityBonus;
  }

  if (features.kingHigh) return 3.5 + (lo * 0.16);

  return 1.9 + (hi * 0.12) + (lo * 0.05);
}

function raiseThreshold(depth: StackDepth): number {
  switch (depth) {
    case 25:
      return 7.45;
    case 40:
      return 7.25;
    case 60:
      return 7.05;
    case 100:
      return 6.95;
    default:
      return 7.5;
  }
}

function buildRaiseSet(depth: StackDepth) {
  const raise = new Set<string>();
  const threshold = raiseThreshold(depth);

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      if (limpAttackScore(analyzeHand(hand)) >= threshold) {
        raise.add(hand);
      }
    }
  }

  return raise;
}

function limpedPotRange(raiseSet: Set<string>) {
  return (row: number, col: number): FreqMap => {
    const hand = handLabel(row, col);
    const currentKey = raiseSet.has(hand) ? 'raise' : 'check';
    const smooth = smoothFrequencies(row, col, currentKey, [{ key: 'raise', set: raiseSet }]);
    if (smooth) {
      return { raise: smooth.raise ?? 0, check: smooth.fold ?? 0 };
    }
    if (raiseSet.has(hand)) return { raise: 1, check: 0 };
    return { raise: 0, check: 1 };
  };
}

export function getLimpedPotCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth < 25) return [];
  if (maxPlayers < 2) return [];

  const raiseSet = buildRaiseSet(depth);

  return [
    {
      position: 'BB',
      situation: 'Limped Pot',
      vsPosition: 'SB',
      category: 'Limped Pot',
      description: `BB attack vs SB limp (${depth}bb, ${maxPlayers}-max)`,
      stackDepth: depth,
      maxPlayers,
      actionTypes: LIMPED_POT_ACTIONS,
      ranges: limpedPotRange(raiseSet),
    },
  ];
}
