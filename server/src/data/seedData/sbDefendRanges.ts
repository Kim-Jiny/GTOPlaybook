import { ChartDef, handLabel, inSet, MaxPlayers, positionsForPlayerCount, openerClass, shallowOpenerClass, smoothFrequencies, StackDepth } from './helpers';
import { SB_DEFEND_ACTIONS, SB_DEFEND_JAM_ACTIONS } from './actionColors';

// SB Defend (3bet or fold) vs various openers
// SB has no flat-call option in GTO — it's 3bet or fold

// ---------------------------------------------------------------------------
// 100bb ranges (original)
// ---------------------------------------------------------------------------

// SB vs UTG open — very tight 3bet
const SB_VS_UTG_3BET = new Set([
  'AA', 'KK', 'QQ', 'AKs', 'AKo',
  'A5s', 'A4s',
]);

// SB vs HJ open
const SB_VS_HJ_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs',
  'A5s', 'A4s', 'A3s',
]);

// SB vs CO open — wider
const SB_VS_CO_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'K9s', 'Q9s',
]);

// SB vs BTN open — polarized wide
const SB_VS_BTN_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s',
  'K9s', 'Q9s', 'J9s',
]);

// SB vs BB limp — raise wide (BB limped, SB raises)
const SB_VS_BB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
  'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
]);

// ---------------------------------------------------------------------------
// 15bb ranges — SB reshove-or-fold (wider jams than 25bb)
// ---------------------------------------------------------------------------

const SB_15_VS_UTG_3BET = new Set(['AA', 'KK']);
const SB_15_VS_UTG_JAM = new Set(['QQ', 'AKs', 'AKo']);

const SB_15_VS_HJ_3BET = new Set(['AA', 'KK']);
const SB_15_VS_HJ_JAM = new Set(['QQ', 'JJ', 'AKs', 'AKo', 'AQs']);

const SB_15_VS_CO_3BET = new Set(['AA', 'KK']);
const SB_15_VS_CO_JAM = new Set(['QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo']);

const SB_15_VS_BTN_3BET = new Set(['AA', 'KK']);
const SB_15_VS_BTN_JAM = new Set(['QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs']);

const SB_15_VS_BB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
  'AKs', 'AQs', 'AJs', 'ATs',
  'KQs',
  'AKo', 'AQo', 'AJo',
]);

// ---------------------------------------------------------------------------
// 25bb ranges — SB remains polarized, but not premium-only
// ---------------------------------------------------------------------------

const SB_25_VS_UTG_3BET = new Set([
  'AA', 'KK', 'QQ', 'AKs',
]);

const SB_25_VS_HJ_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'A5s',
]);

const SB_25_VS_CO_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'A5s', 'A4s',
]);

const SB_25_VS_BTN_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AJs', 'A5s', 'A4s', 'K9s',
]);

// SB vs BB limp at 25bb — wider since BB is weaker
const SB_25_VS_BB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
  'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s', '76s',
  'AKo', 'AQo', 'AJo', 'ATo',
  'KQo', 'KJo', 'QJo',
]);

// 25bb jam sets — hands that jam (all-in) instead of standard 3bet
const SB_25_VS_UTG_JAM = new Set(['JJ', 'AKo']);
const SB_25_VS_HJ_JAM = new Set(['QQ', 'AKo', 'AQs']);
const SB_25_VS_CO_JAM = new Set(['TT', '99', 'AQo', 'A5s']);
const SB_25_VS_BTN_JAM = new Set(['99', '88', 'AQo', 'ATs', 'KQs', 'QJs']);

// ---------------------------------------------------------------------------
// 40bb ranges — ~20-25% tighter 3bet sets than 100bb
// ---------------------------------------------------------------------------

// SB vs UTG at 40bb — drop AKo and one blocker
const SB_40_VS_UTG_3BET = new Set([
  'AA', 'KK', 'QQ', 'AKs',
  'A5s',
]);

// SB vs HJ at 40bb — drop JJ and tighten bluffs
const SB_40_VS_HJ_3BET = new Set([
  'AA', 'KK', 'QQ', 'AKs', 'AKo', 'AQs',
  'A5s', 'A4s',
]);

