import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, openerClass, shallowOpenerClass,
} from './helpers';
import { monotoneRange } from './thresholdRange';
import { FACING_3BET_ACTIONS, FACING_3BET_JAM_ACTIONS } from './actionColors';
import { VS_3BET_100, Vs3betEntry, scaleCalls } from './vs3betTables';

// When facing a 3bet, decisions are: 4bet, call, or fold
// Ranges vary by opener position and 3bettor position

// ── 100bb ranges (deep stack) ──

// ── 60bb ranges — slightly tighter calls (~15% reduction) ──

// ── 40bb ranges — tighter calls (~30% reduction) ──

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
// Facing 3bet has narrow call sets (5-9 hands), so smoothFrequencies can't produce
// good values for boundary hands (especially pairs). Keep all boundary hands here.
const FACING_3BET_MIXED: FacingMixedMap = {
  'QQ': { '4bet': 0.45, call: 0.55, fold: 0 },
  'JJ': { '4bet': 0.2, call: 0.8, fold: 0 },
  'TT': { '4bet': 0.08, call: 0.58, fold: 0.34 },
  '99': { '4bet': 0.04, call: 0.42, fold: 0.54 },
  'AKo': { '4bet': 0.58, call: 0.42, fold: 0 },
  'AQs': { '4bet': 0.3, call: 0.6, fold: 0.1 },
  'AQo': { '4bet': 0.14, call: 0.36, fold: 0.5 },
  'AJs': { '4bet': 0.08, call: 0.5, fold: 0.42 },
  'ATs': { '4bet': 0.04, call: 0.38, fold: 0.58 },
  'KQs': { '4bet': 0.18, call: 0.42, fold: 0.4 },
  'KJs': { '4bet': 0.06, call: 0.32, fold: 0.62 },
  'QJs': { '4bet': 0.04, call: 0.36, fold: 0.6 },
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
  return monotoneRange((h) => {
    if (mixedMap && h in mixedMap && !inSet(h, fourBetSet)) return mixedMap[h];
    if (inSet(h, fourBetSet)) return { '4bet': 1.0, call: 0, fold: 0 };
    if (inSet(h, callSet)) return { '4bet': 0, call: 1.0, fold: 0 };
    return { '4bet': 0, call: 0, fold: 1.0 };
  }, ['4bet', 'call']);
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

// Tight-variant data for openers facing 3bets from tight positions
type TightRangeSet = {
  fourBet: Set<string>;
  call100: Set<string>;
  call60: Set<string>;
  call40: Set<string>;
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
  return monotoneRange((h) => (inSet(h, jamSet) ? { allin: 1.0, fold: 0 } : { allin: 0, fold: 1.0 }), ['allin']);
}

// ── 40 / 60 / 100bb: explicit tables ──

function tableEntry(opClass: ReturnType<typeof openerClass>, tbClass: ThreeBettorClass, depth: StackDepth): Vs3betEntry | null {
  const group = tbClass === 'sb' || tbClass === 'bb' ? 'blind'
    : tbClass === 'tight' ? 'tight'
    : tbClass === 'co' && opClass === 'btn' ? 'co'
    : 'late';
  const base = VS_3BET_100[`${opClass}:${group}`];
  if (!base) return null;
  if (depth === 60) return scaleCalls(base, 0.85);
  if (depth === 40) return scaleCalls(base, 0.7);
  if (depth === 25) return scaleCalls(base, 0.5);
  if (depth === 15) return scaleCalls(base, 0.4);
  return base;
}

// 15bb is jam-or-fold: the 4bet range jams and part of the calling range turns into a jam.
function facing3betJamTableRange(entry: Vs3betEntry) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    const jam = Math.min(1, (entry.fourBet[h] ?? 0) + 1.2 * (entry.call[h] ?? 0));
    return { allin: Math.round(jam * 100) / 100, fold: Math.round((1 - jam) * 100) / 100 };
  };
}

function facing3betTableRange(entry: Vs3betEntry) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    const fourBet = entry.fourBet[h] ?? 0;
    const call = entry.call[h] ?? 0;
    return { '4bet': fourBet, call, fold: Math.max(0, Math.round((1 - fourBet - call) * 100) / 100) };
  };
}

// ── Chart generation ──

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
        const entry15 = tableEntry(opClass, tbClass, 15);

        charts.push({
          position: opener,
          situation: 'Facing 3bet',
          vsPosition: threeBettor,
          category: 'Facing 3bet',
          description: `${opener} vs ${threeBettor} 3bet (${depth}bb)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_JAM_ACTIONS,
          ranges: entry15 ? facing3betJamTableRange(entry15) : facing3betJamRange(data15.jam),
        });
      } else if (depth === 25) {
        const key = `${opClass}_vs_${tbClass}`;
        const data = FACING_25_DATA[key];
        if (!data) continue;
        const entry25 = tableEntry(opClass, tbClass, 25);

        charts.push({
          position: opener,
          situation: 'Facing 3bet',
          vsPosition: threeBettor,
          category: 'Facing 3bet',
          description: `${opener} vs ${threeBettor} 3bet (${depth}bb)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_ACTIONS,
          ranges: entry25 ? facing3betTableRange(entry25) : facing3betRange(data.fourBet, data.call, data.mixed ?? false),
        });
      } else {
        // 40bb, 60bb, 100bb: 4bet / call / fold from the explicit tables
        const entry = tableEntry(opClass, tbClass, depth);
        if (!entry) continue;

        charts.push({
          position: opener,
          situation: 'Facing 3bet',
          vsPosition: threeBettor,
          category: 'Facing 3bet',
          description: `${opener} vs ${threeBettor} 3bet (${depth}bb)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_ACTIONS,
          ranges: facing3betTableRange(entry),
        });
      }
    }
  }

  return charts;
}

// Backward compatibility
export const VS_3BET_CHARTS = getVs3betCharts(100);
