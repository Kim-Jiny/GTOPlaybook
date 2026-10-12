import { ChartDef, FreqMap, handLabel, MaxPlayers, positionsForPlayerCount, openerClass, shallowOpenerClass, StackDepth } from './helpers';
import {  } from './thresholdRange';
import { bbDefendEntry } from './bbDefendTables';

type OpenerCls = 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb';
import { BB_DEFEND_ACTIONS, BB_DEFEND_JAM_ACTIONS } from './actionColors';

// BB Defend ranges vs each position's open

// ---------------------------------------------------------------------------
// 100bb ranges (original)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 15bb ranges — mostly reshove-or-fold, very small call range
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 25bb ranges — tighter than 40bb, but still a real defend tree
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 40bb ranges — tighter than 100bb, call sets reduced ~20%
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 60bb ranges — slightly tighter than 100bb, call sets reduced ~10%
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HU (Heads-Up) BB Defend ranges — SB opens ~80%, BB defends much wider
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Range builder helpers
// ---------------------------------------------------------------------------

// Explicit-table range. At 15bb BB jams or folds (a few calls), so 3bet-type hands
// become all-ins and the calling range shrinks.
function bbDefendTableRange(cls: OpenerCls, depth: 100 | 60 | 40 | 25 | 15) {
  const entry = bbDefendEntry(cls, depth);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return (row: number, col: number): FreqMap => {
    const h = handLabel(row, col);
    const threeBet = entry.threeBet[h] ?? 0;
    const call = entry.call[h] ?? 0;
    if (depth === 15) {
      const allin = Math.min(1, threeBet + 0.5 * call);
      const flat = Math.min(0.3 * call, 1 - allin);
      return { allin: round2(allin), call: round2(flat), fold: round2(1 - allin - flat) };
    }
    return { '3bet': threeBet, call, fold: Math.max(0, round2(1 - threeBet - call)) };
  };
}

// ---------------------------------------------------------------------------
// Range data lookup by opener class and stack depth
// ---------------------------------------------------------------------------

type MixedMap = false | Record<string, { '3bet': number; call: number; fold: number }>;

interface RangeData100 {
  threeBet: Set<string>;
  call: Set<string>;
  mixed: MixedMap;
}

interface RangeData25 {
  threeBet: Set<string>;
  jam: Set<string>;
  call: Set<string>;
}

// ---------------------------------------------------------------------------
// Chart builder per stack depth — multi-table aware
// ---------------------------------------------------------------------------

export function getBbDefendCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth === 7) return []; // 7bb is pure push/fold

  // BB can face opens from every position except BB itself
  const openers = positionsForPlayerCount(maxPlayers).filter(p => p !== 'BB');
  const jam = depth === 15;

  return openers.map((opener): ChartDef => {
    // Heads-up: SB opens very wide, so it uses the widest (SB) opener table.
    const cls: OpenerCls = maxPlayers === 2
      ? 'sb'
      : depth <= 25 ? shallowOpenerClass(opener, maxPlayers) : openerClass(opener);
    return {
      position: 'BB',
      situation: 'Defend',
      vsPosition: opener,
      category: 'Defend',
      stackDepth: depth,
      maxPlayers,
      description: `BB Defend vs ${opener} open (${depth}bb)`,
      actionTypes: jam ? BB_DEFEND_JAM_ACTIONS : BB_DEFEND_ACTIONS,
      ranges: bbDefendTableRange(cls, depth as 100 | 60 | 40 | 25 | 15),
    };
  });
}

// Backward compatibility
export const BB_DEFEND_CHARTS = getBbDefendCharts(100);
