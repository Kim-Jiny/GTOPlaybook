import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, openerClass, shallowOpenerClass, smoothFrequencies,
} from './helpers';
import { FACING_3BET_ACTIONS, FACING_3BET_JAM_ACTIONS } from './actionColors';

// When facing a 3bet, decisions are: 4bet, call, or fold
// Ranges vary by opener position and 3bettor position

// ── 100bb ranges (deep stack) ──

// UTG facing 3bet — very tight continue range
const UTG_VS_3BET_4BET = new Set(['AA', 'KK', 'AKs']);
const UTG_VS_3BET_CALL = new Set(['QQ', 'JJ', 'TT', 'AKo', 'AQs']);

// HJ (old MP) facing 3bet
const HJ_VS_3BET_4BET = new Set(['AA', 'KK', 'AKs']);
const HJ_VS_3BET_CALL = new Set(['QQ', 'JJ', 'TT', 'AQs', 'AKo', 'AJs']);

// CO facing 3bet from BTN/SB/BB — wider continue
const CO_VS_3BET_4BET = new Set(['AA', 'KK', 'AKs', 'AKo']);
const CO_VS_3BET_CALL = new Set(['QQ', 'JJ', 'TT', '99', 'AQs', 'AQo', 'AJs', 'KQs', 'ATs']);

// CO facing 3bet from tight positions (UTG/HJ style) — tighter
const CO_VS_TIGHT_3BET_4BET = new Set(['AA', 'KK']);
const CO_VS_TIGHT_3BET_CALL = new Set(['QQ', 'JJ', 'AKs', 'AKo']);

// BTN facing 3bet from SB/BB — widest continue
const BTN_VS_3BET_4BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_VS_3BET_CALL = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'A5s', 'A4s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s',
]);

// BTN facing tight 3bet (UTG/HJ/CO)
const BTN_VS_TIGHT_3BET_4BET = new Set(['AA', 'KK', 'AKs']);
const BTN_VS_TIGHT_3BET_CALL = new Set(['QQ', 'JJ', 'TT', 'AKo', 'AQs', 'AJs']);

// SB facing 3bet from BB
const SB_VS_BB_3BET_4BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo', 'AQs']);
const SB_VS_BB_3BET_CALL = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AQo', 'AJs', 'ATs', 'A9s', 'A5s', 'A4s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
]);

// ── 60bb ranges — slightly tighter calls (~15% reduction) ──

const UTG_VS_3BET_CALL_60 = new Set(['QQ', 'JJ', 'TT', 'AKo']);
const HJ_VS_3BET_CALL_60 = new Set(['QQ', 'JJ', 'TT', 'AQs', 'AKo']);
const CO_VS_3BET_CALL_60 = new Set(['QQ', 'JJ', 'TT', '99', 'AQs', 'AJs', 'KQs']);
const CO_VS_TIGHT_3BET_CALL_60 = new Set(['QQ', 'AKs', 'AKo']);
const BTN_VS_3BET_CALL_60 = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AQs', 'AQo', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
]);
const BTN_VS_TIGHT_3BET_CALL_60 = new Set(['QQ', 'JJ', 'TT', 'AKo', 'AQs']);
const SB_VS_BB_3BET_CALL_60 = new Set([
  'JJ', 'TT', '99', '88',
  'AQo', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'JTs', 'T9s',
]);

// ── 40bb ranges — tighter calls (~30% reduction) ──

const UTG_VS_3BET_CALL_40 = new Set(['QQ', 'JJ', 'AKo']);
const HJ_VS_3BET_CALL_40 = new Set(['QQ', 'JJ', 'AKo', 'AQs']);
const CO_VS_3BET_CALL_40 = new Set(['QQ', 'JJ', 'TT', 'AQs', 'AJs']);
const CO_VS_TIGHT_3BET_CALL_40 = new Set(['QQ', 'AKs']);
const BTN_VS_3BET_CALL_40 = new Set([
  'JJ', 'TT', '99', '88',
  'AQs', 'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'QJs', 'JTs', 'T9s',
]);
const BTN_VS_TIGHT_3BET_CALL_40 = new Set(['QQ', 'JJ', 'AKo', 'AQs']);
const SB_VS_BB_3BET_CALL_40 = new Set([
  'JJ', 'TT', '99', '88',
  'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'QJs', 'JTs',
]);

