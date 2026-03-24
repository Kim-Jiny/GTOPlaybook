import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, rfiPositions,
} from './helpers';
import { PUSH_FOLD_ACTIONS, CALL_SHOVE_ACTIONS } from './actionColors';

// ── 15bb Push/Fold ranges (all-in or fold) ──

// UTG push range at 6-max — tight (~12%)
const UTG_6MAX_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs',
  'AKo', 'AQo',
]);

// UTG at 7+ players — tighter (~10%)
const UTG_FULL_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs', 'AJs',
  'AKo', 'AQo',
]);

// UTG+1 at 8+ — similar to 6-max UTG (~11%)
const UTG1_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs',
  'AKo', 'AQo',
]);

// UTG+2 at 9 — slightly wider (~12%)
const UTG2_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs',
  'AKo', 'AQo',
]);

// MP at 7+ players — same as 6-max UTG
const MP_PUSH = UTG_6MAX_PUSH;

// HJ push range (~16%) — was MP in 6-max
const HJ_PUSH = new Set([
  ...UTG_6MAX_PUSH,
  '88', '77',
  'A9s', 'KJs', 'KTs', 'QJs',
  'AJo',
]);

// CO push range (~25%)
const CO_PUSH = new Set([
  ...HJ_PUSH,
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

// HU SB push range (~65%) — very wide
const HU_SB_PUSH = new Set([
  ...SB_PUSH,
  'Q4s', 'Q3s', 'Q2s',
  'J6s', 'J5s', 'J4s',
  'T6s', 'T5s',
  '95s', '94s',
  '84s', '83s',
  '74s', '73s',
  '63s', '62s',
  '52s', '43s', '42s', '32s',
  'K7o', 'K6o', 'K5o',
  'Q7o', 'Q6o', 'Q5o',
  'J8o', 'J7o',
  'T8o', 'T7o',
  '98o', '97o',
  '87o', '86o',
  '76o', '75o',
  '65o', '64o',
  '54o', '53o',
]);

// ── BB call vs all-in ranges (based on shover position class) ──

// BB call vs ep-tight (UTG, UTG+1, UTG+2, MP at 7+)
const BB_CALL_VS_EP = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs', 'AKo',
]);

// BB call vs HJ shove (was BB vs MP in 6-max)
const BB_CALL_VS_HJ = new Set([
  ...BB_CALL_VS_EP,
  '99', 'AJs', 'AQo',
]);

// BB call vs CO shove
const BB_CALL_VS_CO = new Set([
  ...BB_CALL_VS_HJ,
  '88', '77',
  'ATs', 'A9s', 'KQs',
  'AJo', 'ATo', 'KQo',
]);

// BB call vs BTN shove
const BB_CALL_VS_BTN = new Set([
  ...BB_CALL_VS_CO,
  '66', '55',
  'A8s', 'A7s', 'A5s', 'KJs', 'KTs', 'QJs',
  'A9o', 'A8o', 'KJo',
]);

// BB call vs SB shove (widest)
const BB_CALL_VS_SB = new Set([
  ...BB_CALL_VS_BTN,
  '44', '33',
  'A6s', 'A4s', 'A3s', 'A2s', 'K9s', 'K8s', 'Q9s', 'QTs', 'JTs', 'T9s',
  'A7o', 'A6o', 'A5o', 'KTo', 'QJo',
]);

// ── Range builders ──

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

// ── Push range lookup by position ──

function getPushRange(position: string, maxPlayers: MaxPlayers): Set<string> {
  switch (position) {
    case 'UTG':
      return maxPlayers >= 7 ? UTG_FULL_PUSH : UTG_6MAX_PUSH;
    case 'UTG+1':
      return UTG1_PUSH;
    case 'UTG+2':
      return UTG2_PUSH;
    case 'MP':
      return MP_PUSH;      // MP only exists at 7+, same as 6-max UTG
    case 'HJ':
      return HJ_PUSH;
    case 'CO':
      return CO_PUSH;
    case 'BTN':
      return BTN_PUSH;
    case 'SB':
      return maxPlayers === 2 ? HU_SB_PUSH : SB_PUSH;
    case 'BB':
      return SB_PUSH;      // BB push range similar to SB when folded to
    default:
      return UTG_6MAX_PUSH;
  }
}

// ── BB call range lookup by shover class ──

function getBbCallRange(shoverPosition: string): Set<string> {
  switch (shoverPosition) {
    case 'SB':
      return BB_CALL_VS_SB;
    case 'BTN':
      return BB_CALL_VS_BTN;
    case 'CO':
      return BB_CALL_VS_CO;
    case 'HJ':
      return BB_CALL_VS_HJ;
    // ep-tight: UTG, UTG+1, UTG+2, MP
    default:
      return BB_CALL_VS_EP;
  }
}

// ── Public API ──

export function getShortStackCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth !== 15) return [];

  const positions = positionsForPlayerCount(maxPlayers);
  const rfiPos = rfiPositions(maxPlayers);
  const charts: ChartDef[] = [];

  // Push/Fold charts for every position
  for (const pos of positions) {
    const pushRange = getPushRange(pos, maxPlayers);
    charts.push({
      position: pos,
      situation: 'Push/Fold',
      category: 'Push/Fold',
      description: `${pos} Push or Fold (15bb)`,
      stackDepth: 15,
      maxPlayers,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(pushRange),
    });
  }

  // BB Call vs Shove charts — one for each non-BB position that can shove
  // (BB only calls vs shoves from other positions, not itself)
  if (positions.includes('BB')) {
    const shovers = rfiPos; // everyone except BB
    for (const shover of shovers) {
      const callRange = getBbCallRange(shover);
      charts.push({
        position: 'BB',
        situation: 'Call vs Shove',
        vsPosition: shover,
        category: 'Call vs Shove',
        description: `BB Call vs ${shover} Shove (15bb)`,
        stackDepth: 15,
        maxPlayers,
        actionTypes: CALL_SHOVE_ACTIONS,
        ranges: callShoveRange(callRange),
      });
    }
  }

  return charts;
}
