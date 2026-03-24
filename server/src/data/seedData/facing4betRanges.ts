import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, openerClass,
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

// ── Range builders ──

function facing4betRange(fiveBetSet: Set<string>, callSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
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
}

function getRangeData100(opCls: OpenerCls, vsPos?: string): F4bData {
  // Specific matchups first
  if (opCls === 'hj' && vsPos === 'CO') return { fiveBet: HJ_F4B_VS_CO_5BET, call: HJ_F4B_VS_CO_CALL };
  if (opCls === 'co' && vsPos === 'BTN') return { fiveBet: CO_F4B_VS_BTN_5BET, call: CO_F4B_VS_BTN_CALL };
  if (opCls === 'btn' && vsPos === 'SB') return { fiveBet: BTN_F4B_VS_SB_5BET, call: BTN_F4B_VS_SB_CALL };
  if (opCls === 'btn' && vsPos === 'BB') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL };
  if (opCls === 'sb') return { fiveBet: SB_F4B_5BET, call: SB_F4B_CALL };
  // General (facing 4bet from blinds or further behind)
  if (opCls === 'ep-tight') return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL };
  if (opCls === 'hj') return { fiveBet: HJ_F4B_5BET, call: HJ_F4B_CALL };
  if (opCls === 'co') return { fiveBet: CO_F4B_5BET, call: CO_F4B_CALL };
  if (opCls === 'btn') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL };
  return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL };
}

function getRangeData60(opCls: OpenerCls, vsPos?: string): F4bData {
  if (opCls === 'hj' && vsPos === 'CO') return { fiveBet: HJ_F4B_VS_CO_5BET, call: HJ_F4B_VS_CO_CALL_60 };
  if (opCls === 'co' && vsPos === 'BTN') return { fiveBet: CO_F4B_VS_BTN_5BET, call: CO_F4B_VS_BTN_CALL_60 };
  if (opCls === 'btn' && vsPos === 'SB') return { fiveBet: BTN_F4B_VS_SB_5BET, call: BTN_F4B_VS_SB_CALL_60 };
  if (opCls === 'btn' && vsPos === 'BB') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL_60 };
  if (opCls === 'sb') return { fiveBet: SB_F4B_5BET, call: SB_F4B_CALL_60 };
  if (opCls === 'ep-tight') return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL_60 };
  if (opCls === 'hj') return { fiveBet: HJ_F4B_5BET, call: HJ_F4B_CALL_60 };
  if (opCls === 'co') return { fiveBet: CO_F4B_5BET, call: CO_F4B_CALL_60 };
  if (opCls === 'btn') return { fiveBet: BTN_F4B_VS_BB_5BET, call: BTN_F4B_VS_BB_CALL_60 };
  return { fiveBet: EP_TIGHT_5BET, call: EP_TIGHT_CALL_60 };
}

function getRangeData40(opCls: OpenerCls, vsPos?: string): { jamSet: Set<string>; callSet?: Set<string> } {
  if (opCls === 'hj' && vsPos === 'CO') return { jamSet: HJ_F4B_VS_CO_5BET_40 };
  if (opCls === 'co' && vsPos === 'BTN') return { jamSet: CO_F4B_VS_BTN_5BET_40 };
  if (opCls === 'btn' && vsPos === 'SB') return { jamSet: BTN_F4B_VS_SB_5BET_40, callSet: BTN_F4B_VS_SB_CALL_40 };
  if (opCls === 'btn' && vsPos === 'BB') return { jamSet: BTN_F4B_VS_BB_5BET_40 };
  if (opCls === 'sb') return { jamSet: SB_F4B_5BET_40 };
  if (opCls === 'ep-tight') return { jamSet: EP_TIGHT_5BET_40 };
  if (opCls === 'hj') return { jamSet: HJ_F4B_5BET_40 };
  if (opCls === 'co') return { jamSet: CO_F4B_5BET_40 };
  if (opCls === 'btn') return { jamSet: BTN_F4B_VS_BB_5BET_40 };
  return { jamSet: EP_TIGHT_5BET_40 };
}

// ── Dynamic chart generation ──

/** Known specific matchups that get their own chart (opener class -> villain position) */
const SPECIFIC_MATCHUPS: [OpenerCls, string][] = [
  ['hj', 'CO'],
  ['co', 'BTN'],
  ['btn', 'SB'],
  ['btn', 'BB'],
];

function generateCharts(
  depth: 40 | 60 | 100,
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

    // Track which villains got a specific chart
    const handledVillains = new Set<string>();

    // Generate specific matchup charts
    for (const [oCls, vsPos] of SPECIFIC_MATCHUPS) {
      if (opCls !== oCls) continue;
      if (!villains.includes(vsPos)) continue;

      if (depth === 40) {
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
            ? facing4betRange(data40.jamSet, data40.callSet)
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
          ranges: facing4betRange(data.fiveBet, data.call),
        });
      }
      handledVillains.add(vsPos);
    }

    // Generate general chart for remaining villains (if any)
    const remaining = villains.filter(v => !handledVillains.has(v));
    if (remaining.length === 0) continue;

    // For SB, the only remaining villain is BB
    const vsLabel = remaining.length === 1 ? remaining[0] : undefined;

    if (depth === 40) {
      const data40 = getRangeData40(opCls);
      charts.push({
        position: opener,
        situation: 'Facing 4bet',
        ...(vsLabel ? { vsPosition: vsLabel } : {}),
        category: 'Facing 4bet',
        description: `${opener} facing 4bet${vsLabel ? ` from ${vsLabel}` : ''} (${tag})`,
        stackDepth: d,
        maxPlayers,
        actionTypes: FACING_4BET_ACTIONS,
        ranges: data40.callSet
          ? facing4betRange(data40.jamSet, data40.callSet)
          : jamOrFoldRange(data40.jamSet),
      });
    } else {
      const data = depth === 60 ? getRangeData60(opCls) : getRangeData100(opCls);
      charts.push({
        position: opener,
        situation: 'Facing 4bet',
        ...(vsLabel ? { vsPosition: vsLabel } : {}),
        category: 'Facing 4bet',
        description: `${opener} facing 4bet${vsLabel ? ` from ${vsLabel}` : ''} (${tag})`,
        stackDepth: d,
        maxPlayers,
        actionTypes: FACING_4BET_ACTIONS,
        ranges: facing4betRange(data.fiveBet, data.call),
      });
    }
  }

  return charts;
}

// ── Public API ──

export function getFacing4betCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  // No facing 4bet at push/fold depths
  if (depth === 15) return [];
  if (depth === 25) return [];

  // HU: no facing 4bet charts (action doesn't typically reach 4bet in simplified HU model)
  if (maxPlayers === 2) return [];

  return generateCharts(depth as 40 | 60 | 100, maxPlayers);
}

// Backward compatibility
export const FACING_4BET_CHARTS = getFacing4betCharts(100);