// ── 25bb ranges — still shallow, but no longer pure jam-or-fold ──

const FOURBET_25_UTG_VS_HJ = new Set(['AA', 'KK', 'AKs']);
const CALL_25_UTG_VS_HJ = new Set(['QQ', 'JJ', 'AKo', 'AQs']);

const FOURBET_25_UTG_VS_LATE = new Set(['AA', 'KK', 'AKs', 'AKo']);
const CALL_25_UTG_VS_LATE = new Set(['QQ', 'JJ', 'TT', 'AQs', 'AJs']);

const FOURBET_25_HJ_VS_CO = new Set(['AA', 'KK', 'AKs']);
const CALL_25_HJ_VS_CO = new Set(['QQ', 'JJ', 'TT', 'AKo', 'AQs']);

const FOURBET_25_HJ_VS_LATE = new Set(['AA', 'KK', 'AKs', 'AKo']);
const CALL_25_HJ_VS_LATE = new Set(['QQ', 'JJ', 'TT', '99', 'AQs', 'AJs', 'KQs']);

const FOURBET_25_CO_VS_BTN = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const CALL_25_CO_VS_BTN = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs']);

const FOURBET_25_CO_VS_BLIND = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo', 'A5s']);
const CALL_25_CO_VS_BLIND = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs']);

