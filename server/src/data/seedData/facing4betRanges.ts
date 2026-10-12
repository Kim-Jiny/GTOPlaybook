import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, openerClass,
} from './helpers';
import { FACING_4BET_ACTIONS } from './actionColors';
import { facing4betEntry } from './facing4betTables';

// Facing 4bet ranges: 5bet(allin) / call / fold
// After opening and facing a 4bet, options are very narrow

// ── Range data by opener class ──

// ── 25bb ranges — pure jam-or-fold ──

const EP_TIGHT_5BET_25 = new Set(['AA', 'KK']);
const HJ_F4B_5BET_25 = new Set(['AA', 'KK']);
const CO_F4B_5BET_25 = new Set(['AA', 'KK', 'AKs']);
const BTN_F4B_VS_SB_5BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BTN_F4B_VS_BB_5BET_25 = new Set(['AA', 'KK', 'AKs']);
const SB_F4B_5BET_25 = new Set(['AA', 'KK']);

// ── Range builders ──

type F4bMixedMap = false | Record<string, { '5bet': number; call: number; fold: number }>;

// 40 / 60 / 100bb: explicit per-opener tables.
function facing4betTableRange(opCls: OpenerCls, depth: 100 | 60 | 40) {
  const entry = facing4betEntry(opCls, depth);
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    const fiveBet = entry.fiveBet[h] ?? 0;
    const call = entry.call[h] ?? 0;
    return { '5bet': fiveBet, call, fold: Math.max(0, Math.round((1 - fiveBet - call) * 100) / 100) };
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
      } else {
        charts.push({
          position: opener,
          situation: 'Facing 4bet',
          vsPosition: vsPos,
          category: 'Facing 4bet',
          description: `${opener} facing 4bet from ${vsPos} (${tag})`,
          stackDepth: d,
          maxPlayers,
          actionTypes: FACING_4BET_ACTIONS,
          ranges: facing4betTableRange(opCls, depth as 100 | 60 | 40),
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
