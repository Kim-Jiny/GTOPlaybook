import { ChartDef, StackDepth, handLabel, inSet } from './helpers';
import { FACING_3BET_ACTIONS, PUSH_FOLD_ACTIONS } from './actionColors';

// When facing a 3bet, decisions are: 4bet, call, or fold
// Ranges vary by opener position and 3bettor position

// ── 100bb ranges (deep stack) ──

// UTG facing 3bet — very tight continue range
const UTG_VS_3BET_4BET = new Set(['AA', 'KK', 'AKs']);
const UTG_VS_3BET_CALL = new Set(['QQ', 'JJ', 'TT', 'AKo', 'AQs']);

// MP facing 3bet
const MP_VS_3BET_4BET = new Set(['AA', 'KK', 'AKs']);
const MP_VS_3BET_CALL = new Set(['QQ', 'JJ', 'TT', 'AQs', 'AKo', 'AJs']);

// CO facing 3bet from BTN/SB/BB — wider continue
const CO_VS_3BET_4BET = new Set(['AA', 'KK', 'AKs', 'AKo']);
const CO_VS_3BET_CALL = new Set(['QQ', 'JJ', 'TT', '99', 'AQs', 'AQo', 'AJs', 'KQs', 'ATs']);

// CO facing 3bet from tight positions (UTG/MP style) — tighter
const CO_VS_TIGHT_3BET_4BET = new Set(['AA', 'KK']);
const CO_VS_TIGHT_3BET_CALL = new Set(['QQ', 'JJ', 'AKs', 'AKo']);

// BTN facing 3bet from SB/BB — widest continue
const BTN_VS_3BET_4BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_VS_3BET_CALL = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'A5s', 'A4s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s',
]);

// BTN facing tight 3bet (UTG/MP/CO)
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
const MP_VS_3BET_CALL_60 = new Set(['QQ', 'JJ', 'TT', 'AQs', 'AKo']);
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
const MP_VS_3BET_CALL_40 = new Set(['QQ', 'JJ', 'AKo', 'AQs']);
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

const JAM_25_UTG_VS_MP = new Set(['AA', 'KK']);
const JAM_25_UTG_VS_BTN = new Set(['AA', 'KK', 'AKs']);
const JAM_25_MP_VS_CO = new Set(['AA', 'KK']);
const JAM_25_MP_VS_BTN = new Set(['AA', 'KK', 'AKs']);
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

// ── Chart builders per depth ──

function charts25bb(): ChartDef[] {
  const d = 25;
  return [
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'MP', category: 'Facing 3bet',
      description: 'UTG vs MP 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_UTG_VS_MP),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'UTG vs BTN 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_UTG_VS_BTN),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'CO', category: 'Facing 3bet',
      description: 'MP vs CO 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_MP_VS_CO),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'MP vs BTN 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_MP_VS_BTN),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'CO vs BTN 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_CO_VS_BTN),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'CO vs SB 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_CO_VS_SB),
    },
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'BTN vs SB 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_BTN_VS_SB),
    },
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'BTN vs BB 3bet (25bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: jamOrFoldRange(JAM_25_BTN_VS_BB),
    },
  ];
}

function charts40bb(): ChartDef[] {
  const d = 40;
  return [
    // UTG facing 3bet
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'MP', category: 'Facing 3bet',
      description: 'UTG vs MP 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_40),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'CO', category: 'Facing 3bet',
      description: 'UTG vs CO 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_40),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'UTG vs BTN 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_40),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'UTG vs SB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_40),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'UTG vs BB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_40),
    },

    // MP facing 3bet
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'CO', category: 'Facing 3bet',
      description: 'MP vs CO 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_40),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'MP vs BTN 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_40),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'MP vs SB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_40),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'MP vs BB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_40),
    },

    // CO facing 3bet
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'CO vs BTN 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL_40),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'CO vs SB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL_40),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'CO vs BB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL_40),
    },

    // BTN facing 3bet
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'BTN vs SB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(BTN_VS_3BET_4BET, BTN_VS_3BET_CALL_40),
    },
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'BTN vs BB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(BTN_VS_3BET_4BET, BTN_VS_3BET_CALL_40),
    },

    // SB facing 3bet
    {
      position: 'SB', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'SB vs BB 3bet (40bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(SB_VS_BB_3BET_4BET, SB_VS_BB_3BET_CALL_40),
    },
  ];
}

