import {
  ChartDef,
  handLabel,
  inSet,
  smoothFrequencies,
  StackDepth,
  MaxPlayers,
  positionsForPlayerCount,
  openerClass,
  shallowOpenerClass,
} from './helpers';
import { THREE_BET_ACTIONS, THREE_BET_FOLD_ACTIONS } from './actionColors';

// 3bet ranges when facing an open from various positions

// ---------------------------------------------------------------------------
// 100bb ranges (original)
// ---------------------------------------------------------------------------

// HJ 3betting vs EP-tight open — very tight
const HJ_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const HJ_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs']);

// CO 3betting vs EP-tight open — very tight
const CO_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const CO_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs']);

// CO 3betting vs HJ open
const CO_3BET_VS_HJ_3BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const CO_3BET_VS_HJ_CALL = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs']);

// BTN 3betting vs EP-tight open
const BTN_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BTN_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs', 'AJs']);

// BTN 3betting vs HJ open
const BTN_3BET_VS_HJ_3BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_HJ_CALL = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs', 'KQs']);

// BTN 3betting vs CO open — wider
const BTN_3BET_VS_CO_3BET = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'A5s', 'A4s']);
const BTN_3BET_VS_CO_CALL = new Set([
  'TT', '99', '88', '77',
  'AQo', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s',
]);

// SB 3betting vs EP-tight open — very tight
const SB_3BET_VS_UTG_3BET = new Set(['AA', 'KK', 'QQ', 'AKs']);
const SB_3BET_VS_UTG_CALL = new Set(['JJ', 'TT', 'AKo', 'AQs']);

// SB 3betting vs HJ open
const SB_3BET_VS_HJ_3BET = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_HJ_CALL = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs']);

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

const HJ_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_HJ_CALL_60 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo']);
const BTN_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo', 'AQs']);
const BTN_3BET_VS_HJ_CALL_60 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs']);
const BTN_3BET_VS_CO_CALL_60 = new Set([
  'TT', '99', '88', '77',
  'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
]);
const SB_3BET_VS_UTG_CALL_60 = new Set(['JJ', 'TT', 'AKo']);
const SB_3BET_VS_HJ_CALL_60 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo']);
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

const HJ_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const CO_3BET_VS_HJ_CALL_40 = new Set(['JJ', 'TT', 'AQs', 'AQo']);
const BTN_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const BTN_3BET_VS_HJ_CALL_40 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo']);
const BTN_3BET_VS_CO_CALL_40 = new Set([
  'TT', '99', '88',
  'AQo', 'AJs', 'ATs',
  'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '98s',
]);
const SB_3BET_VS_UTG_CALL_40 = new Set(['JJ', 'TT', 'AKo']);
const SB_3BET_VS_HJ_CALL_40 = new Set(['JJ', 'TT', 'AQs', 'AQo']);
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
// 25bb ranges — still aggressive, but not pure jam/fold
// ---------------------------------------------------------------------------

const HJ_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const HJ_3BET_VS_UTG_CALL_25 = new Set(['JJ', 'TT', 'AKo', 'AQs']);

const CO_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const CO_3BET_VS_UTG_CALL_25 = new Set(['JJ', 'TT', 'AKo', 'AQs']);
const CO_3BET_VS_HJ_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const CO_3BET_VS_HJ_CALL_25 = new Set(['JJ', 'TT', '99', 'AQs', 'AQo', 'AJs']);

const BTN_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_UTG_CALL_25 = new Set(['JJ', 'TT', 'AQs', 'AJs', 'KQs']);
const BTN_3BET_VS_HJ_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);
const BTN_3BET_VS_HJ_CALL_25 = new Set(['TT', '99', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs']);
const BTN_3BET_VS_CO_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'A5s']);
const BTN_3BET_VS_CO_CALL_25 = new Set(['TT', '99', '88', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s']);

const SB_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_UTG_CALL_25 = new Set(['JJ', 'TT', 'AQs', 'AJs']);
const SB_3BET_VS_HJ_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);
const SB_3BET_VS_HJ_CALL_25 = new Set(['TT', '99', 'AQs', 'AQo', 'AJs', 'KQs']);
const SB_3BET_VS_CO_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'A5s']);
const SB_3BET_VS_CO_CALL_25 = new Set(['TT', '99', '88', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s']);
const SB_3BET_VS_BTN_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'A5s', 'A4s']);
const SB_3BET_VS_BTN_CALL_25 = new Set(['99', '88', '77', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'KTs', 'QJs', 'JTs', 'T9s', '98s']);

