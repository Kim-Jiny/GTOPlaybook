/**
 * Explicit 100bb "facing a 3bet" strategies (hero opened, villain 3bet).
 *
 * Each entry lists the 4bet and call frequencies per hand using the notation
 * from rfiTables.ts; fold is whatever is left (1 - 4bet - call).
 * Keyed by `${openerClass}:${group}` where group describes the 3bettor:
 *   tight  EP / HJ 3bettor      late  CO / BTN 3bettor      blind  SB / BB 3bettor
 *   co     CO 3bettor vs BTN opener (BTN only)
 * 60bb and 40bb are derived by shrinking the calling range (see `scaleCalls`).
 */
import { FreqTable, parseRange, enforceMonotone } from './rfiTables';

export interface Vs3betEntry {
  fourBet: FreqTable;
  call: FreqTable;
}

// `extra` widens the calling range with the thinner hands, never exceeding 100% per hand.
const e = (fourBet: string, call: string, extra = ''): Vs3betEntry => {
  const entry = { fourBet: parseRange(fourBet), call: parseRange(call) };
  for (const [h, f] of Object.entries(parseRange(extra))) {
    const room = Math.round((1 - (entry.fourBet[h] ?? 0) - (entry.call[h] ?? 0)) * 100) / 100;
    if (room > 0) entry.call[h] = Math.round(((entry.call[h] ?? 0) + Math.min(f, room)) * 100) / 100;
  }
  for (const h of new Set([...Object.keys(entry.fourBet), ...Object.keys(entry.call)])) {
    const total = (entry.fourBet[h] ?? 0) + (entry.call[h] ?? 0);
    if (total > 1.0001) throw new Error(`vs3bet table: ${h} sums to ${total}`);
  }
  return entry;
};

