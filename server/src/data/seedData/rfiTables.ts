/**
 * Explicit 100bb 6-max RFI frequency tables (hand → raise frequency).
 *
 * Authored by hand, one string per position, in compact range notation:
 *   "22+"        pairs 22..AA            "TT-66"    pairs 66..TT
 *   "ATs+"       ATs..AKs                "A5s-A2s"  A5s..A2s
 *   "T9s-54s"    connectors shifted down "KQo"      single hand
 *   "A9s:0.6"    any token takes a :frequency suffix (default 1)
 *
 * Other stack depths and table sizes are derived with `trimTail` rather than
 * authored separately, so the families stay consistent.
 */

const RANKS = 'AKQJT98765432';

export type FreqTable = Record<string, number>;

function rankIdx(ch: string): number {
  const i = RANKS.indexOf(ch);
  if (i < 0) throw new Error(`bad rank "${ch}"`);
  return i;
}

function parseHand(h: string): { hi: number; lo: number; suffix: string } {
  const m = /^([AKQJT98765432])([AKQJT98765432])([so]?)$/.exec(h);
  if (!m) throw new Error(`bad hand "${h}"`);
  return { hi: rankIdx(m[1]), lo: rankIdx(m[2]), suffix: m[3] };
}

function label(hi: number, lo: number, suffix: string): string {
  return `${RANKS[hi]}${RANKS[lo]}${suffix}`;
}

function expand(spec: string): string[] {
  if (spec.endsWith('+')) {
    const { hi, lo, suffix } = parseHand(spec.slice(0, -1));
    const out: string[] = [];
    if (hi === lo) {
      for (let r = hi; r >= 0; r--) out.push(label(r, r, ''));
    } else {
      for (let l = lo; l > hi; l--) out.push(label(hi, l, suffix));
    }
    return out;
  }
  const dash = spec.indexOf('-');
  if (dash > 0) {
    const a = parseHand(spec.slice(0, dash));
    const b = parseHand(spec.slice(dash + 1));
    const out: string[] = [];
    if (a.hi === a.lo) {
      for (let r = a.hi; r <= b.hi; r++) out.push(label(r, r, ''));
    } else if (a.hi === b.hi) {
      for (let l = a.lo; l <= b.lo; l++) out.push(label(a.hi, l, a.suffix));
    } else {
      const gap = a.lo - a.hi;
      if (b.lo - b.hi !== gap) throw new Error(`"${spec}": mismatched gap`);
      for (let h = a.hi; h <= b.hi; h++) out.push(label(h, h + gap, a.suffix));
    }
    return out;
  }
  const { hi, lo, suffix } = parseHand(spec);
  return [label(hi, lo, suffix)];
}

export function parseRange(src: string): FreqTable {
  const table: FreqTable = {};
  for (const raw of src.split(/[\s,]+/).filter(Boolean)) {
    const [spec, f] = raw.split(':');
    const freq = f === undefined ? 1 : Number(f);
    if (!(freq > 0 && freq <= 1)) throw new Error(`bad frequency in "${raw}"`);
    for (const h of expand(spec)) table[h] = freq;
  }
  return table;
}

/** Drop hands played less than `min` of the time (the thin tail of a range). */
export function trimTail(table: FreqTable, min: number): FreqTable {
  return Object.fromEntries(Object.entries(table).filter(([, f]) => f >= min));
}

// ── Monotonicity ─────────────────────────────────────────────────────

const ALL_HANDS: string[] = (() => {
  const out: string[] = [];
  for (let i = 0; i < 13; i++) {
    for (let j = i; j < 13; j++) {
      if (i === j) out.push(`${RANKS[i]}${RANKS[j]}`);
      else out.push(`${RANKS[i]}${RANKS[j]}s`, `${RANKS[i]}${RANKS[j]}o`);
    }
  }
  return out;
})();

/** True when `x` is at least as good as `y` in both cards, with equal-or-better shape. */
function dominates(x: string, y: string): boolean {
  if (x === y) return false;
  const a = parseHand(x.length === 2 ? x : x);
  const b = parseHand(y);
  const px = a.hi === a.lo;
  const py = b.hi === b.lo;
  if (px && py) return a.hi < b.hi;
  if (px || py) return false;
  const suitOk = a.suffix === b.suffix || (a.suffix === 's' && b.suffix === 'o');
  return suitOk && a.hi <= b.hi && a.lo <= b.lo && a.lo - a.hi <= b.lo - b.hi;
}