const FOURBET_25_BTN_VS_SB = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo', 'A5s', 'A4s']);
const CALL_25_BTN_VS_SB = new Set(['JJ', 'TT', '99', '88', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs']);

const FOURBET_25_BTN_VS_BB = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo', 'A5s', 'A4s']);
const CALL_25_BTN_VS_BB = new Set(['JJ', 'TT', '99', '88', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs']);

const FOURBET_25_SB_VS_BB = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'A5s', 'A4s', 'A3s']);
const CALL_25_SB_VS_BB = new Set(['TT', '99', '88', '77', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'A8s', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s']);

type FacingMixedMap = Record<string, { '4bet': number; call: number; fold: number }>;

// Mixed frequency hands at boundary (e.g. QQ sometimes 4bets, sometimes calls)
const FACING_3BET_MIXED: FacingMixedMap = {
  'QQ': { '4bet': 0.45, call: 0.55, fold: 0 },
  'JJ': { '4bet': 0.2, call: 0.8, fold: 0 },
  'AQs': { '4bet': 0.3, call: 0.6, fold: 0.1 },
  'AQo': { '4bet': 0.15, call: 0.55, fold: 0.3 },
  'TT': { '4bet': 0.1, call: 0.7, fold: 0.2 },
  '99': { '4bet': 0, call: 0.6, fold: 0.4 },
  'AKo': { '4bet': 0.58, call: 0.42, fold: 0 },
  'AJs': { '4bet': 0.08, call: 0.62, fold: 0.3 },
  'ATs': { '4bet': 0.04, call: 0.5, fold: 0.46 },
  'KQs': { '4bet': 0.06, call: 0.62, fold: 0.32 },
  'KJs': { '4bet': 0.02, call: 0.52, fold: 0.46 },
  'QJs': { '4bet': 0.02, call: 0.48, fold: 0.5 },
  'A5s': { '4bet': 0.36, call: 0.22, fold: 0.42 },
  'A4s': { '4bet': 0.3, call: 0.18, fold: 0.52 },
};

const FACING_25_CO_VS_BLIND_MIXED: FacingMixedMap = {
  ...FACING_3BET_MIXED,
  'A5s': { '4bet': 0.42, call: 0.2, fold: 0.38 },
  'A4s': { '4bet': 0.26, call: 0.18, fold: 0.56 },
  'A3s': { '4bet': 0.16, call: 0.14, fold: 0.7 },
};

const FACING_25_BTN_VS_SB_MIXED: FacingMixedMap = {
  ...FACING_3BET_MIXED,
  'A5s': { '4bet': 0.44, call: 0.2, fold: 0.36 },
  'A4s': { '4bet': 0.34, call: 0.2, fold: 0.46 },
  'A3s': { '4bet': 0.22, call: 0.16, fold: 0.62 },
  'A2s': { '4bet': 0.12, call: 0.12, fold: 0.76 },
};

const FACING_25_BTN_VS_BB_MIXED: FacingMixedMap = {
  ...FACING_3BET_MIXED,
  'A5s': { '4bet': 0.46, call: 0.2, fold: 0.34 },
  'A4s': { '4bet': 0.36, call: 0.2, fold: 0.44 },
  'A3s': { '4bet': 0.24, call: 0.16, fold: 0.6 },
  'A2s': { '4bet': 0.14, call: 0.12, fold: 0.74 },
};

const FACING_25_SB_VS_BB_MIXED: FacingMixedMap = {
  ...FACING_3BET_MIXED,
  'A5s': { '4bet': 0.48, call: 0.18, fold: 0.34 },
  'A4s': { '4bet': 0.4, call: 0.18, fold: 0.42 },
  'A3s': { '4bet': 0.28, call: 0.16, fold: 0.56 },
  'A2s': { '4bet': 0.16, call: 0.12, fold: 0.72 },
};

// ── Range helper functions ──

function facing3betRange(
  fourBetSet: Set<string>,
  callSet: Set<string>,
  mixedMap: false | FacingMixedMap = false,
) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (mixedMap && h in mixedMap) return mixedMap[h];
    const currentKey = inSet(h, fourBetSet) ? '4bet' : inSet(h, callSet) ? 'call' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: '4bet', set: fourBetSet },
      { key: 'call', set: callSet },
    ]);
    if (smooth) return smooth;
    if (inSet(h, fourBetSet)) return { '4bet': 1.0, call: 0, fold: 0 };
    if (inSet(h, callSet)) return { '4bet': 0, call: 1.0, fold: 0 };
    return { '4bet': 0, call: 0, fold: 1.0 };
  };
}

// ── Opener data lookup ──
// Maps opener tightness class to the range data sets for each depth.
// "ep-tight" openers (UTG, UTG+1, UTG+2, MP) reuse UTG data.
// "hj" opener reuses old MP data (now renamed HJ).

type RangeSet = {
  fourBet: Set<string>;
  call100: Set<string>;
  call60: Set<string>;
  call40: Set<string>;
};

const OPENER_DATA: Record<ReturnType<typeof openerClass>, RangeSet> = {
  'ep-tight': {
    fourBet: UTG_VS_3BET_4BET,
    call100: UTG_VS_3BET_CALL,
    call60: UTG_VS_3BET_CALL_60,
    call40: UTG_VS_3BET_CALL_40,
  },
  'hj': {
    fourBet: HJ_VS_3BET_4BET,
    call100: HJ_VS_3BET_CALL,
    call60: HJ_VS_3BET_CALL_60,
    call40: HJ_VS_3BET_CALL_40,
  },
  'co': {
    fourBet: CO_VS_3BET_4BET,
    call100: CO_VS_3BET_CALL,
    call60: CO_VS_3BET_CALL_60,
    call40: CO_VS_3BET_CALL_40,
  },
  'btn': {
    fourBet: BTN_VS_3BET_4BET,
    call100: BTN_VS_3BET_CALL,
    call60: BTN_VS_3BET_CALL_60,
    call40: BTN_VS_3BET_CALL_40,
  },
  'sb': {
    fourBet: SB_VS_BB_3BET_4BET,
    call100: SB_VS_BB_3BET_CALL,
    call60: SB_VS_BB_3BET_CALL_60,
    call40: SB_VS_BB_3BET_CALL_40,
  },
};