export const VS_3BET_100: Record<string, Vs3betEntry> = {
  // ── UTG / early openers ──
  'ep-tight:tight': e(
    'AA KK AKs:0.8 AKo:0.3 QQ:0.15',
    'QQ:0.85 JJ TT:0.8 99:0.3 AKs:0.2 AKo:0.7 AQs:0.8',
    '88:0.2 ATs:0.2 KQs:0.4 AQo:0.2',
  ),
  'ep-tight:late': e(
    'AA KK AKs:0.75 AKo:0.3 QQ:0.15 A5s:0.25',
    'QQ:0.85 JJ TT:0.75 99:0.25 AKs:0.25 AKo:0.7 AQs:0.8 AJs:0.2',
    '88:0.45 77:0.2 ATs:0.5 KJs:0.3 KTs:0.15 QJs:0.2 JTs:0.25 T9s:0.1 AQo:0.2 KQo:0.15 KQs:0.7',
  ),
  'ep-tight:blind': e(
    'AA KK AKs:0.7 AKo:0.4 QQ:0.35 A5s:0.45',
    'QQ:0.65 JJ TT 99:0.8 88:0.4 77:0.1 AKs:0.3 AKo:0.6 AQs AJs ATs:0.3 KQs KJs:0.1 AQo:0.2 QJs:0.15 JTs:0.25',
    '66:0.4 55:0.15 A9s:0.3 KTs:0.4 QTs:0.4 T9s:0.35 98s:0.2 KQo:0.3 AJo:0.2 KQs:0.7',
  ),

  // ── HJ ──
  'hj:tight': e(
    'AA KK AKs:0.75 AKo:0.25 QQ:0.2',
    'QQ:0.8 JJ TT:0.85 99:0.3 AKs:0.25 AKo:0.75 AQs AJs:0.3 KQs:0.3',
    '88:0.3 ATs:0.2 KJs:0.1 AQo:0.2 KQo:0.1',
  ),
  'hj:late': e(
    'AA KK AKs:0.7 AKo:0.4 QQ:0.3 A5s:0.4 A4s:0.25',
    'QQ:0.7 JJ TT 99 88:0.4 AKs:0.3 AKo:0.6 AQs AJs ATs:0.35 KQs AQo:0.3 KJs:0.15 QJs:0.2 JTs:0.3 T9s:0.1',
    '77:0.3 66:0.1 A9s:0.25 KTs:0.3 QTs:0.2 98s:0.1 KQo:0.3 AJo:0.25 ATo:0.1',
  ),
  'hj:blind': e(
    'AA KK AKs:0.7 AKo:0.4 QQ:0.35 A5s:0.45 A4s:0.3 A3s:0.1',
    'QQ:0.65 JJ TT 99 88:0.6 77:0.2 AKs:0.3 AKo:0.6 AQs AJs ATs:0.5 A9s:0.1 KQs KJs:0.3 KTs:0.1 AQo:0.4 QJs:0.4 JTs:0.5 T9s:0.25 98s:0.1',
    '66:0.35 55:0.15 A8s:0.3 K9s:0.2 Q9s:0.15 J9s:0.2 87s:0.1 KQo:0.4 AJo:0.35 ATo:0.15 KJo:0.1 QTs:0.4',
  ),

  // ── CO ──
  'co:tight': e(
    'AA KK AKs:0.75 AKo:0.3 QQ:0.2 A5s:0.3',
    'QQ:0.8 JJ TT 99:0.5 AKs:0.25 AKo:0.7 AQs AJs:0.6 KQs:0.5 AQo:0.2',
    '88:0.35 77:0.15 ATs:0.4 KJs:0.25 QJs:0.2 JTs:0.2 KQo:0.2 AJo:0.15',
  ),
  'co:late': e(
    'AA KK AKs:0.65 AKo:0.45 QQ:0.4 A5s:0.5 A4s:0.4 A3s:0.2',
    'QQ:0.6 JJ TT 99 88:0.65 77:0.25 AKs:0.35 AKo:0.55 AQs AJs ATs:0.7 A9s:0.15 KQs KJs:0.4 KTs:0.15 AQo:0.5 AJo:0.1 QJs:0.5 JTs:0.6 T9s:0.4 98s:0.15 87s:0.05',
    '66:0.3 55:0.15 A9s:0.35 A8s:0.15 K9s:0.1 Q9s:0.1 76s:0.1 65s:0.1 KQo:0.45 AJo:0.3 ATo:0.1 KJo:0.15',
  ),
  'co:blind': e(
    'AA KK AKs:0.65 AKo:0.45 QQ:0.4 A5s:0.5 A4s:0.4 A3s:0.2',
    'QQ:0.6 JJ TT 99 88 77:0.5 66:0.15 AKs:0.35 AKo:0.55 AQs AJs ATs A9s:0.3 KQs KJs KTs:0.4 AQo:0.55 AJo:0.2 QJs:0.6 QTs:0.2 JTs:0.7 T9s:0.5 98s:0.3 87s:0.15',
    '55:0.3 44:0.15 A8s:0.3 A7s:0.1 K9s:0.2 Q9s:0.25 J9s:0.3 T8s:0.1 76s:0.1 KQo:0.5 AJo:0.4 ATo:0.15 KJo:0.2 QJo:0.15 JTo:0.1',
  ),

  // ── BTN ──
  'btn:tight': e(
    'AA KK AKs:0.7 AKo:0.4 QQ:0.35 A5s:0.45 A4s:0.2',
    'QQ:0.65 JJ TT 99 88:0.5 AKs:0.3 AKo:0.6 AQs AJs ATs:0.6 KQs KJs:0.3 AQo:0.4 QJs:0.3 JTs:0.4',
    '66:0.25 55:0.1 A9s:0.25 A8s:0.1 KTs:0.25 QTs:0.25 T9s:0.25 98s:0.1 KQo:0.3 AJo:0.25',
  ),
  'btn:co': e(
    'AA KK AKs:0.65 AKo:0.45 QQ:0.4 A5s:0.5 A4s:0.4 A3s:0.2',
    'QQ:0.6 JJ TT 99 88 77:0.5 AKs:0.35 AKo:0.55 AQs AJs ATs A9s:0.4 KQs KJs:0.7 KTs:0.3 AQo:0.55 AJo:0.1 QJs:0.7 QTs:0.3 JTs:0.8 T9s:0.6 98s:0.35 87s:0.2 76s:0.1',
    '66:0.3 55:0.2 44:0.1 A8s:0.3 A7s:0.1 K9s:0.25 Q9s:0.25 J9s:0.25 T8s:0.1 76s:0.2 65s:0.1 KQo:0.45 AJo:0.3 ATo:0.1 KJo:0.2 QJo:0.15',
  ),
  'btn:blind': e(
    'AA KK AKs:0.6 AKo:0.45 QQ:0.5 JJ:0.1 A5s:0.55 A4s:0.45 A3s:0.35 A2s:0.2',
    'QQ:0.5 JJ:0.9 TT 99 88 77:0.8 66:0.4 55:0.2 AKs:0.4 AKo:0.55 AQs AJs ATs A9s:0.6 A8s:0.2 KQs KJs KTs:0.6 K9s:0.1 AQo:0.6 AJo:0.3 ATo:0.1 KQo:0.2 QJs QTs:0.5 JTs T9s:0.8 98s:0.55 87s:0.4 76s:0.25 65s:0.1',
    '44:0.6 33:0.5 22:0.4 A7s:0.5 A6s:0.4 A5s:0.3 A4s:0.2 A3s:0.2 K9s:0.5 K8s:0.15 Q9s:0.4 J9s:0.5 J8s:0.15 T8s:0.35 97s:0.25 86s:0.15 75s:0.15 65s:0.35 54s:0.3 KQo:0.5 AJo:0.5 ATo:0.3 KJo:0.35 QJo:0.25 KTo:0.1 JTo:0.2',
  ),

  // ── SB (out of position vs BB) ──
  'sb:blind': e(
    'AA KK AKs:0.75 AKo:0.5 QQ:0.55 JJ:0.15 A5s:0.6 A4s:0.5 A3s:0.35 A2s:0.2',
    'QQ:0.45 JJ:0.85 TT 99 88:0.8 77:0.5 66:0.25 AKs:0.25 AKo:0.5 AQs AJs ATs:0.9 A9s:0.4 A8s:0.1 KQs KJs:0.8 KTs:0.4 AQo:0.5 AJo:0.15 KQo:0.15 QJs:0.5 QTs:0.3 JTs:0.6 T9s:0.4 98s:0.25 87s:0.1',
    '55:0.4 44:0.2 33:0.1 A8s:0.5 A7s:0.2 A5s:0.25 K9s:0.2 Q9s:0.2 J9s:0.25 76s:0.1 65s:0.15 54s:0.1 KQo:0.5 AJo:0.5 ATo:0.3 KJo:0.2 QJo:0.15',
  ),
};

