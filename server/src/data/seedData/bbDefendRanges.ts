import { ChartDef, handLabel, inSet, MaxPlayers, positionsForPlayerCount, openerClass, StackDepth } from './helpers';
import { BB_DEFEND_ACTIONS, BB_DEFEND_JAM_ACTIONS } from './actionColors';

// BB Defend ranges vs each position's open

// ---------------------------------------------------------------------------
// 100bb ranges (original)
// ---------------------------------------------------------------------------

// BB vs UTG — very tight defend
const BB_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_UTG_CALL = new Set([
  'JJ', 'TT', '99', '88',
  'AKo', 'AQs', 'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '98s',
]);

// BB vs HJ — slightly wider
const BB_VS_HJ_3BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BB_VS_HJ_CALL = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AQs', 'AQo', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s',
]);

// BB vs CO — moderate
const BB_VS_CO_3BET = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const BB_VS_CO_CALL = new Set([
  'TT', '99', '88', '77', '66', '55',
  'AQo', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s',
  'KQs', 'KJs', 'KTs', 'K9s',
  'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '65s',
  'KQo', 'KJo', 'QJo',
]);

// BB vs BTN — widest defend
const BB_VS_BTN_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo',
  'A5s', 'A4s',
]);
const BB_VS_BTN_CALL = new Set([
  '99', '88', '77', '66', '55', '44', '33', '22',
  'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s',
  'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s', '43s',
  'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', 'T8o', '98o', '87o', '76o',
]);

// BB vs SB — wide defend (SB has wide range)
const BB_VS_SB_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s',
  'K9s', 'Q9s',
]);
const BB_VS_SB_CALL = new Set([
  '88', '77', '66', '55', '44', '33', '22',
  'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
  'QJs', 'QTs', 'Q8s', 'Q7s',
  'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s', '43s',
  'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o',
  'QJo', 'QTo', 'Q9o', 'Q8o',
  'JTo', 'J9o', 'J8o', 'T9o', 'T8o', '98o', '97o', '87o', '76o', '65o',
]);

// ---------------------------------------------------------------------------
// 15bb ranges — mostly reshove-or-fold, very small call range
// ---------------------------------------------------------------------------

const BB_VS_UTG_3BET_15 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_UTG_CALL_15 = new Set(['JJ', 'TT', 'AKo', 'AQs']);
const BB_VS_UTG_JAM_15 = new Set(['JJ', 'TT', 'AKo', 'AQs']);

const BB_VS_HJ_3BET_15 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BB_VS_HJ_CALL_15 = new Set(['JJ', 'TT', 'AQs']);
const BB_VS_HJ_JAM_15 = new Set(['JJ', 'TT', 'AQs', 'AQo']);

const BB_VS_CO_3BET_15 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);
const BB_VS_CO_CALL_15 = new Set(['TT', '99', 'AQs', 'AQo', 'KQs']);
const BB_VS_CO_JAM_15 = new Set(['TT', '99', 'AQs', 'AQo', 'AJs', 'KQs']);