// Tight-variant data for openers facing 3bets from tight positions
type TightRangeSet = {
  fourBet: Set<string>;
  call100: Set<string>;
  call60: Set<string>;
  call40: Set<string>;
};

const OPENER_TIGHT_DATA: Partial<Record<ReturnType<typeof openerClass>, TightRangeSet>> = {
  'co': {
    fourBet: CO_VS_TIGHT_3BET_4BET,
    call100: CO_VS_TIGHT_3BET_CALL,
    call60: CO_VS_TIGHT_3BET_CALL_60,
    call40: CO_VS_TIGHT_3BET_CALL_40,
  },
  'btn': {
    fourBet: BTN_VS_TIGHT_3BET_4BET,
    call100: BTN_VS_TIGHT_3BET_CALL,
    call60: BTN_VS_TIGHT_3BET_CALL_60,
    call40: BTN_VS_TIGHT_3BET_CALL_40,
  },
};

// ── 3bettor classification ──
// Determines which data variant to use based on 3bettor position.
// Tight 3bettors (EP positions, HJ) → use "tight" data if available.
// Late 3bettors (CO, BTN, SB, BB) → use regular (wide) data.

type ThreeBettorClass = 'tight' | 'co' | 'btn' | 'sb' | 'bb';

function threeBettorClass(pos: string): ThreeBettorClass {
  switch (pos) {
    case 'BB': return 'bb';
    case 'SB': return 'sb';
    case 'BTN': return 'btn';
    case 'CO': return 'co';
    default: return 'tight'; // HJ, MP, UTG+2, UTG+1, UTG
  }
}

// Whether this 3bettor class should trigger the "tight" variant for the opener
function isTight3bettor(cls: ThreeBettorClass): boolean {
  return cls === 'tight';
}

// Whether to use mixed frequencies (wide 3bettors at deep stacks)
function useMixedFor(opClass: ReturnType<typeof openerClass>, tbClass: ThreeBettorClass, depth: StackDepth): boolean {
  if (depth < 40) return false;
  // Wider late-position and blind confrontations should mix much more often.
  if (opClass === 'co' && (tbClass === 'btn' || tbClass === 'sb' || tbClass === 'bb')) return true;
  if (opClass === 'hj' && (tbClass === 'btn' || tbClass === 'sb' || tbClass === 'bb')) return true;
  if (opClass === 'btn' && (tbClass === 'sb' || tbClass === 'bb')) return true;
  if (opClass === 'sb' && tbClass === 'bb') return true;
  return false;
}

// ── 25bb data lookup ──

type Facing25Key = string; // "opener_vs_3bettor"
type Facing25Data = { fourBet: Set<string>; call: Set<string>; mixed?: FacingMixedMap };