// SB vs CO at 40bb — drop ~20-25% of widest combos
const SB_40_VS_CO_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AJs',
  'A5s', 'A4s', 'A3s',
  'KQs',
]);

// SB vs BTN at 40bb — tighter than 100bb
const SB_40_VS_BTN_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AJs',
  'A5s', 'A4s', 'A3s',
  'K9s',
]);

// SB vs BB limp at 40bb — tighter than 100bb
const SB_40_VS_BB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
  'QJs', 'QTs', 'Q9s',
  'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s',
  'AKo', 'AQo', 'AJo', 'ATo',
  'KQo', 'KJo', 'QJo', 'JTo',
]);

// ---------------------------------------------------------------------------
// 60bb ranges — ~10% tighter 3bet sets than 100bb
// ---------------------------------------------------------------------------

// SB vs UTG at 60bb — slightly tighter
const SB_60_VS_UTG_3BET = new Set([
  'AA', 'KK', 'QQ', 'AKs', 'AKo',
  'A5s',
]);

// SB vs HJ at 60bb — drop one blocker
const SB_60_VS_HJ_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs',
  'A5s', 'A4s',
]);

// SB vs CO at 60bb — drop a couple of widest combos
const SB_60_VS_CO_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s',
  'KQs', 'K9s',
]);

// SB vs BTN at 60bb — slightly tighter
const SB_60_VS_BTN_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs',
  'A5s', 'A4s', 'A3s',
  'K9s', 'Q9s',
]);

// SB vs BB limp at 60bb — slightly tighter than 100bb
const SB_60_VS_BB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s',
  'AKo', 'AQo', 'AJo', 'ATo',
  'KQo', 'KJo', 'KTo', 'QJo', 'QTo',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SbMixedMap = false | Record<string, { '3bet': number; fold: number }>;

// Only high-frequency 3bet boundary hands — low-3bet hands handled by smoothFrequencies
const SB_DEFEND_MIXED_100: Record<string, { '3bet': number; fold: number }> = {
  'JJ': { '3bet': 0.55, fold: 0.45 },
  'TT': { '3bet': 0.42, fold: 0.58 },
  'AQo': { '3bet': 0.48, fold: 0.52 },
  'AJs': { '3bet': 0.38, fold: 0.62 },
  'A5s': { '3bet': 0.72, fold: 0.28 },
  'A4s': { '3bet': 0.66, fold: 0.34 },
};

const SB_DEFEND_MIXED_60: Record<string, { '3bet': number; fold: number }> = {
  'JJ': { '3bet': 0.6, fold: 0.4 },
  'TT': { '3bet': 0.48, fold: 0.52 },
  'AQo': { '3bet': 0.54, fold: 0.46 },
  'AJs': { '3bet': 0.42, fold: 0.58 },
  'A5s': { '3bet': 0.76, fold: 0.24 },
  'A4s': { '3bet': 0.7, fold: 0.3 },
};

const SB_DEFEND_MIXED_40: Record<string, { '3bet': number; fold: number }> = {
  'JJ': { '3bet': 0.68, fold: 0.32 },
  'TT': { '3bet': 0.55, fold: 0.45 },
  'AQo': { '3bet': 0.6, fold: 0.4 },
  'AJs': { '3bet': 0.48, fold: 0.52 },
  'A5s': { '3bet': 0.8, fold: 0.2 },
};

function sbDefendRange(threeBetSet: Set<string>, mixedMap: SbMixedMap = false) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (mixedMap && h in mixedMap && !inSet(h, threeBetSet)) return mixedMap[h];
    const currentKey = inSet(h, threeBetSet) ? '3bet' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [{ key: '3bet', set: threeBetSet }]);
    if (smooth) return smooth;
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, fold: 0 };
    return { '3bet': 0, fold: 1.0 };
  };
}

function sbDefendJamRange(threeBetSet: Set<string>, jamSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    const currentKey = inSet(h, jamSet) ? 'allin' : inSet(h, threeBetSet) ? '3bet' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: '3bet', set: threeBetSet },
      { key: 'allin', set: jamSet },
    ], 0.88, 0.1);
    if (smooth) return smooth;
    if (inSet(h, jamSet)) return { '3bet': 0, allin: 1.0, fold: 0 };
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, allin: 0, fold: 0 };
    return { '3bet': 0, allin: 0, fold: 1.0 };
  };
}

