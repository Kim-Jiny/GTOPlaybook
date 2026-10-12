/**
 * Board-aware flop classification for the continuation-bet charts.
 *
 * Every starting-hand cell is expanded into its real card combos (blocked by the board),
 * each combo is classified against the actual flop (made hand, draws, overcards), and the
 * cell frequency is the average over its combos. This replaces the old position-based
 * heuristics that ignored the board entirely (e.g. a set of sevens on A72 was "an underpair").
 */
export type Card = { rank: number; suit: number }; // rank: 14 = A ... 2 = 2; suit: 0..3

const RANK_CHARS: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};
const SUITS = 's h d c';

export function parseBoard(text: string): Card[] {
  return text.split(/\s+/).map((c) => ({ rank: RANK_CHARS[c[0]], suit: SUITS.split(' ').indexOf(c[1]) }));
}

export type Bucket =
  | 'monster' | 'set' | 'twoPair' | 'overpair' | 'topPairGood' | 'topPairWeak' | 'midPair' | 'lowPair'
  | 'comboDraw' | 'flushDraw' | 'oesd' | 'gutshot' | 'overcards' | 'overcard' | 'air';

export const BUCKETS: Bucket[] = [
  'monster', 'set', 'twoPair', 'overpair', 'topPairGood', 'topPairWeak', 'midPair', 'lowPair',
  'comboDraw', 'flushDraw', 'oesd', 'gutshot', 'overcards', 'overcard', 'air',
];

/** Distinct completing ranks for any straight window made of 4 of the 5 held/board ranks. */
function straightOuts(values: Set<number>): { made: boolean; outs: number } {
  const has = (v: number) => values.has(v) || (v === 1 && values.has(14));
  const outs = new Set<number>();
  for (let low = 1; low <= 10; low++) {
    const window = [low, low + 1, low + 2, low + 3, low + 4];
    const present = window.filter(has);
    if (present.length === 5) return { made: true, outs: 0 };
    if (present.length === 4) {
      const missing = window.find((v) => !has(v))!;
      outs.add(missing === 1 ? 14 : missing);
    }
  }
  return { made: false, outs: outs.size };
}

export function classify(hole: [Card, Card], board: Card[]): Bucket {
  const all = [...hole, ...board];
  const counts = new Map<number, number>();
  for (const c of all) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);

  const suitCount = [0, 0, 0, 0];
  for (const c of all) suitCount[c.suit]++;
  const flushSuit = suitCount.findIndex((n) => n >= 5);
  const fdSuit = suitCount.findIndex((n, s) => n === 4 && hole.some((c) => c.suit === s));
  const hasFlushDraw = fdSuit >= 0;

  const { made: straight, outs } = straightOuts(new Set(all.map((c) => c.rank)));
  const groups = [...counts.values()].sort((a, b) => b - a);
  if (flushSuit >= 0 || straight || groups[0] >= 4 || (groups[0] === 3 && groups[1] >= 2)) return 'monster';

  const boardRanks = board.map((c) => c.rank).sort((a, b) => b - a);
  const top = boardRanks[0];
  const boardPaired = new Set(boardRanks).size < boardRanks.length;
  const [h1, h2] = hole;
  const pocket = h1.rank === h2.rank;

  // Trips / sets: three of a kind that uses a hole card.
  if (groups[0] === 3) return 'set';

  // Pairs that involve at least one hole card.
  const holePairRanks = new Set<number>();
  for (const r of new Set([h1.rank, h2.rank])) if ((counts.get(r) ?? 0) >= 2) holePairRanks.add(r);

  let made: Bucket | null = null;
  if (holePairRanks.size === 2 || (boardPaired && holePairRanks.size >= 1 && !pocket)) {
    made = 'twoPair';
  } else if (pocket) {
    // pocket pair that did not hit the board
    if (h1.rank > top) made = 'overpair';
    else if (h1.rank > boardRanks[boardRanks.length - 1]) made = 'midPair';
    else made = 'lowPair';
    if (boardPaired && made !== 'overpair') made = 'midPair'; // two pair, but weak (board pair plays)
  } else if (holePairRanks.size === 1) {
    const paired = [...holePairRanks][0];
    const other = h1.rank === paired ? h2.rank : h1.rank;
    const distinct = [...new Set(boardRanks)];
    const position = distinct.indexOf(paired); // 0 = top pair
    if (position === 0) made = other >= 11 ? 'topPairGood' : 'topPairWeak';
    else if (position === 1) made = 'midPair';
    else made = 'lowPair';
  }

  const comboDraw = hasFlushDraw && outs > 0;
  const strongDraw: Bucket | null = comboDraw ? 'comboDraw' : hasFlushDraw ? 'flushDraw' : outs >= 2 ? 'oesd' : outs === 1 ? 'gutshot' : null;

  // A made pair plus a draw is at least as strong as the draw alone.
  if (made) {
    if (strongDraw === 'comboDraw' || strongDraw === 'flushDraw' || strongDraw === 'oesd') {
      return made === 'lowPair' || made === 'midPair' ? strongDraw : made;
    }
    return made;
  }
  if (strongDraw) return strongDraw;

  const over = [h1.rank, h2.rank].filter((r) => r > top).length;
  if (over === 2) return 'overcards';
  if (over === 1) return 'overcard';
  return 'air';
}

/** Average a per-bucket value over every real combo of a starting-hand cell. */
export function cellBuckets(row: number, col: number, board: Card[]): Map<Bucket, number> {
  const rankFor = (i: number) => 14 - i; // grid index 0 = A
  const r1 = rankFor(row);
  const r2 = rankFor(col);
  const suited = row < col;
  const pair = row === col;
  const blocked = new Set(board.map((c) => `${c.rank}-${c.suit}`));
  const combos: [Card, Card][] = [];

  for (let s1 = 0; s1 < 4; s1++) {
    for (let s2 = 0; s2 < 4; s2++) {
      if (pair && s2 <= s1) continue;
      if (suited && s1 !== s2) continue;
      if (!pair && !suited && s1 === s2) continue;
      const a = { rank: r1, suit: s1 };
      const b = { rank: r2, suit: s2 };
      if (blocked.has(`${a.rank}-${a.suit}`) || blocked.has(`${b.rank}-${b.suit}`)) continue;
      combos.push([a, b]);
    }
  }

  const out = new Map<Bucket, number>();
  for (const [a, b] of combos) {
    const bucket = classify([a, b], board);
    out.set(bucket, (out.get(bucket) ?? 0) + 1 / combos.length);
  }
  return out;
}