const BB_VS_BTN_3BET_15 = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs']);
const BB_VS_BTN_CALL_15 = new Set(['99', '88', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs']);
const BB_VS_BTN_JAM_15 = new Set(['99', '88', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs']);

const BB_VS_SB_3BET_15 = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo']);
const BB_VS_SB_CALL_15 = new Set(['88', '77', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs']);
const BB_VS_SB_JAM_15 = new Set(['88', '77', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs']);

// ---------------------------------------------------------------------------
// 25bb ranges — much tighter, premiums only
// ---------------------------------------------------------------------------

const BB_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_UTG_CALL_25 = new Set([
  'JJ', 'TT',
  'AKo', 'AQs',
  'KQs',
]);

const BB_VS_HJ_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_HJ_CALL_25 = new Set([
  'JJ', 'TT', '99',
  'AKo', 'AQs', 'AQo', 'AJs',
  'KQs', 'KJs',
]);

const BB_VS_CO_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_CO_CALL_25 = new Set([
  'JJ', 'TT', '99', '88',
  'AKo', 'AQs', 'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'KTs',
  'QJs', 'JTs',
]);

const BB_VS_BTN_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_BTN_CALL_25 = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'K9s',
  'QJs', 'QTs', 'JTs', 'T9s', '98s',
  'KQo', 'AJo',
]);

const BB_VS_SB_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_SB_CALL_25 = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'K9s',
  'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s',
  'KQo', 'KJo', 'AJo', 'ATo',
]);

// 25bb jam sets — hands that 3bet-jam (all-in) instead of standard 3bet
const BB_VS_UTG_JAM_25 = new Set(['JJ', 'TT', 'AKo', 'AQs']);
const BB_VS_HJ_JAM_25 = new Set(['JJ', 'TT', '99', 'AKo', 'AQs', 'AQo']);
const BB_VS_CO_JAM_25 = new Set(['JJ', 'TT', '99', 'AKo', 'AQs', 'AQo', 'AJs']);
const BB_VS_BTN_JAM_25 = new Set(['JJ', 'TT', '99', '88', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs']);
const BB_VS_SB_JAM_25 = new Set(['JJ', 'TT', '99', '88', '77', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs']);

// ---------------------------------------------------------------------------
// 40bb ranges — tighter than 100bb, call sets reduced ~20%
// ---------------------------------------------------------------------------

const BB_VS_UTG_3BET_40 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_UTG_CALL_40 = new Set([
  'JJ', 'TT', '99',
  'AKo', 'AQs', 'AQo', 'AJs',
  'KQs', 'KJs', 'QJs', 'JTs',
]);

const BB_VS_HJ_3BET_40 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BB_VS_HJ_CALL_40 = new Set([
  'JJ', 'TT', '99', '88',
  'AQs', 'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s',
]);

const BB_VS_CO_3BET_40 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const BB_VS_CO_CALL_40 = new Set([
  'TT', '99', '88', '77', '66',
  'AQo', 'AJs', 'ATs', 'A9s', 'A8s',
  'KQs', 'KJs', 'KTs',
  'QJs', 'QTs', 'JTs', 'J9s', 'T9s', '98s', '87s', '76s', '65s',
  'KQo',
]);

const BB_VS_BTN_3BET_40 = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo',
  'A5s', 'A4s',
]);
const BB_VS_BTN_CALL_40 = new Set([
  '99', '88', '77', '66', '55', '44',
  'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '65s', '54s',
  'AJo', 'ATo', 'A9o',
  'KQo', 'KJo', 'KTo',
  'QJo', 'QTo', 'JTo', 'T9o',
]);

const BB_VS_SB_3BET_40 = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s',
  'K9s', 'Q9s',
]);
const BB_VS_SB_CALL_40 = new Set([
  '88', '77', '66', '55', '44',
  'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
  'KQs', 'KJs', 'KTs', 'K8s', 'K7s',
  'QJs', 'QTs', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '65s', '54s',
  'AJo', 'ATo', 'A9o', 'A8o',
  'KQo', 'KJo', 'KTo', 'K9o',
  'QJo', 'QTo', 'Q9o',
  'JTo', 'J9o', 'T9o', 'T8o', '98o', '87o',
]);

// ---------------------------------------------------------------------------
// 60bb ranges — slightly tighter than 100bb, call sets reduced ~10%
// ---------------------------------------------------------------------------

const BB_VS_UTG_3BET_60 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BB_VS_UTG_CALL_60 = new Set([
  'JJ', 'TT', '99', '88',
  'AKo', 'AQs', 'AQo', 'AJs',
  'KQs', 'KJs', 'QJs', 'JTs', 'T9s',
]);

const BB_VS_HJ_3BET_60 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BB_VS_HJ_CALL_60 = new Set([
  'JJ', 'TT', '99', '88', '77',
  'AQs', 'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
]);

const BB_VS_CO_3BET_60 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const BB_VS_CO_CALL_60 = new Set([
  'TT', '99', '88', '77', '66', '55',
  'AQo', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s',
  'KQs', 'KJs', 'KTs', 'K9s',
  'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s',
  'KQo', 'KJo',
]);

const BB_VS_BTN_3BET_60 = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo',
  'A5s', 'A4s',
]);
const BB_VS_BTN_CALL_60 = new Set([
  '99', '88', '77', '66', '55', '44', '33',
  'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A3s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
  'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s',
  'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KQo', 'KJo', 'KTo', 'K9o',
  'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', 'T8o', '98o', '87o',
]);

const BB_VS_SB_3BET_60 = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s',
  'K9s', 'Q9s',
]);
const BB_VS_SB_CALL_60 = new Set([
  '88', '77', '66', '55', '44', '33',
  'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K8s', 'K7s', 'K6s', 'K5s',
  'QJs', 'QTs', 'Q8s', 'Q7s',
  'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s',
  'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJo', 'QTo', 'Q9o',
  'JTo', 'J9o', 'T9o', 'T8o', '98o', '97o', '87o', '76o',
]);