const FACING_25_DATA: Record<Facing25Key, Facing25Data> = {
  'ep-tight_vs_tight': { fourBet: FOURBET_25_UTG_VS_HJ, call: CALL_25_UTG_VS_HJ },
  'ep-tight_vs_co': { fourBet: FOURBET_25_UTG_VS_LATE, call: CALL_25_UTG_VS_LATE },
  'ep-tight_vs_btn': { fourBet: FOURBET_25_UTG_VS_LATE, call: CALL_25_UTG_VS_LATE },
  'ep-tight_vs_sb': { fourBet: FOURBET_25_UTG_VS_LATE, call: CALL_25_UTG_VS_LATE },
  'ep-tight_vs_bb': { fourBet: FOURBET_25_UTG_VS_LATE, call: CALL_25_UTG_VS_LATE },
  'hj_vs_co': { fourBet: FOURBET_25_HJ_VS_CO, call: CALL_25_HJ_VS_CO },
  'hj_vs_btn': { fourBet: FOURBET_25_HJ_VS_LATE, call: CALL_25_HJ_VS_LATE },
  'hj_vs_sb': { fourBet: FOURBET_25_HJ_VS_LATE, call: CALL_25_HJ_VS_LATE },
  'hj_vs_bb': { fourBet: FOURBET_25_HJ_VS_LATE, call: CALL_25_HJ_VS_LATE },
  'co_vs_btn': { fourBet: FOURBET_25_CO_VS_BTN, call: CALL_25_CO_VS_BTN },
  'co_vs_sb': { fourBet: FOURBET_25_CO_VS_BLIND, call: CALL_25_CO_VS_BLIND, mixed: FACING_25_CO_VS_BLIND_MIXED },
  'co_vs_bb': { fourBet: FOURBET_25_CO_VS_BLIND, call: CALL_25_CO_VS_BLIND, mixed: FACING_25_CO_VS_BLIND_MIXED },
  'btn_vs_sb': { fourBet: FOURBET_25_BTN_VS_SB, call: CALL_25_BTN_VS_SB, mixed: FACING_25_BTN_VS_SB_MIXED },
  'btn_vs_bb': { fourBet: FOURBET_25_BTN_VS_BB, call: CALL_25_BTN_VS_BB, mixed: FACING_25_BTN_VS_BB_MIXED },
  'sb_vs_bb':  { fourBet: FOURBET_25_SB_VS_BB, call: CALL_25_SB_VS_BB, mixed: FACING_25_SB_VS_BB_MIXED },
};

// ── 15bb jam sets — jam-or-fold only, no calling range ──

const JAM_15_EP_VS_TIGHT = new Set(['AA', 'KK', 'AKs']);
const JAM_15_EP_VS_LATE = new Set(['AA', 'KK', 'AKs', 'AKo']);
const JAM_15_HJ_VS_CO = new Set(['AA', 'KK', 'QQ', 'AKs']);
const JAM_15_HJ_VS_LATE = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const JAM_15_CO_VS_BTN = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);
const JAM_15_CO_VS_BLIND = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const JAM_15_BTN_VS_SB = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AKo']);
const JAM_15_BTN_VS_BB = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo']);
const JAM_15_SB_VS_BB = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo']);

type Facing15Key = string;
type Facing15Data = { jam: Set<string> };

const FACING_15_DATA: Record<Facing15Key, Facing15Data> = {
  'ep-tight_vs_tight': { jam: JAM_15_EP_VS_TIGHT },
  'ep-tight_vs_co':    { jam: JAM_15_EP_VS_LATE },
  'ep-tight_vs_btn':   { jam: JAM_15_EP_VS_LATE },
  'ep-tight_vs_sb':    { jam: JAM_15_EP_VS_LATE },
  'ep-tight_vs_bb':    { jam: JAM_15_EP_VS_LATE },
  'hj_vs_co':          { jam: JAM_15_HJ_VS_CO },
  'hj_vs_btn':         { jam: JAM_15_HJ_VS_LATE },
  'hj_vs_sb':          { jam: JAM_15_HJ_VS_LATE },
  'hj_vs_bb':          { jam: JAM_15_HJ_VS_LATE },
  'co_vs_btn':         { jam: JAM_15_CO_VS_BTN },
  'co_vs_sb':          { jam: JAM_15_CO_VS_BLIND },
  'co_vs_bb':          { jam: JAM_15_CO_VS_BLIND },
  'btn_vs_sb':         { jam: JAM_15_BTN_VS_SB },
  'btn_vs_bb':         { jam: JAM_15_BTN_VS_BB },
  'sb_vs_bb':          { jam: JAM_15_SB_VS_BB },
};

