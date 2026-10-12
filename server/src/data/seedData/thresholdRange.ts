/**
 * Turn a hand score and descending action thresholds into per-hand frequencies.
 *
 * Each tier's cumulative share ramps up across ±HALF_WIDTH around its threshold, so
 * only borderline hands mix and nothing leaks into distant hands (unlike neighbour
 * smoothing). Every tier is then made monotone in hand strength, because raw scores
 * can rank e.g. KJs above AQs.
 */
import { FreqMap, handLabel } from './helpers';
import { enforceMonotone } from './rfiTables';

const HALF_WIDTH = 0.35;
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Tier {
  key: string;
  threshold: number;
}

export function thresholdGrid(
  score: (hand: string) => number,
  tiers: Tier[], // most demanding first (e.g. raise, then call)
  restKey: string, // what is left over: 'fold' or 'check'
): Map<string, FreqMap> {
  const hands: string[] = [];
  for (let row = 0; row < 13; row++) for (let col = 0; col < 13; col++) hands.push(handLabel(row, col));

  // cumulative[i] = share of hands that play tier i or any more demanding tier
  const cumulative: Array<Map<string, number>> = tiers.map((tier) => {
    const m = new Map<string, number>();
    for (const hand of hands) {
      const f = (score(hand) - (tier.threshold - HALF_WIDTH)) / (2 * HALF_WIDTH);
      m.set(hand, Math.min(1, Math.max(0, f)));
    }
    enforceMonotone((h) => m.get(h)!, (h, f) => m.set(h, f));
    return m;
  });

  const out = new Map<string, FreqMap>();
  for (const hand of hands) {
    const freqs: FreqMap = {};
    let prev = 0;
    for (let i = 0; i < tiers.length; i++) {
      const cum = Math.max(prev, cumulative[i].get(hand)!);
      freqs[tiers[i].key] = round2(cum - prev);
      prev = cum;
    }
    freqs[restKey] = round2(1 - prev);
    out.set(hand, freqs);
  }
  return out;
}

/** Lazily-built range function over a grid (computed once per chart). */
export function lazyRange(build: () => Map<string, FreqMap>) {
  let grid: Map<string, FreqMap> | undefined;
  return (row: number, col: number): FreqMap => (grid ??= build()).get(handLabel(row, col))!;
}

/**
 * Build the 169-hand grid from a raw per-hand function and make it monotone:
 * for each cumulative group of `orderedKeys` (most aggressive first), a stronger hand
 * never plays that group less often than a weaker one (wheel-ace bluffs exempt).
 * Whatever is left over goes to `restKey`.
 */
export function monotoneGrid(
  raw: (hand: string) => FreqMap,
  orderedKeys: string[],
  restKey = 'fold',
): Map<string, FreqMap> {
  const hands: string[] = [];
  for (let row = 0; row < 13; row++) for (let col = 0; col < 13; col++) hands.push(handLabel(row, col));
  const rawFreqs = new Map(hands.map((h) => [h, raw(h)]));

  const cumulative = orderedKeys.map((_, i) => {
    const m = new Map<string, number>();
    for (const h of hands) {
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += rawFreqs.get(h)![orderedKeys[j]] ?? 0;
      m.set(h, Math.min(1, sum));
    }
    enforceMonotone((h) => m.get(h)!, (h, f) => m.set(h, f));
    return m;
  });

  const out = new Map<string, FreqMap>();
  for (const h of hands) {
    const freqs: FreqMap = {};
    let prev = 0;
    orderedKeys.forEach((key, i) => {
      const cum = Math.max(prev, cumulative[i].get(h)!);
      freqs[key] = round2(cum - prev);
      prev = cum;
    });
    freqs[restKey] = round2(1 - prev);
    out.set(h, freqs);
  }
  return out;
}

/** Wrap a raw per-hand function into a monotone, lazily-built range function. */
export function monotoneRange(
  raw: (hand: string) => FreqMap,
  orderedKeys: string[],
  restKey = 'fold',
) {
  return lazyRange(() => monotoneGrid(raw, orderedKeys, restKey));
}