// ---------------------------------------------------------------------------
// 15bb ranges — reshove-or-fold (wider than 25bb due to more fold equity)
// ---------------------------------------------------------------------------

const BTN_3BET_VS_UTG_3BET_15 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const BTN_3BET_VS_HJ_3BET_15 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_CO_3BET_15 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const SB_3BET_VS_UTG_3BET_15 = new Set(['AA', 'KK', 'QQ', 'AKs']);
const SB_3BET_VS_HJ_3BET_15 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_CO_3BET_15 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);
const SB_3BET_VS_BTN_3BET_15 = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs']);
// HJ/CO at 15bb — reshove the tightest range
const HJ_3BET_VS_UTG_3BET_15 = new Set(['AA', 'KK']);
const CO_3BET_VS_UTG_3BET_15 = new Set(['AA', 'KK', 'QQ']);
const CO_3BET_VS_HJ_3BET_15 = new Set(['AA', 'KK', 'QQ', 'AKs']);

type ThreeBetMixedMap = false | Record<string, { '3bet': number; call: number; fold: number }>;

const THREE_BET_MIXED_DEFAULT: Record<string, { '3bet': number; call: number; fold: number }> = {
  'JJ': { '3bet': 0.52, call: 0.48, fold: 0 },
  'TT': { '3bet': 0.34, call: 0.66, fold: 0 },
  'AQs': { '3bet': 0.42, call: 0.58, fold: 0 },
  'AQo': { '3bet': 0.28, call: 0.52, fold: 0.2 },
  'AJs': { '3bet': 0.24, call: 0.64, fold: 0.12 },
  'KQs': { '3bet': 0.18, call: 0.62, fold: 0.2 },
  'A5s': { '3bet': 0.62, call: 0.1, fold: 0.28 },
  'A4s': { '3bet': 0.56, call: 0.1, fold: 0.34 },
};

const THREE_BET_MIXED_40: Record<string, { '3bet': number; call: number; fold: number }> = {
  'JJ': { '3bet': 0.58, call: 0.42, fold: 0 },
  'TT': { '3bet': 0.4, call: 0.6, fold: 0 },
  'AQs': { '3bet': 0.48, call: 0.52, fold: 0 },
  'AQo': { '3bet': 0.34, call: 0.46, fold: 0.2 },
  'AJs': { '3bet': 0.3, call: 0.56, fold: 0.14 },
  'KQs': { '3bet': 0.24, call: 0.56, fold: 0.2 },
};

const THREE_BET_MIXED_25: Record<string, { '3bet': number; call: number; fold: number }> = {
  'JJ': { '3bet': 0.65, call: 0.35, fold: 0 },
  'TT': { '3bet': 0.5, call: 0.5, fold: 0 },
  'AQs': { '3bet': 0.55, call: 0.45, fold: 0 },
  'AQo': { '3bet': 0.4, call: 0.35, fold: 0.25 },
  'AJs': { '3bet': 0.35, call: 0.4, fold: 0.25 },
  'KQs': { '3bet': 0.3, call: 0.4, fold: 0.3 },
};

// ---------------------------------------------------------------------------
// threeBetRange helper
// ---------------------------------------------------------------------------

function threeBetRange(
  threeBetSet: Set<string>,
  callSet: Set<string>,
  mixedMap: ThreeBetMixedMap = false,
) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (mixedMap && h in mixedMap && !inSet(h, threeBetSet)) return mixedMap[h];
    const currentKey = inSet(h, threeBetSet) ? '3bet' : inSet(h, callSet) ? 'call' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: '3bet', set: threeBetSet },
      { key: 'call', set: callSet },
    ]);
    if (smooth) return smooth;
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, call: 0, fold: 0 };
    if (inSet(h, callSet)) return { '3bet': 0, call: 1.0, fold: 0 };
    return { '3bet': 0, call: 0, fold: 1.0 };
  };
}

// ---------------------------------------------------------------------------
// 3bet-or-fold range (25bb jam/fold — no call action)
// ---------------------------------------------------------------------------

