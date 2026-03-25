import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, openerClass, smoothFrequencies,
} from './helpers';
import { FACING_4BET_ACTIONS } from './actionColors';

// Facing 4bet ranges: 5bet(allin) / call / fold
// After opening and facing a 4bet, options are very narrow

// ── Range data by opener class ──

// "ep-tight" facing 4bet (UTG, UTG+1, UTG+2, MP at 7+)
const EP_TIGHT_5BET   = new Set(['AA', 'KK']);
const EP_TIGHT_CALL   = new Set(['QQ', 'AKs']);
const EP_TIGHT_CALL_60 = new Set(['QQ']);
const EP_TIGHT_5BET_40 = new Set(['AA']);

// HJ facing 4bet (was MP in 6-max)
const HJ_F4B_5BET     = new Set(['AA', 'KK']);
const HJ_F4B_CALL     = new Set(['QQ', 'AKs', 'AKo']);
const HJ_F4B_CALL_60  = new Set(['QQ', 'AKs']);
const HJ_F4B_5BET_40  = new Set(['AA', 'KK']);

// HJ facing 4bet specifically from CO
const HJ_F4B_VS_CO_5BET   = new Set(['AA', 'KK']);
const HJ_F4B_VS_CO_CALL   = new Set(['QQ', 'AKs']);
const HJ_F4B_VS_CO_CALL_60 = new Set(['AKs']);
const HJ_F4B_VS_CO_5BET_40 = new Set(['AA']);

// CO facing 4bet (general — from blinds)
const CO_F4B_5BET     = new Set(['AA', 'KK', 'AKs']);
const CO_F4B_CALL     = new Set(['QQ', 'JJ', 'AKo', 'AQs']);
const CO_F4B_CALL_60  = new Set(['QQ', 'JJ', 'AKo']);
const CO_F4B_5BET_40  = new Set(['AA', 'KK']);

// CO facing 4bet from BTN specifically
const CO_F4B_VS_BTN_5BET   = new Set(['AA', 'KK', 'AKs']);
const CO_F4B_VS_BTN_CALL   = new Set(['QQ', 'JJ', 'AKo', 'AQs']);
const CO_F4B_VS_BTN_CALL_60 = new Set(['QQ', 'JJ', 'AKo']);
const CO_F4B_VS_BTN_5BET_40 = new Set(['AA', 'KK']);

// BTN facing 4bet from SB
const BTN_F4B_VS_SB_5BET     = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BTN_F4B_VS_SB_CALL     = new Set(['JJ', 'TT', 'AKo', 'AQs', 'AQo']);
const BTN_F4B_VS_SB_CALL_60  = new Set(['JJ', 'TT', 'AKo', 'AQs']);
const BTN_F4B_VS_SB_5BET_40  = new Set(['AA', 'KK', 'QQ']);
const BTN_F4B_VS_SB_CALL_40  = new Set(['AKs']);

// BTN facing 4bet from BB
const BTN_F4B_VS_BB_5BET    = new Set(['AA', 'KK', 'AKs']);
const BTN_F4B_VS_BB_CALL    = new Set(['QQ', 'JJ', 'AKo', 'AQs']);
const BTN_F4B_VS_BB_CALL_60 = new Set(['QQ', 'JJ', 'AKo']);
const BTN_F4B_VS_BB_5BET_40 = new Set(['AA', 'KK']);

// SB facing 4bet from BB
const SB_F4B_5BET    = new Set(['AA', 'KK']);
const SB_F4B_CALL    = new Set(['QQ', 'AKs', 'AKo']);
const SB_F4B_CALL_60 = new Set(['QQ', 'AKs']);
const SB_F4B_5BET_40 = new Set(['AA', 'KK']);

// ── 25bb ranges — pure jam-or-fold ──

const EP_TIGHT_5BET_25 = new Set(['AA', 'KK']);
const HJ_F4B_5BET_25 = new Set(['AA', 'KK']);
const CO_F4B_5BET_25 = new Set(['AA', 'KK', 'AKs']);
const BTN_F4B_VS_SB_5BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BTN_F4B_VS_BB_5BET_25 = new Set(['AA', 'KK', 'AKs']);
const SB_F4B_5BET_25 = new Set(['AA', 'KK']);

// ── Range builders ──

type F4bMixedMap = false | Record<string, { '5bet': number; call: number; fold: number }>;

const FACING_4BET_MIXED_DEFAULT: Record<string, { '5bet': number; call: number; fold: number }> = {
  'QQ': { '5bet': 0.34, call: 0.66, fold: 0 },
  'JJ': { '5bet': 0.12, call: 0.7, fold: 0.18 },
  'TT': { '5bet': 0.04, call: 0.54, fold: 0.42 },
  'AKs': { '5bet': 0.42, call: 0.58, fold: 0 },
  'AKo': { '5bet': 0.28, call: 0.52, fold: 0.2 },
  'AQs': { '5bet': 0.14, call: 0.52, fold: 0.34 },
  'AQo': { '5bet': 0.08, call: 0.38, fold: 0.54 },
};

