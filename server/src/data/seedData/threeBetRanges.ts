import { ChartDef, handLabel, inSet, StackDepth } from './helpers';
import { THREE_BET_ACTIONS, THREE_BET_FOLD_ACTIONS } from './actionColors';

// 3bet ranges when facing an open from various positions

// ---------------------------------------------------------------------------
// 100bb ranges (original)
// ---------------------------------------------------------------------------

// MP 3betting vs UTG open — very tight
const MP_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const MP_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs']);

// CO 3betting vs UTG open — very tight
const CO_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const CO_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs']);

// CO 3betting vs MP open
const CO_3BET_VS_MP_3BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const CO_3BET_VS_MP_CALL = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs']);

// BTN 3betting vs UTG open
const BTN_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BTN_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs', 'AJs']);

// BTN 3betting vs MP open
const BTN_3BET_VS_MP_3BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_MP_CALL = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs', 'KQs']);

// BTN 3betting vs CO open — wider
const BTN_3BET_VS_CO_3BET = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'A5s', 'A4s']);
const BTN_3BET_VS_CO_CALL = new Set([
  'TT', '99', '88', '77',
  'AQo', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s',
]);

// SB 3betting vs UTG open — very tight
const SB_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const SB_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs']);

// SB 3betting vs MP open
const SB_3BET_VS_MP_3BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_MP_CALL = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs']);

// SB 3betting vs CO open
const SB_3BET_VS_CO_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ',
  'AKs', 'AKo', 'AQs', 'AQo',
  'A5s', 'A4s',
]);
const SB_3BET_VS_CO_CALL = new Set([
  'TT', '99', '88',
  'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
]);

// SB 3betting vs BTN open — polarized
const SB_3BET_VS_BTN_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s',
  'K9s', 'Q9s', 'J9s',
]);
const SB_3BET_VS_BTN_CALL = new Set([
  '99', '88', '77', '66',
  'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
  'KQs', 'KJs', 'KTs',
  'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s',
]);

// ---------------------------------------------------------------------------
// 60bb ranges — same positions as 100bb, call sets reduced ~10-15%
// ---------------------------------------------------------------------------

const MP_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_MP_CALL_60 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo']);
const BTN_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo', 'AQs']);
const BTN_3BET_VS_MP_CALL_60 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs']);
const BTN_3BET_VS_CO_CALL_60 = new Set([
  'TT', '99', '88', '77',
  'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
]);
const SB_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo']);
const SB_3BET_VS_MP_CALL_60 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo']);
const SB_3BET_VS_CO_CALL_60 = new Set([
  'TT', '99', '88',
  'AJs', 'ATs',
  'KQs', 'KJs', 'QJs', 'QTs', 'JTs', 'T9s',
]);
const SB_3BET_VS_BTN_CALL_60 = new Set([
  '99', '88', '77',
  'ATs', 'A9s', 'A8s', 'A7s',
  'KQs', 'KJs', 'KTs',
  'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s',
]);

// ---------------------------------------------------------------------------
// 40bb ranges — same positions as 100bb, call sets reduced ~30%
// ---------------------------------------------------------------------------

const MP_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_MP_CALL_40 = new Set(['JJ', 'TT', 'AQs', 'AQo']);
const BTN_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const BTN_3BET_VS_MP_CALL_40 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo']);
const BTN_3BET_VS_CO_CALL_40 = new Set([
  'TT', '99', '88',
  'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '98s',
]);
const SB_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const SB_3BET_VS_MP_CALL_40 = new Set(['JJ', 'TT', 'AQs', 'AQo']);
const SB_3BET_VS_CO_CALL_40 = new Set([
  'TT', '99',
  'AJs', 'ATs',
  'KQs', 'KJs', 'QJs', 'JTs', 'T9s',
]);
const SB_3BET_VS_BTN_CALL_40 = new Set([
  '99', '88', '77',
  'ATs', 'A9s', 'A8s',
  'KQs', 'KJs',
  'QJs', 'JTs', 'T9s', '98s',
]);

// ---------------------------------------------------------------------------
// 25bb ranges — only SB+BTN, jam-or-fold style (no calling range)
// ---------------------------------------------------------------------------

const BTN_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_MP_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_CO_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);
const SB_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_MP_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_BTN_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);

const EMPTY_CALL = new Set<string>();

// ---------------------------------------------------------------------------
// threeBetRange helper
// ---------------------------------------------------------------------------

function threeBetRange(threeBetSet: Set<string>, callSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, call: 0, fold: 0 };
    if (inSet(h, callSet)) return { '3bet': 0, call: 1.0, fold: 0 };
    return { '3bet': 0, call: 0, fold: 1.0 };
  };
}

// ---------------------------------------------------------------------------
// Depth-based chart generation
// ---------------------------------------------------------------------------