function threeBetFoldRange(threeBetSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, fold: 0 };
    return { '3bet': 0, fold: 1.0 };
  };
}

// ---------------------------------------------------------------------------
// Range data lookup by 3bettor seat, opener class, and depth
// ---------------------------------------------------------------------------

type RangeResult = ((row: number, col: number) => Record<string, number>) | null;

/**
 * Maps (3bettorSeat, openerClass, depth) to the appropriate range data.
 *
 * 3bettor seat mapping (what reference-position data to use):
 *   - SB  -> SB data
 *   - BTN -> BTN data
 *   - CO  -> CO data
 *   - HJ  -> HJ data (formerly "MP" in old file)
 *   - Early positions (UTG, UTG+1, UTG+2, MP) -> reuse HJ data (tightest 3bet)
 *
 * Opener class mapping (what "vs" data to use):
 *   - 'ep-tight' (UTG, UTG+1, UTG+2, MP) -> vs UTG data
 *   - 'hj'       (HJ)                     -> vs HJ data (formerly vs MP)
 *   - 'co'       (CO)                     -> vs CO data
 *   - 'btn'      (BTN)                    -> vs BTN data
 */
function get3betRangeData(
  threeBettor: string,
  opener: string,
  depth: StackDepth,
  maxPlayers: MaxPlayers,
): RangeResult {
  const oClass = depth <= 25 ? shallowOpenerClass(opener, maxPlayers) : openerClass(opener);

  // Determine which reference 3bettor's data to use
  const refSeat = threeBettorRefSeat(threeBettor);

  if (depth === 15) {
    return get15bbRange(refSeat, oClass);
  }
  if (depth === 25) {
    return get25bbRange(refSeat, oClass);
  }

  return getDeepRange(refSeat, oClass, depth);
}

/**
 * Map actual 3bettor position to the reference seat whose data we have.
 * Early positions (UTG, UTG+1, UTG+2, MP) reuse HJ data (tightest available).
 */
function threeBettorRefSeat(pos: string): 'HJ' | 'CO' | 'BTN' | 'SB' {
  switch (pos) {
    case 'SB': return 'SB';
    case 'BTN': return 'BTN';
    case 'CO': return 'CO';
    default: return 'HJ'; // HJ, MP, UTG+2, UTG+1, UTG
  }
}

// ---------------------------------------------------------------------------
// 15bb reshove-or-fold ranges
// ---------------------------------------------------------------------------