const FACING_4BET_MIXED_40: Record<string, { '5bet': number; call: number; fold: number }> = {
  'AKs': { '5bet': 0.58, call: 0.42, fold: 0 },
  'QQ': { '5bet': 0.18, call: 0.52, fold: 0.3 },
  'JJ': { '5bet': 0.06, call: 0.34, fold: 0.6 },
};

function facing4betRange(
  fiveBetSet: Set<string>,
  callSet: Set<string>,
  mixedMap: F4bMixedMap = false,
) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (mixedMap && h in mixedMap) return mixedMap[h];
    const currentKey = inSet(h, fiveBetSet) ? '5bet' : inSet(h, callSet) ? 'call' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: '5bet', set: fiveBetSet },
      { key: 'call', set: callSet },
    ]);
    if (smooth) return smooth;
    if (inSet(h, fiveBetSet)) return { '5bet': 1.0, call: 0, fold: 0 };
    if (inSet(h, callSet)) return { '5bet': 0, call: 1.0, fold: 0 };
    return { '5bet': 0, call: 0, fold: 1.0 };
  };
}

function jamOrFoldRange(jamSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, jamSet)) return { '5bet': 1.0, call: 0, fold: 0 };
    return { '5bet': 0, call: 0, fold: 1.0 };
  };
}

// ── Per-matchup range data lookup ──
// Uses opener class for the hero (opener), and villain position name for specific matchups.

type OpenerCls = ReturnType<typeof openerClass>;

interface F4bData {
  fiveBet: Set<string>;
  call: Set<string>;
  mixed?: F4bMixedMap;
}

function getRangeData100(opCls: OpenerCls, vsPos?: string): F4bData {
  // Specific matchups first
  if (opCls === 'hj' && vsPos === 'CO') return { fiveBet: HJ_F4B_VS_CO_5BET, call: HJ_F4B_VS_CO_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'co' && vsPos === 'BTN') return { fiveBet: CO_F4B_VS_BTN_5BET, call: CO_F4B_VS_BTN_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'btn' && vsPos === 'SB') return { fiveBet: BTN_F4B_VS_SB_5BET, call: BTN_F4B_VS_SB_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'btn' && vsPos === 'BB') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'sb') return { fiveBet: SB_F4B_5BET, call: SB_F4B_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  // General (facing 4bet from blinds or further behind)
  if (opCls === 'ep-tight') return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL, mixed: { 'QQ': { '5bet': 0.18, call: 0.72, fold: 0.1 }, 'AKs': { '5bet': 0.34, call: 0.66, fold: 0 } } };
  if (opCls === 'hj') return { fiveBet: HJ_F4B_5BET, call: HJ_F4B_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'co') return { fiveBet: CO_F4B_5BET, call: CO_F4B_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'btn') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL, mixed: FACING_4BET_MIXED_DEFAULT };
  return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL, mixed: false };
}

function getRangeData60(opCls: OpenerCls, vsPos?: string): F4bData {
  if (opCls === 'hj' && vsPos === 'CO') return { fiveBet: HJ_F4B_VS_CO_5BET, call: HJ_F4B_VS_CO_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'co' && vsPos === 'BTN') return { fiveBet: CO_F4B_VS_BTN_5BET, call: CO_F4B_VS_BTN_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'btn' && vsPos === 'SB') return { fiveBet: BTN_F4B_VS_SB_5BET, call: BTN_F4B_VS_SB_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'btn' && vsPos === 'BB') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'sb') return { fiveBet: SB_F4B_5BET, call: SB_F4B_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'ep-tight') return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL_60, mixed: { 'AKs': { '5bet': 0.4, call: 0.6, fold: 0 } } };
  if (opCls === 'hj') return { fiveBet: HJ_F4B_5BET, call: HJ_F4B_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'co') return { fiveBet: CO_F4B_5BET, call: CO_F4B_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  if (opCls === 'btn') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL_60, mixed: FACING_4BET_MIXED_DEFAULT };
  return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL_60, mixed: false };
}

