import {
  ChartDef, StackDepth, MaxPlayers,
  handLabel, inSet,
  positionsForPlayerCount, rfiPositions,
} from './helpers';
import { PUSH_FOLD_ACTIONS, CALL_SHOVE_ACTIONS } from './actionColors';

// ═══════════════════════════════════════════════════════════════════════
//  7bb Push/Fold ranges — wider than 15bb (desperate shove zone)
// ═══════════════════════════════════════════════════════════════════════

// UTG 7bb (~20%)
const UTG_7BB_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'KQs', 'KJs', 'QJs',
  'AKo', 'AQo', 'AJo', 'ATo',
]);

// UTG 9-max 7bb (~17%)
const UTG_9MAX_7BB_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs',
  'AKo', 'AQo', 'AJo',
]);

// UTG+1 7bb (~18%)
const UTG1_7BB_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs',
  'AKo', 'AQo', 'AJo', 'ATo',
]);

// UTG+2 7bb (~19%)
const UTG2_7BB_PUSH = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'KQs', 'KJs', 'QJs',
  'AKo', 'AQo', 'AJo', 'ATo',
]);

// MP 7bb — same as 6-max UTG 7bb
const MP_7BB_PUSH = UTG_7BB_PUSH;

// HJ 7bb (~28%)
const HJ_7BB_PUSH = new Set([
  ...UTG_7BB_PUSH,
  '55',
  'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KTs', 'K9s', 'QTs', 'JTs', 'T9s', '98s',
  'KQo', 'KJo',
]);

// CO 7bb (~38%)
const CO_7BB_PUSH = new Set([
  ...HJ_7BB_PUSH,
  '44', '33',
  'K8s', 'K7s', 'K6s', 'K5s',
  'Q9s', 'J9s', '87s', '76s', '65s',
  'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KTo', 'QJo', 'QTo', 'JTo',
]);

// BTN 7bb (~55%)
const BTN_7BB_PUSH = new Set([
  ...CO_7BB_PUSH,
  '22',
  'K4s', 'K3s', 'K2s',
  'Q8s', 'Q7s', 'Q6s', 'Q5s',
  'J8s', 'J7s', 'T8s', '97s', '86s', '85s', '75s', '64s', '54s', '53s',
  'A4o', 'A3o', 'A2o',
  'K9o', 'K8o', 'Q9o', 'Q8o', 'J9o', 'T9o',
]);

// SB 7bb (~65%)
const SB_7BB_PUSH = new Set([
  ...BTN_7BB_PUSH,
  'Q4s', 'Q3s', 'Q2s',
  'J6s', 'J5s', 'J4s',
  'T7s', 'T6s', 'T5s',
  '96s', '95s',
  '84s', '83s',
  '74s', '73s',
  '63s', '62s',
  '52s', '43s',
  'K7o', 'K6o', 'K5o',
  'Q7o', 'Q6o',
  'J8o', 'T8o', '98o', '87o',
]);

// HU SB 7bb (~85%) — shove almost everything
const HU_SB_7BB_PUSH = new Set([
  ...SB_7BB_PUSH,
  'J3s', 'J2s',
  'T4s', 'T3s', 'T2s',
  '94s', '93s', '92s',
  '82s',
  '72s',
  '42s', '32s',
  'K4o', 'K3o', 'K2o',
  'Q5o', 'Q4o', 'Q3o',
  'J7o', 'J6o', 'J5o',
  'T7o', 'T6o',
  '97o', '96o',
  '86o', '85o',
  '76o', '75o',
  '65o', '64o',
  '54o', '53o', '43o',
]);

// ── 7bb BB call ranges (wider than 15bb due to better pot odds) ──

const BB_7BB_CALL_VS_EP = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs',
  'AKo', 'AQo', 'AJo',
]);

const BB_7BB_CALL_VS_HJ = new Set([
  ...BB_7BB_CALL_VS_EP,
  '77',
  'A9s', 'KJs', 'KTs', 'QJs',
  'ATo', 'KQo',
]);

const BB_7BB_CALL_VS_CO = new Set([
  ...BB_7BB_CALL_VS_HJ,
  '66', '55',
  'A8s', 'A7s', 'A5s', 'A4s', 'K9s', 'QTs', 'JTs', 'T9s',
  'A9o', 'A8o', 'KJo', 'KTo',
]);

const BB_7BB_CALL_VS_BTN = new Set([
  ...BB_7BB_CALL_VS_CO,
  '44', '33',
  'A6s', 'A3s', 'A2s', 'K8s', 'K7s', 'Q9s', 'J9s', '98s', '87s',
  'A7o', 'A6o', 'A5o', 'QJo', 'QTo',
]);