// Hands that are legitimately played more than weaker-looking hands (blocker bluffs).
const WHEEL = new Set(['A5s', 'A4s', 'A3s', 'A2s', 'A5o']);

const DOMINANCE: Array<[string, string]> = [];
for (const x of ALL_HANDS) for (const y of ALL_HANDS) if (dominates(x, y) && !WHEEL.has(y)) DOMINANCE.push([x, y]);

/**
 * Make a per-hand frequency non-decreasing with hand strength: a hand that
 * dominates another is raised to at least the weaker hand's frequency.
 * `get`/`set` let callers keep their own representation.
 */
export function enforceMonotone(get: (h: string) => number, set: (h: string, f: number) => void): void {
  for (let pass = 0; pass < 13; pass++) {
    let changed = false;
    for (const [x, y] of DOMINANCE) {
      const fy = get(y);
      if (fy > get(x) + 1e-9) {
        set(x, fy);
        changed = true;
      }
    }
    if (!changed) return;
  }
}

/** Convenience for plain hand → frequency tables. */
export function monotoneTable(table: FreqTable): FreqTable {
  const out = { ...table };
  enforceMonotone(
    (h) => out[h] ?? 0,
    (h, f) => { out[h] = Math.round(f * 100) / 100; },
  );
  return out;
}

export function comboCount(hand: string): number {
  return hand.length === 2 ? 6 : hand.endsWith('s') ? 4 : 12;
}

/** Share of all 1326 combos covered by a per-hand frequency table. */
export function tableShare(table: FreqTable): number {
  let total = 0;
  for (const [h, f] of Object.entries(table)) total += f * comboCount(h);
  return total / 1326;
}

/**
 * Scale the `call` frequencies (bisection) until fourBet + call covers `target`
 * of all combos. Per-hand totals are capped at 1. Shape is authored; only the
 * overall width is fitted.
 */
export function fitCalls(fourBet: FreqTable, call: FreqTable, target: number): FreqTable {
  const scaled = (k: number): FreqTable => {
    const out: FreqTable = {};
    for (const [h, f] of Object.entries(call)) {
      const v = Math.min(f * k, 1 - (fourBet[h] ?? 0));
      if (v >= 0.02) out[h] = Math.round(v * 100) / 100;
    }
    return out;
  };
  const share = (k: number) => {
    const c = scaled(k);
    const hands = new Set([...Object.keys(fourBet), ...Object.keys(c)]);
    let t = 0;
    for (const h of hands) t += ((fourBet[h] ?? 0) + (c[h] ?? 0)) * comboCount(h);
    return t / 1326;
  };
  let lo = 0.2;
  let hi = 4;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (share(mid) < target) lo = mid;
    else hi = mid;
  }
  return scaled((lo + hi) / 2);
}

/** Scale only the mixed (<1) entries until the table covers `target` of all combos. */
export function fitMixed(table: FreqTable, target: number): FreqTable {
  const scaled = (k: number): FreqTable => {
    const out: FreqTable = {};
    for (const [h, f] of Object.entries(table)) {
      const v = f >= 1 ? 1 : Math.min(f * k, 1);
      if (v >= 0.02) out[h] = Math.round(v * 100) / 100;
    }
    return out;
  };
  let lo = 0.2;
  let hi = 8;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (tableShare(scaled(mid)) < target) lo = mid;
    else hi = mid;
  }
  return scaled((lo + hi) / 2);
}

// Parsed tables are made monotone (see bottom of file) so a typo can't leave a hole.
function monotoneRaw(src: string): FreqTable {
  return monotoneTable(parseRange(src));
}

// ── 100bb 6-max, raise-first-in ──────────────────────────────────────

export const UTG_100 = monotoneRaw(`
  22:0.75 33:0.85 44:0.95 55+
  ATs+ A9s:0.6 A8s:0.5 A7s:0.4 A6s:0.25 A5s A4s:0.9 A3s:0.6 A2s:0.5
  KQs-KTs K9s:0.55 K8s:0.15 K6s:0.2 K5s:0.2
  QJs QTs Q9s:0.5 JTs J9s:0.7 T9s T8s:0.3
  98s:0.85 87s:0.6 76s:0.6 65s:0.6 54s:0.45
  AKo-AJo ATo:0.6 KQo KJo:0.6 KTo:0.1 QJo:0.45 JTo:0.2
`);