function get15bbRange(
  refSeat: 'HJ' | 'CO' | 'BTN' | 'SB',
  oClass: ReturnType<typeof openerClass>,
): RangeResult {
  if (refSeat === 'HJ') {
    if (oClass === 'ep-tight') return threeBetFoldRange(HJ_3BET_VS_UTG_3BET_15);
    return null;
  }
  if (refSeat === 'CO') {
    if (oClass === 'ep-tight') return threeBetFoldRange(CO_3BET_VS_UTG_3BET_15);
    if (oClass === 'hj') return threeBetFoldRange(CO_3BET_VS_HJ_3BET_15);
    return null;
  }
  if (refSeat === 'BTN') {
    switch (oClass) {
      case 'ep-tight': return threeBetFoldRange(BTN_3BET_VS_UTG_3BET_15);
      case 'hj':       return threeBetFoldRange(BTN_3BET_VS_HJ_3BET_15);
      case 'co':       return threeBetFoldRange(BTN_3BET_VS_CO_3BET_15);
      default:         return null;
    }
  }
  if (refSeat === 'SB') {
    switch (oClass) {
      case 'ep-tight': return threeBetFoldRange(SB_3BET_VS_UTG_3BET_15);
      case 'hj':       return threeBetFoldRange(SB_3BET_VS_HJ_3BET_15);
      case 'co':       return threeBetFoldRange(SB_3BET_VS_CO_3BET_15);
      case 'btn':      return threeBetFoldRange(SB_3BET_VS_BTN_3BET_15);
      default:         return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 25bb jam-or-fold ranges
// ---------------------------------------------------------------------------

function get25bbRange(
  refSeat: 'HJ' | 'CO' | 'BTN' | 'SB',
  oClass: ReturnType<typeof openerClass>,
): RangeResult {
  if (refSeat === 'HJ') {
    if (oClass === 'ep-tight') return threeBetRange(HJ_3BET_VS_UTG_3BET_25, HJ_3BET_VS_UTG_CALL_25, THREE_BET_MIXED_25);
    return null;
  }
  if (refSeat === 'CO') {
    if (oClass === 'ep-tight') return threeBetRange(CO_3BET_VS_UTG_3BET_25, CO_3BET_VS_UTG_CALL_25, THREE_BET_MIXED_25);
    if (oClass === 'hj') return threeBetRange(CO_3BET_VS_HJ_3BET_25, CO_3BET_VS_HJ_CALL_25, THREE_BET_MIXED_25);
    return null;
  }
  if (refSeat === 'BTN') {
    switch (oClass) {
      case 'ep-tight': return threeBetRange(BTN_3BET_VS_UTG_3BET_25, BTN_3BET_VS_UTG_CALL_25, THREE_BET_MIXED_25);
      case 'hj':       return threeBetRange(BTN_3BET_VS_HJ_3BET_25, BTN_3BET_VS_HJ_CALL_25, THREE_BET_MIXED_25);
      case 'co':       return threeBetRange(BTN_3BET_VS_CO_3BET_25, BTN_3BET_VS_CO_CALL_25, THREE_BET_MIXED_25);
      default:         return null;
    }
  }
  if (refSeat === 'SB') {
    switch (oClass) {
      case 'ep-tight': return threeBetRange(SB_3BET_VS_UTG_3BET_25, SB_3BET_VS_UTG_CALL_25, THREE_BET_MIXED_25);
      case 'hj':       return threeBetRange(SB_3BET_VS_HJ_3BET_25, SB_3BET_VS_HJ_CALL_25, THREE_BET_MIXED_25);
      case 'co':       return threeBetRange(SB_3BET_VS_CO_3BET_25, SB_3BET_VS_CO_CALL_25, THREE_BET_MIXED_25);
      case 'btn':      return threeBetRange(SB_3BET_VS_BTN_3BET_25, SB_3BET_VS_BTN_CALL_25, THREE_BET_MIXED_25);
      default:         return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Deep-stack ranges (100bb / 60bb / 40bb)
// ---------------------------------------------------------------------------

function getDeepRange(
  refSeat: 'HJ' | 'CO' | 'BTN' | 'SB',
  oClass: ReturnType<typeof openerClass>,
  depth: StackDepth,
): RangeResult {
  switch (refSeat) {
    case 'HJ': return hjRange(oClass, depth);
    case 'CO': return coRange(oClass, depth);
    case 'BTN': return btnRange(oClass, depth);
    case 'SB': return sbRange(oClass, depth);
  }
}

function hjRange(
  oClass: ReturnType<typeof openerClass>,
  depth: StackDepth,
): RangeResult {
  // HJ can only 3bet ep-tight openers
  if (oClass !== 'ep-tight') return null;
  switch (depth) {
    case 100: return threeBetRange(HJ_3BET_VS_UTG_3BET, HJ_3BET_VS_UTG_CALL, {
      'JJ': { '3bet': 0.4, call: 0.6, fold: 0 },
      'AQs': { '3bet': 0.28, call: 0.64, fold: 0.08 },
    });
    case 60:  return threeBetRange(HJ_3BET_VS_UTG_3BET, HJ_3BET_VS_UTG_CALL_60, {
      'JJ': { '3bet': 0.46, call: 0.54, fold: 0 },
      'AQs': { '3bet': 0.32, call: 0.6, fold: 0.08 },
    });
    case 40:  return threeBetRange(HJ_3BET_VS_UTG_3BET, HJ_3BET_VS_UTG_CALL_40, {
      'JJ': { '3bet': 0.52, call: 0.48, fold: 0 },
      'AQs': { '3bet': 0.38, call: 0.52, fold: 0.1 },
    });
    default:  return null;
  }
}

function coRange(
  oClass: ReturnType<typeof openerClass>,
  depth: StackDepth,
): RangeResult {
  if (oClass === 'ep-tight') {
    switch (depth) {
      case 100: return threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL, {
        'JJ': { '3bet': 0.44, call: 0.56, fold: 0 },
        'AQs': { '3bet': 0.3, call: 0.64, fold: 0.06 },
      });
      case 60:  return threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL_60, {
        'JJ': { '3bet': 0.5, call: 0.5, fold: 0 },
        'AQs': { '3bet': 0.34, call: 0.6, fold: 0.06 },
      });
      case 40:  return threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL_40, {
        'JJ': { '3bet': 0.56, call: 0.44, fold: 0 },
        'AQs': { '3bet': 0.4, call: 0.54, fold: 0.06 },
      });
      default:  return null;
    }
  }
  if (oClass === 'hj') {
    switch (depth) {
      case 100: return threeBetRange(CO_3BET_VS_HJ_3BET, CO_3BET_VS_HJ_CALL, THREE_BET_MIXED_DEFAULT);
      case 60:  return threeBetRange(CO_3BET_VS_HJ_3BET, CO_3BET_VS_HJ_CALL_60, THREE_BET_MIXED_DEFAULT);
      case 40:  return threeBetRange(CO_3BET_VS_HJ_3BET, CO_3BET_VS_HJ_CALL_40, THREE_BET_MIXED_40);
      default:  return null;
    }
  }
  return null;
}

function btnRange(
  oClass: ReturnType<typeof openerClass>,
  depth: StackDepth,
): RangeResult {
  if (oClass === 'ep-tight') {
    switch (depth) {
      case 100: return threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL, {
        'JJ': { '3bet': 0.42, call: 0.58, fold: 0 },
        'AQs': { '3bet': 0.32, call: 0.62, fold: 0.06 },
        'AJs': { '3bet': 0.18, call: 0.7, fold: 0.12 },
      });
      case 60:  return threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL_60, {
        'JJ': { '3bet': 0.46, call: 0.54, fold: 0 },
        'AQs': { '3bet': 0.36, call: 0.58, fold: 0.06 },
      });
      case 40:  return threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL_40, {
        'JJ': { '3bet': 0.52, call: 0.48, fold: 0 },
        'AQs': { '3bet': 0.42, call: 0.52, fold: 0.06 },
      });
      default:  return null;
    }
  }
  if (oClass === 'hj') {
    switch (depth) {
      case 100: return threeBetRange(BTN_3BET_VS_HJ_3BET, BTN_3BET_VS_HJ_CALL, THREE_BET_MIXED_DEFAULT);
      case 60:  return threeBetRange(BTN_3BET_VS_HJ_3BET, BTN_3BET_VS_HJ_CALL_60, THREE_BET_MIXED_DEFAULT);
      case 40:  return threeBetRange(BTN_3BET_VS_HJ_3BET, BTN_3BET_VS_HJ_CALL_40, THREE_BET_MIXED_40);
      default:  return null;
    }
  }
  if (oClass === 'co') {
    switch (depth) {
      case 100: return threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL, {
        ...THREE_BET_MIXED_DEFAULT,
        '99': { '3bet': 0.22, call: 0.68, fold: 0.1 },
        'ATs': { '3bet': 0.26, call: 0.56, fold: 0.18 },
        'KJs': { '3bet': 0.24, call: 0.58, fold: 0.18 },
        'QTs': { '3bet': 0.18, call: 0.54, fold: 0.28 },
      });
      case 60:  return threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL_60, {
        ...THREE_BET_MIXED_DEFAULT,
        '99': { '3bet': 0.26, call: 0.66, fold: 0.08 },
        'ATs': { '3bet': 0.3, call: 0.54, fold: 0.16 },
      });
      case 40:  return threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL_40, {
        ...THREE_BET_MIXED_40,
        '99': { '3bet': 0.3, call: 0.62, fold: 0.08 },
      });
      default:  return null;
    }
  }
  return null;
}