// ---------------------------------------------------------------------------
// Mixed frequency hands at 3bet/call boundary (used at 100bb/60bb)
// ---------------------------------------------------------------------------
const BB_MIXED: Record<string, { '3bet': number; call: number; fold: number }> = {
  'JJ': { '3bet': 0.55, call: 0.45, fold: 0 },
  'TT': { '3bet': 0.35, call: 0.65, fold: 0 },
  'AQo': { '3bet': 0.4, call: 0.6, fold: 0 },
  'AJs': { '3bet': 0.3, call: 0.7, fold: 0 },
  'A5s': { '3bet': 0.6, call: 0.2, fold: 0.2 },
  'A4s': { '3bet': 0.55, call: 0.2, fold: 0.25 },
  'K9s': { '3bet': 0.25, call: 0.55, fold: 0.2 },
};

// Mixed frequencies for 40bb — reduced
const BB_MIXED_40: Record<string, { '3bet': number; call: number; fold: number }> = {
  'JJ': { '3bet': 0.6, call: 0.4, fold: 0 },
  'AQo': { '3bet': 0.5, call: 0.5, fold: 0 },
};

// ---------------------------------------------------------------------------
// Range builder helpers
// ---------------------------------------------------------------------------

function bbDefendRange(threeBetSet: Set<string>, callSet: Set<string>, useMixed: false | Record<string, { '3bet': number; call: number; fold: number }> = false) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, call: 0, fold: 0 };
    if (useMixed && h in useMixed) return useMixed[h];
    if (inSet(h, callSet)) return { '3bet': 0, call: 1.0, fold: 0 };
    return { '3bet': 0, call: 0, fold: 1.0 };
  };
}

function bbDefendJamRange(threeBetSet: Set<string>, jamSet: Set<string>, callSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, allin: 0, call: 0, fold: 0 };
    if (inSet(h, jamSet)) return { '3bet': 0, allin: 1.0, call: 0, fold: 0 };
    if (inSet(h, callSet)) return { '3bet': 0, allin: 0, call: 1.0, fold: 0 };
    return { '3bet': 0, allin: 0, call: 0, fold: 1.0 };
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

function getRangeData100(cls: 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb'): RangeData100 {
  switch (cls) {
    case 'ep-tight': return { threeBet: BB_VS_UTG_3BET, call: BB_VS_UTG_CALL, mixed: false };
    case 'hj':       return { threeBet: BB_VS_HJ_3BET,  call: BB_VS_HJ_CALL,  mixed: false };
    case 'co':       return { threeBet: BB_VS_CO_3BET,   call: BB_VS_CO_CALL,   mixed: BB_MIXED };
    case 'btn':      return { threeBet: BB_VS_BTN_3BET,  call: BB_VS_BTN_CALL,  mixed: BB_MIXED };
    case 'sb':       return { threeBet: BB_VS_SB_3BET,   call: BB_VS_SB_CALL,   mixed: BB_MIXED };
  }
}

function getRangeData60(cls: 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb'): RangeData100 {
  switch (cls) {
    case 'ep-tight': return { threeBet: BB_VS_UTG_3BET_60, call: BB_VS_UTG_CALL_60, mixed: false };
    case 'hj':       return { threeBet: BB_VS_HJ_3BET_60,  call: BB_VS_HJ_CALL_60,  mixed: false };
    case 'co':       return { threeBet: BB_VS_CO_3BET_60,   call: BB_VS_CO_CALL_60,   mixed: BB_MIXED };
    case 'btn':      return { threeBet: BB_VS_BTN_3BET_60,  call: BB_VS_BTN_CALL_60,  mixed: BB_MIXED };
    case 'sb':       return { threeBet: BB_VS_SB_3BET_60,   call: BB_VS_SB_CALL_60,   mixed: BB_MIXED };
  }
}