const BB_7BB_CALL_VS_SB = new Set([
  ...BB_7BB_CALL_VS_BTN,
  '22',
  'K6s', 'K5s', 'K4s', 'Q8s', 'J8s', 'T8s', '97s', '76s', '65s',
  'A4o', 'A3o', 'A2o', 'K9o', 'K8o', 'JTo', 'J9o', 'T9o',
]);

// ═══════════════════════════════════════════════════════════════════════
//  15bb Push/Fold ranges (all-in or fold)
// ═══════════════════════════════════════════════════════════════════════

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
  'A9s', 'KJs', 'KTs', 'QJs', 'QTs',
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

// ── Push range lookup by position and depth ──

function getPushRange(position: string, maxPlayers: MaxPlayers, depth: 7 | 15): Set<string> {
  if (depth === 7) return getPushRange7bb(position, maxPlayers);
  return getPushRange15bb(position, maxPlayers);
}

function getPushRange7bb(position: string, maxPlayers: MaxPlayers): Set<string> {
  switch (position) {
    case 'UTG':
      return maxPlayers >= 7 ? UTG_9MAX_7BB_PUSH : UTG_7BB_PUSH;
    case 'UTG+1': return UTG1_7BB_PUSH;
    case 'UTG+2': return UTG2_7BB_PUSH;
    case 'MP':    return MP_7BB_PUSH;
    case 'HJ':   return HJ_7BB_PUSH;
    case 'CO':   return CO_7BB_PUSH;
    case 'BTN':  return BTN_7BB_PUSH;
    case 'SB':   return maxPlayers === 2 ? HU_SB_7BB_PUSH : SB_7BB_PUSH;
    case 'BB':   return SB_7BB_PUSH;
    default:     return UTG_7BB_PUSH;
  }
}

function getPushRange15bb(position: string, maxPlayers: MaxPlayers): Set<string> {
  switch (position) {
    case 'UTG':
      return maxPlayers >= 7 ? UTG_FULL_PUSH : UTG_6MAX_PUSH;
    case 'UTG+1': return UTG1_PUSH;
    case 'UTG+2': return UTG2_PUSH;
    case 'MP':    return MP_PUSH;
    case 'HJ':   return HJ_PUSH;
    case 'CO':   return CO_PUSH;
    case 'BTN':  return BTN_PUSH;
    case 'SB':   return maxPlayers === 2 ? HU_SB_PUSH : SB_PUSH;
    case 'BB':   return SB_PUSH;
    default:     return UTG_6MAX_PUSH;
  }
}

// ── BB call range lookup by shover class and depth ──

function getBbCallRange(shoverPosition: string, depth: 7 | 15): Set<string> {
  if (depth === 7) return getBbCallRange7bb(shoverPosition);
  return getBbCallRange15bb(shoverPosition);
}

function getBbCallRange7bb(shoverPosition: string): Set<string> {
  switch (shoverPosition) {
    case 'SB':  return BB_7BB_CALL_VS_SB;
    case 'BTN': return BB_7BB_CALL_VS_BTN;
    case 'CO':  return BB_7BB_CALL_VS_CO;
    case 'HJ':  return BB_7BB_CALL_VS_HJ;
    default:    return BB_7BB_CALL_VS_EP;
  }
}

function getBbCallRange15bb(shoverPosition: string): Set<string> {
  switch (shoverPosition) {
    case 'SB':  return BB_CALL_VS_SB;
    case 'BTN': return BB_CALL_VS_BTN;
    case 'CO':  return BB_CALL_VS_CO;
    case 'HJ':  return BB_CALL_VS_HJ;
    default:    return BB_CALL_VS_EP;
  }
}

// ── Public API ──

export function getShortStackCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth !== 7 && depth !== 15) return [];

  const pushDepth = depth as 7 | 15;
  const positions = positionsForPlayerCount(maxPlayers);
  const rfiPos = rfiPositions(maxPlayers);
  const charts: ChartDef[] = [];

  // Push/Fold charts for every position
  for (const pos of positions) {
    const pushRange = getPushRange(pos, maxPlayers, pushDepth);
    charts.push({
      position: pos,
      situation: 'Push/Fold',
      category: 'Push/Fold',
      description: `${pos} Push or Fold (${depth}bb)`,
      stackDepth: depth,
      maxPlayers,
      actionTypes: PUSH_FOLD_ACTIONS,
      ranges: pushFoldRange(pushRange),
    });
  }

  // BB Call vs Shove charts
  if (positions.includes('BB')) {
    const shovers = rfiPos;
    for (const shover of shovers) {
      const callRange = getBbCallRange(shover, pushDepth);
      charts.push({
        position: 'BB',
        situation: 'Call vs Shove',
        vsPosition: shover,
        category: 'Call vs Shove',
        description: `BB Call vs ${shover} Shove (${depth}bb)`,
        stackDepth: depth,
        maxPlayers,
        actionTypes: CALL_SHOVE_ACTIONS,
        ranges: callShoveRange(callRange),
      });
    }
  }

  return charts;
}