function facing3betJamRange(jamSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    const currentKey = inSet(h, jamSet) ? 'allin' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: 'allin', set: jamSet },
    ]);
    if (smooth) return smooth;
    if (inSet(h, jamSet)) return { allin: 1.0, fold: 0 };
    return { allin: 0, fold: 1.0 };
  };
}

// ── Chart generation ──

function getCallSet(opClass: ReturnType<typeof openerClass>, tbClass: ThreeBettorClass, depth: StackDepth): Set<string> | null {
  const isTight = isTight3bettor(tbClass);

  // If tight 3bettor and we have tight-specific data, use it
  if (isTight && OPENER_TIGHT_DATA[opClass]) {
    const td = OPENER_TIGHT_DATA[opClass]!;
    switch (depth) {
      case 100: return td.call100;
      case 60: return td.call60;
      case 40: return td.call40;
      default: return null;
    }
  }

  // Use regular data
  const d = OPENER_DATA[opClass];
  if (!d) return null;
  switch (depth) {
    case 100: return d.call100;
    case 60: return d.call60;
    case 40: return d.call40;
    default: return null;
  }
}

function getFourBetSet(opClass: ReturnType<typeof openerClass>, tbClass: ThreeBettorClass): Set<string> | null {
  const isTight = isTight3bettor(tbClass);

  if (isTight && OPENER_TIGHT_DATA[opClass]) {
    return OPENER_TIGHT_DATA[opClass]!.fourBet;
  }

  const d = OPENER_DATA[opClass];
  return d ? d.fourBet : null;
}

export function getVs3betCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth === 7) return []; // 7bb is pure push/fold

  const allPositions = positionsForPlayerCount(maxPlayers);
  // Every position except BB can open
  const openers = allPositions.filter(p => p !== 'BB');
  const charts: ChartDef[] = [];

  for (const opener of openers) {
    const openerIdx = allPositions.indexOf(opener);
    // 3bettors are all positions after the opener
    const threeBettors = allPositions.slice(openerIdx + 1);

    const opClass = depth <= 25 ? shallowOpenerClass(opener, maxPlayers) : openerClass(opener);

    for (const threeBettor of threeBettors) {
      const tbClass = threeBettorClass(threeBettor);

      if (depth === 15) {
        const key = `${opClass}_vs_${tbClass}`;
        const data15 = FACING_15_DATA[key];
        if (!data15) continue;

        charts.push({
          position: opener,
          situation: 'Facing 3bet',
          vsPosition: threeBettor,
          category: 'Facing 3bet',
          description: `${opener} vs ${threeBettor} 3bet (${depth}bb)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_JAM_ACTIONS,
          ranges: facing3betJamRange(data15.jam),
        });
      } else if (depth === 25) {
        const key = `${opClass}_vs_${tbClass}`;
        const data = FACING_25_DATA[key];
        if (!data) continue;

        charts.push({
          position: opener,
          situation: 'Facing 3bet',
          vsPosition: threeBettor,
          category: 'Facing 3bet',
          description: `${opener} vs ${threeBettor} 3bet (${depth}bb)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_ACTIONS,
          ranges: facing3betRange(data.fourBet, data.call, data.mixed ?? false),
        });
      } else {
        // 40bb, 60bb, 100bb: 4bet / call / fold
        const fourBetSet = getFourBetSet(opClass, tbClass);
        const callSet = getCallSet(opClass, tbClass, depth);
        if (!fourBetSet || !callSet) continue;

        const mixed = useMixedFor(opClass, tbClass, depth) ? FACING_3BET_MIXED : false;

        charts.push({
          position: opener,
          situation: 'Facing 3bet',
          vsPosition: threeBettor,
          category: 'Facing 3bet',
          description: `${opener} vs ${threeBettor} 3bet (${depth}bb)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_ACTIONS,
          ranges: facing3betRange(fourBetSet, callSet, mixed),
        });
      }
    }
  }

  return charts;
}

// Backward compatibility
export const VS_3BET_CHARTS = getVs3betCharts(100);
