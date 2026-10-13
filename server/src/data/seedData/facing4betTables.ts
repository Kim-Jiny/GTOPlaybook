/**
 * Explicit "facing a 4bet" strategies (hero opened, 3bet, then faced a 4bet).
 * 5bet = jam/5bet, call, fold is the remainder. Keyed by opener class.
 *
 * 60bb narrows the calling range; at 40bb calls mostly turn into jams (a call
 * leaves too little behind), so `fiveBet` absorbs part of `call`.
 */
import { FreqTable, parseRange, enforceMonotone } from './rfiTables';

export interface F4bEntry {
  fiveBet: FreqTable;
  call: FreqTable;
}

type Cls = 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb';

const e = (fiveBet: string, call: string): F4bEntry => {
  const entry = { fiveBet: parseRange(fiveBet), call: parseRange(call) };
  for (const h of new Set([...Object.keys(entry.fiveBet), ...Object.keys(entry.call)])) {
    const total = (entry.fiveBet[h] ?? 0) + (entry.call[h] ?? 0);
    if (total > 1.0001) throw new Error(`facing4bet table: ${h} sums to ${total}`);
  }
  // A dominating hand must continue at least as often (wheel-ace bluffs exempt).
  enforceMonotone(
    (h) => (entry.fiveBet[h] ?? 0) + (entry.call[h] ?? 0),
    (h, f) => { entry.call[h] = Math.round((f - (entry.fiveBet[h] ?? 0)) * 100) / 100; },
  );
  return entry;
};

const BASE: Record<Cls, F4bEntry> = {
  'ep-tight': e(
    'AA KK QQ:0.2 AKs:0.5 AKo:0.15 A5s:0.2',
    'QQ:0.8 JJ:0.5 TT:0.15 AKs:0.5 AKo:0.85 AQs:0.35',
  ),
  hj: e(
    'AA KK QQ:0.25 AKs:0.55 AKo:0.2 A5s:0.25',
    'QQ:0.75 JJ:0.6 TT:0.25 AKs:0.45 AKo:0.8 AQs:0.5 AQo:0.1 AJs:0.1 KQs:0.1',
  ),
  co: e(
    'AA KK QQ:0.3 AKs:0.6 AKo:0.3 A5s:0.35 A4s:0.15',
    'QQ:0.7 JJ:0.75 TT:0.4 99:0.1 AKs:0.4 AKo:0.7 AQs:0.7 AQo:0.2 AJs:0.25 KQs:0.25',
  ),
  btn: e(
    'AA KK QQ:0.35 JJ:0.05 AKs:0.65 AKo:0.35 A5s:0.4 A4s:0.2',
    'QQ:0.65 JJ:0.8 TT:0.6 99:0.25 88:0.1 AKs:0.35 AKo:0.65 AQs:0.8 AQo:0.4 AJs:0.45 ATs:0.1 KQs:0.4 KJs:0.1',
  ),
  sb: e(
    'AA KK QQ:0.4 JJ:0.1 AKs:0.7 AKo:0.45 A5s:0.5 A4s:0.3 A3s:0.1',
    'QQ:0.6 JJ:0.7 TT:0.6 99:0.3 88:0.1 AKs:0.3 AKo:0.55 AQs:0.7 AQo:0.3 AJs:0.35 KQs:0.35',
  ),
};

// Never leak these into fold when the calling range shrinks.
const NEVER_FOLD = new Set(['AA', 'KK', 'QQ', 'AKs']);

const round = (n: number) => Math.round(n * 100) / 100;

export function facing4betEntry(cls: Cls, depth: 100 | 60 | 40): F4bEntry {
  const base = BASE[cls];
  if (depth === 100) return base;

  const callFactor = depth === 60 ? 0.85 : 0.4;
  const jamShift = depth === 40 ? 0.35 : 0;
  const fiveBet: FreqTable = {};
  const call: FreqTable = {};
  for (const h of new Set([...Object.keys(base.fiveBet), ...Object.keys(base.call)])) {
    const f5 = base.fiveBet[h] ?? 0;
    const c = base.call[h] ?? 0;
    const nf = Math.min(1, f5 + jamShift * c);
    const nc = NEVER_FOLD.has(h) && (f5 > 0 || c > 0) ? 1 - nf : Math.min(c * callFactor, 1 - nf);
    if (nf >= 0.02) fiveBet[h] = round(nf);
    if (nc >= 0.02) call[h] = round(nc);
  }
  return { fiveBet, call };
}
