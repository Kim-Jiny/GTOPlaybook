import { ChartDef, StackDepth, handLabel, inSet } from './helpers';
import { FACING_4BET_ACTIONS } from './actionColors';

// Facing 4bet ranges: 5bet(allin) / call / fold
// After opening and facing a 4bet, options are very narrow

// ── 100bb ranges (deep stack) ──

// UTG facing 4bet — only premiums continue
const UTG_F4B_5BET = new Set(['AA', 'KK']);
const UTG_F4B_CALL = new Set(['QQ', 'AKs']);

// MP facing 4bet
const MP_F4B_5BET = new Set(['AA', 'KK']);
const MP_F4B_CALL = new Set(['QQ', 'AKs', 'AKo']);

// CO facing 4bet — slightly wider
const CO_F4B_5BET = new Set(['AA', 'KK', 'AKs']);
const CO_F4B_CALL = new Set(['QQ', 'JJ', 'AKo', 'AQs']);

// BTN facing 4bet from SB
const BTN_F4B_VS_SB_5BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BTN_F4B_VS_SB_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs', 'AQo']);

// BTN facing 4bet from BB
const BTN_F4B_VS_BB_5BET = new Set(['AA', 'KK', 'AKs']);
const BTN_F4B_VS_BB_CALL = new Set(['QQ', 'JJ', 'AKo', 'AQs']);

// CO facing 4bet from BTN
const CO_F4B_VS_BTN_5BET = new Set(['AA', 'KK', 'AKs']);
const CO_F4B_VS_BTN_CALL = new Set(['QQ', 'JJ', 'AKo', 'AQs']);

// SB facing 4bet (after 3bet)
const SB_F4B_5BET = new Set(['AA', 'KK']);
const SB_F4B_CALL = new Set(['QQ', 'AKs', 'AKo']);

// MP facing 4bet from CO
const MP_F4B_VS_CO_5BET = new Set(['AA', 'KK']);
const MP_F4B_VS_CO_CALL = new Set(['QQ', 'AKs']);

// ── 60bb ranges — slightly tighter calls than 100bb ──

const UTG_F4B_CALL_60 = new Set(['QQ']);
const MP_F4B_CALL_60 = new Set(['QQ', 'AKs']);
const MP_F4B_VS_CO_CALL_60 = new Set(['AKs']);
const CO_F4B_CALL_60 = new Set(['QQ', 'JJ', 'AKo']);
const CO_F4B_VS_BTN_CALL_60 = new Set(['QQ', 'JJ', 'AKo']);
const BTN_F4B_VS_SB_CALL_60 = new Set(['JJ', 'TT', 'AKo', 'AQs']);
const BTN_F4B_VS_BB_CALL_60 = new Set(['QQ', 'JJ', 'AKo']);
const SB_F4B_CALL_60 = new Set(['QQ', 'AKs']);

// ── 40bb ranges — jam or fold (no flat-calling) ──

const UTG_F4B_5BET_40 = new Set(['AA']);
const MP_F4B_5BET_40 = new Set(['AA', 'KK']);
const MP_F4B_VS_CO_5BET_40 = new Set(['AA']);
const CO_F4B_5BET_40 = new Set(['AA', 'KK']);
const CO_F4B_VS_BTN_5BET_40 = new Set(['AA', 'KK']);
const BTN_F4B_VS_SB_5BET_40 = new Set(['AA', 'KK', 'QQ']);
const BTN_F4B_VS_SB_CALL_40 = new Set(['AKs']);
const BTN_F4B_VS_BB_5BET_40 = new Set(['AA', 'KK']);
const SB_F4B_5BET_40 = new Set(['AA', 'KK']);

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

// ── Chart builders per depth ──

function charts40bb(): ChartDef[] {
  const d = 40;
  return [
    {
      position: 'UTG', situation: 'Facing 4bet', category: 'Facing 4bet',
      description: 'UTG facing 4bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: jamOrFoldRange(UTG_F4B_5BET_40),
    },
    {
      position: 'MP', situation: 'Facing 4bet', vsPosition: 'CO', category: 'Facing 4bet',
      description: 'MP facing 4bet from CO (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: jamOrFoldRange(MP_F4B_VS_CO_5BET_40),
    },
    {
      position: 'MP', situation: 'Facing 4bet', vsPosition: 'BTN', category: 'Facing 4bet',
      description: 'MP facing 4bet from BTN+ (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: jamOrFoldRange(MP_F4B_5BET_40),
    },
    {
      position: 'CO', situation: 'Facing 4bet', vsPosition: 'BTN', category: 'Facing 4bet',
      description: 'CO facing 4bet from BTN (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: jamOrFoldRange(CO_F4B_VS_BTN_5BET_40),
    },
    {
      position: 'CO', situation: 'Facing 4bet', category: 'Facing 4bet',
      description: 'CO facing 4bet from blinds (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: jamOrFoldRange(CO_F4B_5BET_40),
    },
    {
      position: 'BTN', situation: 'Facing 4bet', vsPosition: 'SB', category: 'Facing 4bet',
      description: 'BTN facing 4bet from SB (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(BTN_F4B_VS_SB_5BET_40, BTN_F4B_VS_SB_CALL_40),
    },
    {
      position: 'BTN', situation: 'Facing 4bet', vsPosition: 'BB', category: 'Facing 4bet',
      description: 'BTN facing 4bet from BB (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: jamOrFoldRange(BTN_F4B_VS_BB_5BET_40),
    },
    {
      position: 'SB', situation: 'Facing 4bet', vsPosition: 'BB', category: 'Facing 4bet',
      description: 'SB facing 4bet from BB (40bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: jamOrFoldRange(SB_F4B_5BET_40),
    },
  ];
}

