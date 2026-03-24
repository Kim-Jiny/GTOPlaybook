import { Card, EvaluatedHand, HandRank, Rank } from './types';

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const HAND_RANK_VALUES: Record<HandRank, number> = {
  high_card: 1,
  pair: 2,
  two_pair: 3,
  three_of_a_kind: 4,
  straight: 5,
  flush: 6,
  full_house: 7,
  four_of_a_kind: 8,
  straight_flush: 9,
  royal_flush: 10,
};

function combinations(cards: Card[], k: number): Card[][] {
  const result: Card[][] = [];
  function helper(start: number, combo: Card[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

function sortByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
}

function evaluate5(cards: Card[]): EvaluatedHand {
  const sorted = sortByRank(cards);
  const values = sorted.map((c) => RANK_VALUES[c.rank]);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight (including A-low: A2345)
  let isStraight = false;
  let straightHighValue = 0;
  if (values[0] - values[4] === 4 && new Set(values).size === 5) {
    isStraight = true;
    straightHighValue = values[0];
  } else if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHighValue = 5; // wheel
  }

  // Count ranks
  const rankCounts = new Map<number, number>();
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1);
  }
  const counts = Array.from(rankCounts.entries())
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  if (isFlush && isStraight) {
    const rank: HandRank = straightHighValue === 14 ? 'royal_flush' : 'straight_flush';
    return {
      rank,
      value: computeValue(rank, [straightHighValue]),
      cards: sorted,
      description: rank === 'royal_flush' ? 'Royal Flush' : `Straight Flush, ${rankName(straightHighValue)} high`,
    };
  }

  if (counts[0][1] === 4) {
    return {
      rank: 'four_of_a_kind',
      value: computeValue('four_of_a_kind', [counts[0][0], counts[1][0]]),
      cards: sorted,
      description: `Four of a Kind, ${rankName(counts[0][0])}s`,
    };
  }

  if (counts[0][1] === 3 && counts[1][1] === 2) {
    return {
      rank: 'full_house',
      value: computeValue('full_house', [counts[0][0], counts[1][0]]),
      cards: sorted,
      description: `Full House, ${rankName(counts[0][0])}s full of ${rankName(counts[1][0])}s`,
    };
  }

  if (isFlush) {
    return {
      rank: 'flush',
      value: computeValue('flush', values),
      cards: sorted,
      description: `Flush, ${rankName(values[0])} high`,
    };
  }

  if (isStraight) {
    return {
      rank: 'straight',
      value: computeValue('straight', [straightHighValue]),
      cards: sorted,
      description: `Straight, ${rankName(straightHighValue)} high`,
    };
  }

  if (counts[0][1] === 3) {
    const kickers = counts.slice(1).map((c) => c[0]);
    return {
      rank: 'three_of_a_kind',
      value: computeValue('three_of_a_kind', [counts[0][0], ...kickers]),
      cards: sorted,
      description: `Three of a Kind, ${rankName(counts[0][0])}s`,
    };
  }

  if (counts[0][1] === 2 && counts[1][1] === 2) {
    const kicker = counts[2][0];
    return {
      rank: 'two_pair',
      value: computeValue('two_pair', [counts[0][0], counts[1][0], kicker]),
      cards: sorted,
      description: `Two Pair, ${rankName(counts[0][0])}s and ${rankName(counts[1][0])}s`,
    };
  }

  if (counts[0][1] === 2) {
    const kickers = counts.slice(1).map((c) => c[0]);
    return {
      rank: 'pair',
      value: computeValue('pair', [counts[0][0], ...kickers]),
      cards: sorted,
      description: `Pair of ${rankName(counts[0][0])}s`,
    };
  }

  return {
    rank: 'high_card',
    value: computeValue('high_card', values),
    cards: sorted,
    description: `${rankName(values[0])} High`,
  };
}

function computeValue(rank: HandRank, kickers: number[]): number {
  let value = HAND_RANK_VALUES[rank] * 10_000_000_000;
  for (let i = 0; i < kickers.length && i < 5; i++) {
    value += kickers[i] * Math.pow(15, 4 - i);
  }
  return value;
}

function rankName(value: number): string {
  const names: Record<number, string> = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
    9: '9', 10: 'Ten', 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace',
  };
  return names[value] || String(value);
}

/** Evaluate best 5-card hand from 7 cards */
export function evaluateHand(cards: Card[]): EvaluatedHand {
  const combos = combinations(cards, 5);
  let best: EvaluatedHand | null = null;
  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || result.value > best.value) {
      best = result;
    }
  }
  return best!;
}

/** Compare two evaluated hands. Returns >0 if a wins, <0 if b wins, 0 for tie */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  return a.value - b.value;
}