// ---------------------------------------------------------------------------
// Range data lookup by opener class and stack depth
// ---------------------------------------------------------------------------

function get3betData100(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): Set<string> {
  switch (cls) {
    case 'ep-tight': return SB_VS_UTG_3BET;
    case 'hj':       return SB_VS_HJ_3BET;
    case 'co':       return SB_VS_CO_3BET;
    case 'btn':      return SB_VS_BTN_3BET;
  }
}

function getMixedData100(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): SbMixedMap {
  switch (cls) {
    case 'ep-tight':
      return {
        'JJ': { '3bet': 0.45, fold: 0.55 },
        'AQo': { '3bet': 0.3, fold: 0.7 },
        'A5s': { '3bet': 0.65, fold: 0.35 },
      };
    case 'hj':
      return {
        'JJ': { '3bet': 0.52, fold: 0.48 },
        'AQo': { '3bet': 0.4, fold: 0.6 },
        'A5s': { '3bet': 0.7, fold: 0.3 },
        'KQs': { '3bet': 0.24, fold: 0.76 },
      };
    case 'co':
    case 'btn':
      return SB_DEFEND_MIXED_100;
  }
}

function get3betData60(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): Set<string> {
  switch (cls) {
    case 'ep-tight': return SB_60_VS_UTG_3BET;
    case 'hj':       return SB_60_VS_HJ_3BET;
    case 'co':       return SB_60_VS_CO_3BET;
    case 'btn':      return SB_60_VS_BTN_3BET;
  }
}

function getMixedData60(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): SbMixedMap {
  switch (cls) {
    case 'ep-tight':
      return {
        'JJ': { '3bet': 0.5, fold: 0.5 },
        'AQo': { '3bet': 0.35, fold: 0.65 },
        'A5s': { '3bet': 0.72, fold: 0.28 },
      };
    case 'hj':
      return {
        'JJ': { '3bet': 0.56, fold: 0.44 },
        'AQo': { '3bet': 0.44, fold: 0.56 },
        'A5s': { '3bet': 0.74, fold: 0.26 },
        'KQs': { '3bet': 0.28, fold: 0.72 },
      };
    case 'co':
    case 'btn':
      return SB_DEFEND_MIXED_60;
  }
}

function get3betData40(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): Set<string> {
  switch (cls) {
    case 'ep-tight': return SB_40_VS_UTG_3BET;
    case 'hj':       return SB_40_VS_HJ_3BET;
    case 'co':       return SB_40_VS_CO_3BET;
    case 'btn':      return SB_40_VS_BTN_3BET;
  }
}

function getMixedData40(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): SbMixedMap {
  switch (cls) {
    case 'ep-tight':
      return {
        'AQo': { '3bet': 0.42, fold: 0.58 },
        'A5s': { '3bet': 0.76, fold: 0.24 },
      };
    case 'hj':
      return {
        'JJ': { '3bet': 0.62, fold: 0.38 },
        'AQo': { '3bet': 0.5, fold: 0.5 },
        'A5s': { '3bet': 0.78, fold: 0.22 },
      };
    case 'co':
    case 'btn':
      return SB_DEFEND_MIXED_40;
  }
}

function get15Data(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): { threeBet: Set<string>; jam: Set<string> } {
  switch (cls) {
    case 'ep-tight': return { threeBet: SB_15_VS_UTG_3BET, jam: SB_15_VS_UTG_JAM };
    case 'hj':       return { threeBet: SB_15_VS_HJ_3BET,  jam: SB_15_VS_HJ_JAM };
    case 'co':       return { threeBet: SB_15_VS_CO_3BET,   jam: SB_15_VS_CO_JAM };
    case 'btn':      return { threeBet: SB_15_VS_BTN_3BET,  jam: SB_15_VS_BTN_JAM };
  }
}

