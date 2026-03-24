import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, openerClass,
} from './helpers';
import { FACING_3BET_ACTIONS, PUSH_FOLD_ACTIONS } from './actionColors';

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

// ── 25bb ranges — facing 3bet is mostly 4bet-jam or fold ──

const JAM_25_UTG_VS_HJ = new Set(['AA', 'KK']);
const JAM_25_UTG_VS_BTN = new Set(['AA', 'KK', 'AKs']);
const JAM_25_HJ_VS_CO = new Set(['AA', 'KK']);
const JAM_25_HJ_VS_BTN = new Set(['AA', 'KK', 'AKs']);
const JAM_25_CO_VS_BTN = new Set(['AA', 'KK', 'AKs']);
const JAM_25_CO_VS_SB = new Set(['AA', 'KK', 'AKs']);
const JAM_25_BTN_VS_SB = new Set(['AA', 'KK', 'QQ', 'AKs']);
const JAM_25_BTN_VS_BB = new Set(['AA', 'KK', 'QQ', 'AKs']);

// Mixed frequency hands at boundary (e.g. QQ sometimes 4bets, sometimes calls)
const FACING_3BET_MIXED: Record<string, { '4bet': number; call: number; fold: number }> = {
  'QQ': { '4bet': 0.45, call: 0.55, fold: 0 },
  'JJ': { '4bet': 0.2, call: 0.8, fold: 0 },
  'AQs': { '4bet': 0.3, call: 0.6, fold: 0.1 },
  'AQo': { '4bet': 0.15, call: 0.55, fold: 0.3 },
  'TT': { '4bet': 0.1, call: 0.7, fold: 0.2 },
  '99': { '4bet': 0, call: 0.6, fold: 0.4 },
};

// ── Range helper functions ──

function facing3betRange(fourBetSet: Set<string>, callSet: Set<string>, useMixed = false) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, fourBetSet)) return { '4bet': 1.0, call: 0, fold: 0 };
    if (useMixed && h in FACING_3BET_MIXED) return FACING_3BET_MIXED[h];
    if (inSet(h, callSet)) return { '4bet': 0, call: 1.0, fold: 0 };
    return { '4bet': 0, call: 0, fold: 1.0 };
  };
}

function jamOrFoldRange(jamSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, jamSet)) return { '4bet': 1.0, call: 0, fold: 0 };
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
  if (depth < 60) return false;
  // CO vs BTN (wide), BTN vs SB/BB (wide), SB vs BB
  if (opClass === 'co' && tbClass === 'btn') return true;
  if (opClass === 'btn' && (tbClass === 'sb' || tbClass === 'bb')) return true;
  if (opClass === 'sb' && tbClass === 'bb') return true;
  return false;
}

// ── 25bb jam-or-fold data lookup ──

type JamKey = string; // "opener_vs_3bettor"

const JAM_25_DATA: Record<JamKey, Set<string>> = {
  'ep-tight_vs_tight': JAM_25_UTG_VS_HJ,
  'ep-tight_vs_co': JAM_25_UTG_VS_BTN, // UTG vs CO ≈ UTG vs BTN
  'ep-tight_vs_btn': JAM_25_UTG_VS_BTN,
  'ep-tight_vs_sb': JAM_25_UTG_VS_BTN, // UTG vs SB ≈ UTG vs BTN
  'ep-tight_vs_bb': JAM_25_UTG_VS_BTN,
  'hj_vs_co': JAM_25_HJ_VS_CO,
  'hj_vs_btn': JAM_25_HJ_VS_BTN,
  'hj_vs_sb': JAM_25_HJ_VS_BTN,  // HJ vs SB ≈ HJ vs BTN
  'hj_vs_bb': JAM_25_HJ_VS_BTN,
  'co_vs_btn': JAM_25_CO_VS_BTN,
  'co_vs_sb': JAM_25_CO_VS_SB,
  'co_vs_bb': JAM_25_CO_VS_SB,    // CO vs BB ≈ CO vs SB
  'btn_vs_sb': JAM_25_BTN_VS_SB,
  'btn_vs_bb': JAM_25_BTN_VS_BB,
};

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
  const allPositions = positionsForPlayerCount(maxPlayers);
  // Every position except BB can open
  const openers = allPositions.filter(p => p !== 'BB');
  const charts: ChartDef[] = [];

  for (const opener of openers) {
    const openerIdx = allPositions.indexOf(opener);
    // 3bettors are all positions after the opener
    const threeBettors = allPositions.slice(openerIdx + 1);

    const opClass = openerClass(opener);

    for (const threeBettor of threeBettors) {
      const tbClass = threeBettorClass(threeBettor);

      if (depth === 15 || depth === 25) {
        // 15-25bb: jam or fold
        const jamKey = `${opClass}_vs_${tbClass}`;
        const jamSet = JAM_25_DATA[jamKey];
        if (!jamSet) continue; // no data for this matchup

        charts.push({
          position: opener,
          situation: 'Facing 3bet',
          vsPosition: threeBettor,
          category: 'Facing 3bet',
          description: `${opener} vs ${threeBettor} 3bet (${depth}bb)`,
          stackDepth: depth,
          maxPlayers,
          actionTypes: FACING_3BET_ACTIONS,
          ranges: jamOrFoldRange(jamSet),
        });
      } else {
        // 40bb, 60bb, 100bb: 4bet / call / fold
        const fourBetSet = getFourBetSet(opClass, tbClass);
        const callSet = getCallSet(opClass, tbClass, depth);
        if (!fourBetSet || !callSet) continue;

        const mixed = useMixedFor(opClass, tbClass, depth);

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