function charts100bb(depth: StackDepth): ChartDef[] {
  return [
    // MP 3bet vs UTG
    {
      position: 'MP', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `MP 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(MP_3BET_VS_UTG_3BET, MP_3BET_VS_UTG_CALL),
    },
    // CO 3bet vs openers
    {
      position: 'CO', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `CO 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL),
    },
    {
      position: 'CO', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `CO 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(CO_3BET_VS_MP_3BET, CO_3BET_VS_MP_CALL),
    },
    // BTN 3bet vs openers
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `BTN 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `BTN 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_MP_3BET, BTN_3BET_VS_MP_CALL),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'CO', category: '3bet vs Opener',
      description: `BTN 3bet vs CO open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL),
    },
    // SB 3bet vs openers
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `SB 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `SB 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_MP_3BET, SB_3BET_VS_MP_CALL),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'CO', category: '3bet vs Opener',
      description: `SB 3bet vs CO open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'BTN', category: '3bet vs Opener',
      description: `SB 3bet vs BTN open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL),
    },
  ];
}

function charts60bb(depth: StackDepth): ChartDef[] {
  return [
    {
      position: 'MP', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `MP 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(MP_3BET_VS_UTG_3BET, MP_3BET_VS_UTG_CALL_60),
    },
    {
      position: 'CO', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `CO 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL_60),
    },
    {
      position: 'CO', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `CO 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(CO_3BET_VS_MP_3BET, CO_3BET_VS_MP_CALL_60),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `BTN 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL_60),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `BTN 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_MP_3BET, BTN_3BET_VS_MP_CALL_60),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'CO', category: '3bet vs Opener',
      description: `BTN 3bet vs CO open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL_60),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `SB 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL_60),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `SB 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_MP_3BET, SB_3BET_VS_MP_CALL_60),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'CO', category: '3bet vs Opener',
      description: `SB 3bet vs CO open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL_60),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'BTN', category: '3bet vs Opener',
      description: `SB 3bet vs BTN open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL_60),
    },
  ];
}

function charts40bb(depth: StackDepth): ChartDef[] {
  return [
    {
      position: 'MP', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `MP 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(MP_3BET_VS_UTG_3BET, MP_3BET_VS_UTG_CALL_40),
    },
    {
      position: 'CO', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `CO 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL_40),
    },
    {
      position: 'CO', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `CO 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(CO_3BET_VS_MP_3BET, CO_3BET_VS_MP_CALL_40),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `BTN 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL_40),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `BTN 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_MP_3BET, BTN_3BET_VS_MP_CALL_40),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'CO', category: '3bet vs Opener',
      description: `BTN 3bet vs CO open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL_40),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `SB 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL_40),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `SB 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_MP_3BET, SB_3BET_VS_MP_CALL_40),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'CO', category: '3bet vs Opener',
      description: `SB 3bet vs CO open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL_40),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'BTN', category: '3bet vs Opener',
      description: `SB 3bet vs BTN open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL_40),
    },
  ];
}

function charts25bb(depth: StackDepth): ChartDef[] {
  return [
    // BTN 3bet (jam or fold) vs openers
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `BTN 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_FOLD_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_UTG_3BET_25, EMPTY_CALL),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `BTN 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_FOLD_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_MP_3BET_25, EMPTY_CALL),
    },
    {
      position: 'BTN', situation: '3bet vs Opener', vsPosition: 'CO', category: '3bet vs Opener',
      description: `BTN 3bet vs CO open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_FOLD_ACTIONS,
      ranges: threeBetRange(BTN_3BET_VS_CO_3BET_25, EMPTY_CALL),
    },
    // SB 3bet (jam or fold) vs openers
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'UTG', category: '3bet vs Opener',
      description: `SB 3bet vs UTG open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_FOLD_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_UTG_3BET_25, EMPTY_CALL),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'MP', category: '3bet vs Opener',
      description: `SB 3bet vs MP open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_FOLD_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_MP_3BET_25, EMPTY_CALL),
    },
    {
      position: 'SB', situation: '3bet vs Opener', vsPosition: 'BTN', category: '3bet vs Opener',
      description: `SB 3bet vs BTN open (${depth}bb)`,
      stackDepth: depth,
      actionTypes: THREE_BET_FOLD_ACTIONS,
      ranges: threeBetRange(SB_3BET_VS_BTN_3BET_25, EMPTY_CALL),
    },
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getThreeBetCharts(depth: StackDepth): ChartDef[] {
  switch (depth) {
    case 15:  return [];
    case 25:  return charts25bb(depth);
    case 40:  return charts40bb(depth);
    case 60:  return charts60bb(depth);
    case 100: return charts100bb(depth);
  }
}

// Backward compatibility
export const THREE_BET_CHARTS = getThreeBetCharts(100);