function getRangeData40(cls: 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb'): RangeData100 {
  switch (cls) {
    case 'ep-tight': return { threeBet: BB_VS_UTG_3BET_40, call: BB_VS_UTG_CALL_40, mixed: false };
    case 'hj':       return { threeBet: BB_VS_HJ_3BET_40,  call: BB_VS_HJ_CALL_40,  mixed: false };
    case 'co':       return { threeBet: BB_VS_CO_3BET_40,   call: BB_VS_CO_CALL_40,   mixed: BB_MIXED_40 };
    case 'btn':      return { threeBet: BB_VS_BTN_3BET_40,  call: BB_VS_BTN_CALL_40,  mixed: BB_MIXED_40 };
    case 'sb':       return { threeBet: BB_VS_SB_3BET_40,   call: BB_VS_SB_CALL_40,   mixed: BB_MIXED_40 };
  }
}

function getRangeData15(cls: 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb'): RangeData25 {
  switch (cls) {
    case 'ep-tight': return { threeBet: BB_VS_UTG_3BET_15, jam: BB_VS_UTG_JAM_15, call: BB_VS_UTG_CALL_15 };
    case 'hj':       return { threeBet: BB_VS_HJ_3BET_15,  jam: BB_VS_HJ_JAM_15,  call: BB_VS_HJ_CALL_15 };
    case 'co':       return { threeBet: BB_VS_CO_3BET_15,   jam: BB_VS_CO_JAM_15,   call: BB_VS_CO_CALL_15 };
    case 'btn':      return { threeBet: BB_VS_BTN_3BET_15,  jam: BB_VS_BTN_JAM_15,  call: BB_VS_BTN_CALL_15 };
    case 'sb':       return { threeBet: BB_VS_SB_3BET_15,   jam: BB_VS_SB_JAM_15,   call: BB_VS_SB_CALL_15 };
  }
}

function getRangeData25(cls: 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb'): RangeData25 {
  switch (cls) {
    case 'ep-tight': return { threeBet: BB_VS_UTG_3BET_25, jam: BB_VS_UTG_JAM_25, call: BB_VS_UTG_CALL_25 };
    case 'hj':       return { threeBet: BB_VS_HJ_3BET_25,  jam: BB_VS_HJ_JAM_25,  call: BB_VS_HJ_CALL_25 };
    case 'co':       return { threeBet: BB_VS_CO_3BET_25,   jam: BB_VS_CO_JAM_25,   call: BB_VS_CO_CALL_25 };
    case 'btn':      return { threeBet: BB_VS_BTN_3BET_25,  jam: BB_VS_BTN_JAM_25,  call: BB_VS_BTN_CALL_25 };
    case 'sb':       return { threeBet: BB_VS_SB_3BET_25,   jam: BB_VS_SB_JAM_25,   call: BB_VS_SB_CALL_25 };
  }
}

// ---------------------------------------------------------------------------
// Chart builder per stack depth — multi-table aware
// ---------------------------------------------------------------------------

export function getBbDefendCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth === 7) return []; // 7bb is pure push/fold

  // BB can face opens from every position except BB itself
  const allPositions = positionsForPlayerCount(maxPlayers);
  const openers = allPositions.filter(p => p !== 'BB');

  const charts: ChartDef[] = [];

  for (const opener of openers) {
    // Map opener to range data class
    const cls = openerClass(opener);
    // Special: in HU, SB acts as BTN
    const effectiveCls = (maxPlayers === 2 && opener === 'SB') ? 'btn' : cls;

    if (depth === 15 || depth === 25) {
      const data = depth === 15 ? getRangeData15(effectiveCls) : getRangeData25(effectiveCls);
      charts.push({
        position: 'BB',
        situation: 'Defend',
        vsPosition: opener,
        category: 'Defend',
        stackDepth: depth,
        maxPlayers,
        description: `BB Defend vs ${opener} open (${depth}bb)`,
        actionTypes: BB_DEFEND_JAM_ACTIONS,
        ranges: bbDefendJamRange(data.threeBet, data.jam, data.call),
      });
    } else {
      // 40, 60, 100
      const data = depth === 40
        ? getRangeData40(effectiveCls)
        : depth === 60
          ? getRangeData60(effectiveCls)
          : getRangeData100(effectiveCls);
      charts.push({
        position: 'BB',
        situation: 'Defend',
        vsPosition: opener,
        category: 'Defend',
        stackDepth: depth,
        maxPlayers,
        description: `BB Defend vs ${opener} open (${depth}bb)`,
        actionTypes: BB_DEFEND_ACTIONS,
        ranges: bbDefendRange(data.threeBet, data.call, data.mixed),
      });
    }
  }

  return charts;
}

// Backward compatibility
export const BB_DEFEND_CHARTS = getBbDefendCharts(100);