// Calibration: scale each table's calling frequencies so the overall continue rate
// lands near typical solver outputs (late openers defend wider). Capped per hand.
const CALL_BOOST: Record<string, number> = {
  'ep-tight:late': 1.15, 'ep-tight:blind': 1.15,
  'hj:late': 1.15, 'hj:blind': 1.15,
  'co:late': 1.15, 'co:blind': 1.2,
  'btn:tight': 1.1, 'btn:co': 1.35, 'btn:blind': 1.5,
  'sb:blind': 1.5,
};
for (const [key, boost] of Object.entries(CALL_BOOST)) {
  const entry = VS_3BET_100[key];
  for (const h of Object.keys(entry.call)) {
    const room = 1 - (entry.fourBet[h] ?? 0);
    entry.call[h] = Math.round(Math.min(entry.call[h] * boost, room) * 100) / 100;
  }
}

// A hand that dominates another must continue (4bet + call) at least as often.
for (const entry of Object.values(VS_3BET_100)) {
  const cont = (h: string) => (entry.fourBet[h] ?? 0) + (entry.call[h] ?? 0);
  enforceMonotone(cont, (h, f) => {
    entry.call[h] = Math.round(Math.min(f - (entry.fourBet[h] ?? 0), 1) * 100) / 100;
  });
}

/** Calling range shrinks with stack depth; 4bet frequencies are unchanged. */
export function scaleCalls(entry: Vs3betEntry, factor: number): Vs3betEntry {
  const call: FreqTable = {};
  for (const [h, f] of Object.entries(entry.call)) {
    const scaled = Math.round(f * factor * 100) / 100;
    if (scaled >= 0.1) call[h] = scaled;
  }
  return { fourBet: entry.fourBet, call };
}