function get25Data(cls: 'ep-tight' | 'hj' | 'co' | 'btn'): { threeBet: Set<string>; jam: Set<string> } {
  switch (cls) {
    case 'ep-tight': return { threeBet: SB_25_VS_UTG_3BET, jam: SB_25_VS_UTG_JAM };
    case 'hj':       return { threeBet: SB_25_VS_HJ_3BET,  jam: SB_25_VS_HJ_JAM };
    case 'co':       return { threeBet: SB_25_VS_CO_3BET,   jam: SB_25_VS_CO_JAM };
    case 'btn':      return { threeBet: SB_25_VS_BTN_3BET,  jam: SB_25_VS_BTN_JAM };
  }
}

function getBbRaiseData(depth: StackDepth): Set<string> {
  switch (depth) {
    case 15:  return SB_15_VS_BB_RAISE;
    case 25:  return SB_25_VS_BB_RAISE;
    case 40:  return SB_40_VS_BB_RAISE;
    case 60:  return SB_60_VS_BB_RAISE;
    case 100: return SB_VS_BB_RAISE;
    default:  return SB_VS_BB_RAISE;
  }
}

// ---------------------------------------------------------------------------
// Depth-based chart builder — multi-table aware
// ---------------------------------------------------------------------------

export function getSbDefendCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth === 7) return []; // 7bb is pure push/fold

  // In HU (2 players), SB is the opener — no SB defend charts
  if (maxPlayers === 2) return [];

  const allPositions = positionsForPlayerCount(maxPlayers);
  // SB defends vs all opening positions (not BB, not SB itself)
  const openers = allPositions.filter(p => p !== 'BB' && p !== 'SB');

  const charts: ChartDef[] = [];

  for (const opener of openers) {
    const cls = depth <= 25 ? shallowOpenerClass(opener, maxPlayers) : openerClass(opener);
    // cls will never be 'sb' here since we filtered SB out;
    // cast to the narrower type used by SB lookup functions
    const sbCls = cls as 'ep-tight' | 'hj' | 'co' | 'btn';

    if (depth === 15 || depth === 25) {
      const data = depth === 15 ? get15Data(sbCls) : get25Data(sbCls);
      charts.push({
        position: 'SB',
        situation: 'SB Defend',
        vsPosition: opener,
        category: 'SB Defend',
        stackDepth: depth,
        maxPlayers,
        description: `SB 3bet/jam vs ${opener} open (${depth}bb)`,
        actionTypes: SB_DEFEND_JAM_ACTIONS,
        ranges: sbDefendJamRange(data.threeBet, data.jam),
      });
    } else {
      const threeBetSet = depth === 40
        ? get3betData40(sbCls)
        : depth === 60
          ? get3betData60(sbCls)
          : get3betData100(sbCls);
      const mixedMap = depth === 40
        ? getMixedData40(sbCls)
        : depth === 60
          ? getMixedData60(sbCls)
          : getMixedData100(sbCls);
      charts.push({
        position: 'SB',
        situation: 'SB Defend',
        vsPosition: opener,
        category: 'SB Defend',
        stackDepth: depth,
        maxPlayers,
        description: `SB 3bet or fold vs ${opener} open (${depth}bb)`,
        actionTypes: SB_DEFEND_ACTIONS,
        ranges: sbDefendRange(threeBetSet, mixedMap),
      });
    }
  }

  // SB raise vs BB limp — only at tables with 3+ players
  const bbRaiseSet = getBbRaiseData(depth);
  charts.push({
    position: 'SB',
    situation: 'SB Defend',
    vsPosition: 'BB',
    category: 'SB Defend',
    stackDepth: depth,
    maxPlayers,
    description: `SB raise vs BB limp (${depth}bb)`,
    actionTypes: SB_DEFEND_ACTIONS,
    ranges: sbDefendRange(bbRaiseSet, depth >= 60
      ? {
          'A5o': { '3bet': 0.58, fold: 0.42 },
          'K8o': { '3bet': 0.44, fold: 0.56 },
          'Q9o': { '3bet': 0.36, fold: 0.64 },
          'T8s': { '3bet': 0.4, fold: 0.6 },
        }
      : {
          'A5o': { '3bet': 0.48, fold: 0.52 },
          'K8o': { '3bet': 0.34, fold: 0.66 },
        }),
  });

  return charts;
}

// Backward-compatible flat export (100bb)
export const SB_DEFEND_CHARTS = getSbDefendCharts(100);