function sbRange(
  oClass: ReturnType<typeof openerClass>,
  depth: StackDepth,
): RangeResult {
  if (oClass === 'ep-tight') {
    switch (depth) {
      case 100: return threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL, {
        'JJ': { '3bet': 0.44, call: 0.56, fold: 0 },
        'AQs': { '3bet': 0.32, call: 0.62, fold: 0.06 },
        'AKo': { '3bet': 0.55, call: 0.45, fold: 0 },
      });
      case 60:  return threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL_60, {
        'JJ': { '3bet': 0.48, call: 0.52, fold: 0 },
        'AQs': { '3bet': 0.36, call: 0.58, fold: 0.06 },
      });
      case 40:  return threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL_40, {
        'JJ': { '3bet': 0.54, call: 0.46, fold: 0 },
        'AQs': { '3bet': 0.42, call: 0.52, fold: 0.06 },
      });
      default:  return null;
    }
  }
  if (oClass === 'hj') {
    switch (depth) {
      case 100: return threeBetRange(SB_3BET_VS_HJ_3BET, SB_3BET_VS_HJ_CALL, THREE_BET_MIXED_DEFAULT);
      case 60:  return threeBetRange(SB_3BET_VS_HJ_3BET, SB_3BET_VS_HJ_CALL_60, THREE_BET_MIXED_DEFAULT);
      case 40:  return threeBetRange(SB_3BET_VS_HJ_3BET, SB_3BET_VS_HJ_CALL_40, THREE_BET_MIXED_40);
      default:  return null;
    }
  }
  if (oClass === 'co') {
    switch (depth) {
      case 100: return threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL, {
        ...THREE_BET_MIXED_DEFAULT,
        'TT': { '3bet': 0.42, call: 0.58, fold: 0 },
        'A9s': { '3bet': 0.18, call: 0.56, fold: 0.26 },
        'KTs': { '3bet': 0.22, call: 0.56, fold: 0.22 },
      });
      case 60:  return threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL_60, {
        ...THREE_BET_MIXED_DEFAULT,
        'TT': { '3bet': 0.46, call: 0.54, fold: 0 },
        'A9s': { '3bet': 0.22, call: 0.54, fold: 0.24 },
      });
      case 40:  return threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL_40, {
        ...THREE_BET_MIXED_40,
        'TT': { '3bet': 0.5, call: 0.5, fold: 0 },
      });
      default:  return null;
    }
  }
  if (oClass === 'btn') {
    switch (depth) {
      case 100: return threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL, {
        ...THREE_BET_MIXED_DEFAULT,
        '99': { '3bet': 0.26, call: 0.68, fold: 0.06 },
        'A8s': { '3bet': 0.24, call: 0.54, fold: 0.22 },
        'KTs': { '3bet': 0.28, call: 0.56, fold: 0.16 },
        'QTs': { '3bet': 0.22, call: 0.54, fold: 0.24 },
        '87s': { '3bet': 0.16, call: 0.56, fold: 0.28 },
      });
      case 60:  return threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL_60, {
        ...THREE_BET_MIXED_DEFAULT,
        '99': { '3bet': 0.3, call: 0.64, fold: 0.06 },
        'A8s': { '3bet': 0.28, call: 0.52, fold: 0.2 },
      });
      case 40:  return threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL_40, {
        ...THREE_BET_MIXED_40,
        '99': { '3bet': 0.34, call: 0.6, fold: 0.06 },
      });
      default:  return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getThreeBetCharts(
  depth: StackDepth,
  maxPlayers: MaxPlayers = 6,
): ChartDef[] {
  if (depth === 7) return []; // 7bb is pure push/fold

  // HU (2-max): no 3bet charts — BB defend handles that
  if (maxPlayers === 2) return [];

  const positions = positionsForPlayerCount(maxPlayers).filter(p => p !== 'BB');
  const charts: ChartDef[] = [];

  for (let i = 0; i < positions.length; i++) {
    const threeBettor = positions[i];
    // 3bettor can 3bet any position before it in the order
    for (let j = 0; j < i; j++) {
      const opener = positions[j];
      const rangeData = get3betRangeData(threeBettor, opener, depth, maxPlayers);
      if (rangeData) {
        charts.push({
          position: threeBettor,
          situation: '3bet vs Opener',
          vsPosition: opener,
          category: '3bet vs Opener',
          stackDepth: depth,
          maxPlayers,
          description: `${threeBettor} 3bet vs ${opener} open (${depth}bb, ${maxPlayers}-max)`,
          actionTypes: depth === 15 ? THREE_BET_FOLD_ACTIONS : THREE_BET_ACTIONS,
          ranges: rangeData,
        });
      }
    }
  }

  return charts;
}

// Backward compatibility
export const THREE_BET_CHARTS = getThreeBetCharts(100);