export const HJ_100 = monotoneRaw(`
  22+
  ATs+ A9s A8s:0.8 A7s:0.6 A6s:0.4 A5s-A3s A2s:0.8
  KQs-KTs K9s:0.85 K8s:0.35 K7s:0.1 K6s:0.3 K5s:0.3
  QJs QTs Q9s:0.8 Q8s:0.15
  JTs J9s J8s:0.2
  T9s T8s:0.6 98s 97s:0.25 87s:0.9 76s:0.9 65s:0.9 54s:0.7 86s:0.15 75s:0.15
  AKo-AJo ATo:0.9 A9o:0.2 KQo KJo:0.9 KTo:0.4 QJo:0.7 QTo:0.2 JTo:0.5 T9o:0.1
`);

export const CO_100 = monotoneRaw(`
  22+
  A2s+ KQs-K8s K7s:0.6 K6s:0.7 K5s:0.6 K4s:0.35 K3s:0.2 K2s:0.2
  QJs-Q9s Q8s:0.7 Q7s:0.25 Q6s:0.2 Q5s:0.1
  JTs J9s J8s:0.8 J7s:0.2
  T9s T8s T7s:0.3
  98s 97s:0.6 96s:0.1
  87s 86s:0.6 76s 75s:0.5 65s 64s:0.3 54s 53s:0.3 43s:0.2
  AKo-ATo A9o:0.6 A8o:0.35 A7o:0.15 A5o:0.25 A4o:0.1
  KQo-KTo K9o:0.3 QJo QTo:0.9 Q9o:0.1 JTo:0.9 J9o:0.1 T9o:0.5 98o:0.1
`);

export const BTN_100 = monotoneRaw(`
  22+
  A2s+ KQs-K3s K2s:0.85
  QJs-Q5s Q4s:0.6 Q3s:0.4 Q2s:0.25
  JTs-J6s J5s:0.5 J4s:0.2
  T9s-T6s T5s:0.35
  98s-96s 95s:0.3
  87s-85s 84s:0.15
  76s 75s 74s:0.6
  65s 64s 63s:0.6
  54s 53s:0.8 52s:0.25
  43s:0.8 42s:0.1 32s:0.1
  AKo-A5o A4o:0.8 A3o:0.6 A2o:0.5
  KQo-K9o K8o:0.7 K7o:0.45 K6o:0.3 K5o:0.15
  QJo-Q9o Q8o:0.5 Q7o:0.15
  JTo J9o J8o:0.5 J7o:0.1
  T9o T8o:0.6 T7o:0.1
  98o:0.8 97o:0.3 87o:0.6 86o:0.1 76o:0.45 65o:0.25 54o:0.15
`);

export const SB_100 = monotoneRaw(`
  22+
  A2s+ KQs-K6s K5s:0.6 K4s:0.6 K3s:0.6 K2s:0.6
  QJs-Q7s Q6s:0.5 Q5s:0.3
  JTs-J7s J6s:0.4
  T9s-T7s T6s:0.5
  98s 97s 96s:0.5
  87s 86s 85s:0.3
  76s 75s 74s:0.3
  65s 64s 54s:0.7 53s:0.7 43s:0.5
  AKo-A8o A7o:0.8 A6o:0.7 A5o:0.9 A4o:0.7 A3o:0.4 A2o:0.35
  KQo-KTo K9o:0.8 K8o:0.4 K7o:0.2
  QJo QTo Q9o:0.7 Q8o:0.2
  JTo J9o:0.6 T9o:0.7 T8o:0.15 98o:0.5 87o:0.3 76o:0.15
`);

// ── 7–9 max early positions (tighter than 6-max UTG) ─────────────────

export const UTG_FULL_100 = monotoneRaw(`
  22:0.3 33:0.4 44:0.6 55+
  AQs+ AJs ATs A5s:0.8 A4s:0.5
  KQs KJs KTs:0.7 QJs QTs:0.5 JTs T9s:0.5 98s:0.4
  AKo AQo AJo:0.7 KQo:0.8
`);

export const UTG1_FULL_100 = monotoneRaw(`
  22:0.5 33:0.6 44:0.8 55+
  ATs+ A9s:0.4 A5s A4s:0.7 A3s:0.3
  KQs KJs KTs K9s:0.3 QJs QTs Q9s:0.3 JTs J9s:0.4 T9s:0.7 98s:0.6 87s:0.3
  AKo AQo AJo ATo:0.4 KQo KJo:0.3 QJo:0.2
`);
