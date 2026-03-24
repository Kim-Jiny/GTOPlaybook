import { ChartDef, StackDepth, handLabel, inSet } from './helpers';
import { PUSH_FOLD_ACTIONS, CALL_SHOVE_ACTIONS } from './actionColors';

// ── 15bb Push/Fold ranges (all-in or fold) ──

// UTG push range — very tight (~12%)
const UTG_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs',
  'AKo', 'AQo',
]);

// MP push range (~16%)
const MP_PUSH = new Set([
  ...UTG_PUSH,
  '88', '77',
  'A9s', 'KJs', 'KTs', 'QJs',
  'AJo',
]);

// CO push range (~25%)
const CO_PUSH = new Set([
  ...MP_PUSH,
  '66', '55',
  'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'K9s', 'Q9s', 'JTs', 'T9s', '98s',
  'ATo', 'KQo', 'KJo',
]);

// BTN push range (~40%)
const BTN_PUSH = new Set([
  ...CO_PUSH,
  '44', '33', '22',
  'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
  'Q8s', 'J9s', 'J8s', 'T8s', '97s', '87s', '86s', '76s', '65s', '54s',
  'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KTo', 'QJo', 'QTo', 'JTo',
]);

// SB push range (~50%)
const SB_PUSH = new Set([
  ...BTN_PUSH,
  'Q7s', 'Q6s', 'Q5s',
  'J7s', 'T7s', '96s', '85s', '75s', '64s', '53s',
  'A4o', 'A3o', 'A2o',
  'K9o', 'K8o', 'Q9o', 'Q8o', 'J9o', 'T9o',
]);

// BB call vs all-in ranges (based on shover position)
const BB_CALL_VS_UTG = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs', 'AKo',
]);

const BB_CALL_VS_MP = new Set([
  ...BB_CALL_VS_UTG,
  '99', 'AJs', 'AQo',
]);

const BB_CALL_VS_CO = new Set([
  ...BB_CALL_VS_MP,
  '88', '77',
  'ATs', 'A9s', 'KQs',
  'AJo', 'ATo', 'KQo',
]);

const BB_CALL_VS_BTN = new Set([
  ...BB_CALL_VS_CO,
  '66', '55',
  'A8s', 'A7s', 'A5s', 'KJs', 'KTs', 'QJs',
  'A9o', 'A8o', 'KJo',
]);

const BB_CALL_VS_SB = new Set([
  ...BB_CALL_VS_BTN,
  '44', '33',
  'A6s', 'A4s', 'A3s', 'A2s', 'K9s', 'K8s', 'Q9s', 'QTs', 'JTs', 'T9s',
  'A7o', 'A6o', 'A5o', 'KTo', 'QJo',
]);

function pushFoldRange(pushSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, pushSet)) return { allin: 1.0, fold: 0 };
    return { allin: 0, fold: 1.0 };
  };
}

function callShoveRange(callSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, callSet)) return { call: 1.0, fold: 0 };
    return { call: 0, fold: 1.0 };
  };
}

export function getShortStackCharts(depth: StackDepth): ChartDef[] {
  if (depth !== 15) return [];

  return [
    // Push/Fold RFI (6 charts)
    {
      position: 'UTG', situation: 'Push/Fold', category: 'Push/Fold',
      description: 'UTG Push or Fold (15bb)',
      stackDepth: 15,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(UTG_PUSH),
    },
    {
      position: 'MP', situation: 'Push/Fold', category: 'Push/Fold',
      description: 'MP Push or Fold (15bb)',
      stackDepth: 15,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(MP_PUSH),
    },
    {
      position: 'CO', situation: 'Push/Fold', category: 'Push/Fold',
      description: 'CO Push or Fold (15bb)',
      stackDepth: 15,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(CO_PUSH),
    },
    {
      position: 'BTN', situation: 'Push/Fold', category: 'Push/Fold',
      description: 'BTN Push or Fold (15bb)',
      stackDepth: 15,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(BTN_PUSH),
    },
    {
      position: 'SB', situation: 'Push/Fold', category: 'Push/Fold',
      description: 'SB Push or Fold (15bb)',
      stackDepth: 15,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(SB_PUSH),
    },
    {
      position: 'BB', situation: 'Push/Fold', category: 'Push/Fold',
      description: 'BB Push or Fold (15bb)',
      stackDepth: 15,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(SB_PUSH), // BB push range similar to SB when folded to
    },

    // BB Call vs Shove (5 charts)
    {
      position: 'BB', situation: 'Call vs Shove', vsPosition: 'UTG', category: 'Call vs Shove',
      description: 'BB Call vs UTG Shove (15bb)',
      stackDepth: 15,
      actionTypes: CALL_SHOVE_ACTIONS,
      ranges: callShoveRange(BB_CALL_VS_UTG),
    },
    {
      position: 'BB', situation: 'Call vs Shove', vsPosition: 'MP', category: 'Call vs Shove',
      description: 'BB Call vs MP Shove (15bb)',
      stackDepth: 15,
      actionTypes: CALL_SHOVE_ACTIONS,
      ranges: callShoveRange(BB_CALL_VS_MP),
    },
    {
      position: 'BB', situation: 'Call vs Shove', vsPosition: 'CO', category: 'Call vs Shove',
      description: 'BB Call vs CO Shove (15bb)',
      stackDepth: 15,
      actionTypes: CALL_SHOVE_ACTIONS,
      ranges: callShoveRange(BB_CALL_VS_CO),
    },
    {
      position: 'BB', situation: 'Call vs Shove', vsPosition: 'BTN', category: 'Call vs Shove',
      description: 'BB Call vs BTN Shove (15bb)',
      stackDepth: 15,
      actionTypes: CALL_SHOVE_ACTIONS,
      ranges: callShoveRange(BB_CALL_VS_BTN),
    },
    {
      position: 'BB', situation: 'Call vs Shove', vsPosition: 'SB', category: 'Call vs Shove',
      description: 'BB Call vs SB Shove (15bb)',
      stackDepth: 15,
      actionTypes: CALL_SHOVE_ACTIONS,
      ranges: callShoveRange(BB_CALL_VS_SB),
    },
  ];
}