function getRangeData40(opCls: OpenerCls, vsPos?: string): { jamSet: Set<string>; callSet?: Set<string>; mixed?: F4bMixedMap } {
  if (opCls === 'hj' && vsPos === 'CO') return { jamSet: HJ_F4B_VS_CO_5BET_40, mixed: FACING_4BET_MIXED_40 };
  if (opCls === 'co' && vsPos === 'BTN') return { jamSet: CO_F4B_VS_BTN_5BET_40, mixed: FACING_4BET_MIXED_40 };
  if (opCls === 'btn' && vsPos === 'SB') return { jamSet: BTN_F4B_VS_SB_5BET_40, callSet: BTN_F4B_VS_SB_CALL_40, mixed: FACING_4BET_MIXED_40 };
  if (opCls === 'btn' && vsPos === 'BB') return { jamSet: BTN_F4B_VS_BB_5BET_40, mixed: FACING_4BET_MIXED_40 };
  if (opCls === 'sb') return { jamSet: SB_F4B_5BET_40, mixed: FACING_4BET_MIXED_40 };
  if (opCls === 'ep-tight') return { jamSet: EP_TIGHT_5BET_40, mixed: { 'AKs': { '5bet': 0.46, call: 0.18, fold: 0.36 } } };
  if (opCls === 'hj') return { jamSet: HJ_F4B_5BET_40, mixed: FACING_4BET_MIXED_40 };
  if (opCls === 'co') return { jamSet: CO_F4B_5BET_40, mixed: FACING_4BET_MIXED_40 };
  if (opCls === 'btn') return { jamSet: BTN_F4B_VS_BB_5BET_40, mixed: FACING_4BET_MIXED_40 };
  return { jamSet: EP_TIGHT_5BET_40, mixed: false };
}

function getRangeData25(opCls: OpenerCls, vsPos?: string): Set<string> {
  if (opCls === 'btn' && vsPos === 'SB') return BTN_F4B_VS_SB_5BET_25;
  if (opCls === 'btn' && vsPos === 'BB') return BTN_F4B_VS_BB_5BET_25;
  if (opCls === 'sb') return SB_F4B_5BET_25;
  if (opCls === 'co') return CO_F4B_5BET_25;
  if (opCls === 'hj') return HJ_F4B_5BET_25;
  return EP_TIGHT_5BET_25;
}

// ── Dynamic chart generation ──

function generateCharts(
  depth: 25 | 40 | 60 | 100,
  maxPlayers: MaxPlayers,
): ChartDef[] {
  const positions = positionsForPlayerCount(maxPlayers);
  const charts: ChartDef[] = [];
  const d = depth;
  const tag = `${d}bb`;

  // Openers that can face a 4bet: all positions except BB
  const openers = positions.filter(p => p !== 'BB');

  for (const opener of openers) {
    const opCls = openerClass(opener);

    // Positions behind the opener (later in action order)
    const behindIdx = positions.indexOf(opener);
    const villains = positions.slice(behindIdx + 1);
    if (villains.length === 0) continue; // no one behind to 4bet

    for (const vsPos of villains) {
      if (depth === 25) {
        const jamSet = getRangeData25(opCls, vsPos);
        charts.push({
          position: opener,
          situation: 'Facing 4bet',
          vsPosition: vsPos,
          category: 'Facing 4bet',
          description: `${opener} facing 4bet from ${vsPos} (${tag})`,
          stackDepth: d,
          maxPlayers,
          actionTypes: FACING_4BET_ACTIONS,
          ranges: jamOrFoldRange(jamSet),
        });
      } else if (depth === 40) {
        const data40 = getRangeData40(opCls, vsPos);
        charts.push({
          position: opener,
          situation: 'Facing 4bet',
          vsPosition: vsPos,
          category: 'Facing 4bet',
          description: `${opener} facing 4bet from ${vsPos} (${tag})`,
          stackDepth: d,
          maxPlayers,
          actionTypes: FACING_4BET_ACTIONS,
          ranges: data40.callSet
            ? facing4betRange(data40.jamSet, data40.callSet, data40.mixed)
            : jamOrFoldRange(data40.jamSet),
        });
      } else {
        const data = depth === 60 ? getRangeData60(opCls, vsPos) : getRangeData100(opCls, vsPos);
        charts.push({
          position: opener,
          situation: 'Facing 4bet',
          vsPosition: vsPos,
          category: 'Facing 4bet',
          description: `${opener} facing 4bet from ${vsPos} (${tag})`,
          stackDepth: d,
          maxPlayers,
          actionTypes: FACING_4BET_ACTIONS,
          ranges: facing4betRange(data.fiveBet, data.call, data.mixed),
        });
      }
    }
  }

  return charts;
}

// ── Public API ──

export function getFacing4betCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  // No facing 4bet at push/fold depths
  if (depth <= 15) return [];

  // HU: no facing 4bet charts (action doesn't typically reach 4bet in simplified HU model)
  if (maxPlayers === 2) return [];

  return generateCharts(depth as 25 | 40 | 60 | 100, maxPlayers);
}

// Backward compatibility
export const FACING_4BET_CHARTS = getFacing4betCharts(100);