function charts60bb(): ChartDef[] {
  const d = 60;
  return [
    // UTG facing 3bet
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'MP', category: 'Facing 3bet',
      description: 'UTG vs MP 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_60),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'CO', category: 'Facing 3bet',
      description: 'UTG vs CO 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_60),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'UTG vs BTN 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_60),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'UTG vs SB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_60),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'UTG vs BB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL_60),
    },

    // MP facing 3bet
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'CO', category: 'Facing 3bet',
      description: 'MP vs CO 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_60),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'MP vs BTN 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_60),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'MP vs SB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_60),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'MP vs BB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL_60),
    },

    // CO facing 3bet
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'CO vs BTN 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL_60, true),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'CO vs SB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL_60),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'CO vs BB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL_60),
    },

    // BTN facing 3bet
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'BTN vs SB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(BTN_VS_3BET_4BET, BTN_VS_3BET_CALL_60, true),
    },
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'BTN vs BB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(BTN_VS_3BET_4BET, BTN_VS_3BET_CALL_60, true),
    },

    // SB facing 3bet
    {
      position: 'SB', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'SB vs BB 3bet (60bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(SB_VS_BB_3BET_4BET, SB_VS_BB_3BET_CALL_60, true),
    },
  ];
}

function charts100bb(): ChartDef[] {
  const d = 100;
  return [
    // UTG facing 3bet
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'MP', category: 'Facing 3bet',
      description: 'UTG vs MP 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'CO', category: 'Facing 3bet',
      description: 'UTG vs CO 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'UTG vs BTN 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'UTG vs SB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL),
    },
    {
      position: 'UTG', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'UTG vs BB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(UTG_VS_3BET_4BET, UTG_VS_3BET_CALL),
    },

    // MP facing 3bet
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'CO', category: 'Facing 3bet',
      description: 'MP vs CO 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'MP vs BTN 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'MP vs SB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL),
    },
    {
      position: 'MP', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'MP vs BB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(MP_VS_3BET_4BET, MP_VS_3BET_CALL),
    },

    // CO facing 3bet
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'BTN', category: 'Facing 3bet',
      description: 'CO vs BTN 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL, true),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'CO vs SB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL),
    },
    {
      position: 'CO', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'CO vs BB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(CO_VS_3BET_4BET, CO_VS_3BET_CALL),
    },

    // BTN facing 3bet
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'SB', category: 'Facing 3bet',
      description: 'BTN vs SB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(BTN_VS_3BET_4BET, BTN_VS_3BET_CALL, true),
    },
    {
      position: 'BTN', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'BTN vs BB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(BTN_VS_3BET_4BET, BTN_VS_3BET_CALL, true),
    },

    // SB facing 3bet
    {
      position: 'SB', situation: 'Facing 3bet', vsPosition: 'BB', category: 'Facing 3bet',
      description: 'SB vs BB 3bet (100bb)',
      stackDepth: d,
      actionTypes: FACING_3BET_ACTIONS,
      ranges: facing3betRange(SB_VS_BB_3BET_4BET, SB_VS_BB_3BET_CALL, true),
    },
  ];
}

export function getVs3betCharts(depth: StackDepth): ChartDef[] {
  switch (depth) {
    case 15: return [];
    case 25: return charts25bb();
    case 40: return charts40bb();
    case 60: return charts60bb();
    case 100: return charts100bb();
  }
}

// Backward compatibility
export const VS_3BET_CHARTS = getVs3betCharts(100);
