import {
  ChartDef,
  handLabel,
  inSet,
  StackDepth,
  MaxPlayers,
  positionsForPlayerCount,
  openerClass,
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
// 25bb ranges — jam-or-fold style (no calling range)
// ---------------------------------------------------------------------------

const BTN_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_HJ_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const BTN_3BET_VS_CO_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);
const SB_3BET_VS_UTG_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_HJ_3BET_25 = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);
const SB_3BET_VS_BTN_3BET_25 = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']);

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
): RangeResult {
  const oClass = openerClass(opener);

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
  // At 25bb only BTN and SB have 3bet data
  if (refSeat === 'BTN') {
    switch (oClass) {
      case 'ep-tight': return threeBetFoldRange(BTN_3BET_VS_UTG_3BET_25);
      case 'hj':       return threeBetFoldRange(BTN_3BET_VS_HJ_3BET_25);
      case 'co':       return threeBetFoldRange(BTN_3BET_VS_CO_3BET_25);
      default:         return null;
    }
  }
  if (refSeat === 'SB') {
    switch (oClass) {
      case 'ep-tight': return threeBetFoldRange(SB_3BET_VS_UTG_3BET_25);
      case 'hj':       return threeBetFoldRange(SB_3BET_VS_HJ_3BET_25);
      case 'co':       return threeBetFoldRange(SB_3BET_VS_UTG_3BET_25); // tight, reuse vs UTG
      case 'btn':      return threeBetFoldRange(SB_3BET_VS_BTN_3BET_25);
      default:         return null;
    }
  }
  // HJ/CO at 25bb: no 3bet chart data (shove-or-fold handled in short stack)
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
    case 100: return threeBetRange(HJ_3BET_VS_UTG_3BET, HJ_3BET_VS_UTG_CALL);
    case 60:  return threeBetRange(HJ_3BET_VS_UTG_3BET, HJ_3BET_VS_UTG_CALL_60);
    case 40:  return threeBetRange(HJ_3BET_VS_UTG_3BET, HJ_3BET_VS_UTG_CALL_40);
    default:  return null;
  }
}

function coRange(
  oClass: ReturnType<typeof openerClass>,
  depth: StackDepth,
): RangeResult {
  if (oClass === 'ep-tight') {
    switch (depth) {
      case 100: return threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL);
      case 60:  return threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL_60);
      case 40:  return threeBetRange(CO_3BET_VS_UTG_3BET, CO_3BET_VS_UTG_CALL_40);
      default:  return null;
    }
  }
  if (oClass === 'hj') {
    switch (depth) {
      case 100: return threeBetRange(CO_3BET_VS_HJ_3BET, CO_3BET_VS_HJ_CALL);
      case 60:  return threeBetRange(CO_3BET_VS_HJ_3BET, CO_3BET_VS_HJ_CALL_60);
      case 40:  return threeBetRange(CO_3BET_VS_HJ_3BET, CO_3BET_VS_HJ_CALL_40);
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
      case 100: return threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL);
      case 60:  return threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL_60);
      case 40:  return threeBetRange(BTN_3BET_VS_UTG_3BET, BTN_3BET_VS_UTG_CALL_40);
      default:  return null;
    }
  }
  if (oClass === 'hj') {
    switch (depth) {
      case 100: return threeBetRange(BTN_3BET_VS_HJ_3BET, BTN_3BET_VS_HJ_CALL);
      case 60:  return threeBetRange(BTN_3BET_VS_HJ_3BET, BTN_3BET_VS_HJ_CALL_60);
      case 40:  return threeBetRange(BTN_3BET_VS_HJ_3BET, BTN_3BET_VS_HJ_CALL_40);
      default:  return null;
    }
  }
  if (oClass === 'co') {
    switch (depth) {
      case 100: return threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL);
      case 60:  return threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL_60);
      case 40:  return threeBetRange(BTN_3BET_VS_CO_3BET, BTN_3BET_VS_CO_CALL_40);
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
      case 100: return threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL);
      case 60:  return threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL_60);
      case 40:  return threeBetRange(SB_3BET_VS_UTG_3BET, SB_3BET_VS_UTG_CALL_40);
      default:  return null;
    }
  }
  if (oClass === 'hj') {
    switch (depth) {
      case 100: return threeBetRange(SB_3BET_VS_HJ_3BET, SB_3BET_VS_HJ_CALL);
      case 60:  return threeBetRange(SB_3BET_VS_HJ_3BET, SB_3BET_VS_HJ_CALL_60);
      case 40:  return threeBetRange(SB_3BET_VS_HJ_3BET, SB_3BET_VS_HJ_CALL_40);
      default:  return null;
    }
  }
  if (oClass === 'co') {
    switch (depth) {
      case 100: return threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL);
      case 60:  return threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL_60);
      case 40:  return threeBetRange(SB_3BET_VS_CO_3BET, SB_3BET_VS_CO_CALL_40);
      default:  return null;
    }
  }
  if (oClass === 'btn') {
    switch (depth) {
      case 100: return threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL);
      case 60:  return threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL_60);
      case 40:  return threeBetRange(SB_3BET_VS_BTN_3BET, SB_3BET_VS_BTN_CALL_40);
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
  // HU (2-max): no 3bet charts — BB defend handles that
  if (maxPlayers === 2) return [];

  const positions = positionsForPlayerCount(maxPlayers).filter(p => p !== 'BB');
  const charts: ChartDef[] = [];

  for (let i = 0; i < positions.length; i++) {
    const threeBettor = positions[i];
    // 3bettor can 3bet any position before it in the order
    for (let j = 0; j < i; j++) {
      const opener = positions[j];
      const rangeData = get3betRangeData(threeBettor, opener, depth);
      if (rangeData) {
        charts.push({
          position: threeBettor,
          situation: '3bet vs Opener',
          vsPosition: opener,
          category: '3bet vs Opener',
          stackDepth: depth,
          maxPlayers,
          description: `${threeBettor} 3bet vs ${opener} open (${depth}bb, ${maxPlayers}-max)`,
          actionTypes: (depth === 15 || depth === 25) ? THREE_BET_FOLD_ACTIONS : THREE_BET_ACTIONS,
          ranges: rangeData,
        });
      }
    }
  }

  return charts;
}

// Backward compatibility
export const THREE_BET_CHARTS = getThreeBetCharts(100);