function charts60bb(): ChartDef[] {
  const d = 60;
  return [
    {
      position: 'UTG', situation: 'Facing 4bet', category: 'Facing 4bet',
      description: 'UTG facing 4bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(UTG_F4B_5BET, UTG_F4B_CALL_60),
    },
    {
      position: 'MP', situation: 'Facing 4bet', vsPosition: 'CO', category: 'Facing 4bet',
      description: 'MP facing 4bet from CO (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(MP_F4B_VS_CO_5BET, MP_F4B_VS_CO_CALL_60),
    },
    {
      position: 'MP', situation: 'Facing 4bet', vsPosition: 'BTN', category: 'Facing 4bet',
      description: 'MP facing 4bet from BTN+ (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(MP_F4B_5BET, MP_F4B_CALL_60),
    },
    {
      position: 'CO', situation: 'Facing 4bet', vsPosition: 'BTN', category: 'Facing 4bet',
      description: 'CO facing 4bet from BTN (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(CO_F4B_VS_BTN_5BET, CO_F4B_VS_BTN_CALL_60),
    },
    {
      position: 'CO', situation: 'Facing 4bet', category: 'Facing 4bet',
      description: 'CO facing 4bet from blinds (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(CO_F4B_5BET, CO_F4B_CALL_60),
    },
    {
      position: 'BTN', situation: 'Facing 4bet', vsPosition: 'SB', category: 'Facing 4bet',
      description: 'BTN facing 4bet from SB (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(BTN_F4B_VS_SB_5BET, BTN_F4B_VS_SB_CALL_60),
    },
    {
      position: 'BTN', situation: 'Facing 4bet', vsPosition: 'BB', category: 'Facing 4bet',
      description: 'BTN facing 4bet from BB (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(BTN_F4B_VS_BB_5BET, BTN_F4B_VS_BB_CALL_60),
    },
    {
      position: 'SB', situation: 'Facing 4bet', vsPosition: 'BB', category: 'Facing 4bet',
      description: 'SB facing 4bet from BB (60bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(SB_F4B_5BET, SB_F4B_CALL_60),
    },
  ];
}

function charts100bb(): ChartDef[] {
  const d = 100;
  return [
    {
      position: 'UTG', situation: 'Facing 4bet', category: 'Facing 4bet',
      description: 'UTG facing 4bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(UTG_F4B_5BET, UTG_F4B_CALL),
    },
    {
      position: 'MP', situation: 'Facing 4bet', vsPosition: 'CO', category: 'Facing 4bet',
      description: 'MP facing 4bet from CO (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(MP_F4B_VS_CO_5BET, MP_F4B_VS_CO_CALL),
    },
    {
      position: 'MP', situation: 'Facing 4bet', vsPosition: 'BTN', category: 'Facing 4bet',
      description: 'MP facing 4bet from BTN+ (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(MP_F4B_5BET, MP_F4B_CALL),
    },
    {
      position: 'CO', situation: 'Facing 4bet', vsPosition: 'BTN', category: 'Facing 4bet',
      description: 'CO facing 4bet from BTN (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(CO_F4B_VS_BTN_5BET, CO_F4B_VS_BTN_CALL),
    },
    {
      position: 'CO', situation: 'Facing 4bet', category: 'Facing 4bet',
      description: 'CO facing 4bet from blinds (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(CO_F4B_5BET, CO_F4B_CALL),
    },
    {
      position: 'BTN', situation: 'Facing 4bet', vsPosition: 'SB', category: 'Facing 4bet',
      description: 'BTN facing 4bet from SB (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(BTN_F4B_VS_SB_5BET, BTN_F4B_VS_SB_CALL),
    },
    {
      position: 'BTN', situation: 'Facing 4bet', vsPosition: 'BB', category: 'Facing 4bet',
      description: 'BTN facing 4bet from BB (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(BTN_F4B_VS_BB_5BET, BTN_F4B_VS_BB_CALL),
    },
    {
      position: 'SB', situation: 'Facing 4bet', vsPosition: 'BB', category: 'Facing 4bet',
      description: 'SB facing 4bet from BB (100bb)',
      stackDepth: d,
      actionTypes: FACING_4BET_ACTIONS,
      ranges: facing4betRange(SB_F4B_5BET, SB_F4B_CALL),
    },
  ];
}

export function getFacing4betCharts(depth: StackDepth): ChartDef[] {
  switch (depth) {
    case 15: return [];
    case 25: return [];
    case 40: return charts40bb();
    case 60: return charts60bb();
    case 100: return charts100bb();
  }
}

// Backward compatibility
export const FACING_4BET_CHARTS = getFacing4betCharts(100);
