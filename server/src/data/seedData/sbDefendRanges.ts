import { ChartDef, handLabel, inSet, StackDepth } from './helpers';
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

// SB vs MP open
const SB_VS_MP_3BET = new Set([
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
// 25bb ranges — SB is mostly 3bet-all-in or fold, very tight
// ---------------------------------------------------------------------------

// SB vs UTG open at 25bb — only premiums
const SB_25_VS_UTG_3BET = new Set([
  'AA', 'KK',
]);

// SB vs MP open at 25bb
const SB_25_VS_MP_3BET = new Set([
  'AA', 'KK', 'QQ',
]);

// SB vs CO open at 25bb
const SB_25_VS_CO_3BET = new Set([
  'AA', 'KK', 'QQ', 'AKs',
]);

// SB vs BTN open at 25bb
const SB_25_VS_BTN_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo',
]);

// SB vs BB limp at 25bb — wider since BB is weaker
const SB_25_VS_BB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
  'AKs', 'AQs', 'AJs', 'ATs',
  'KQs',
  'AKo', 'AQo', 'AJo',
]);

// 25bb jam sets — hands that jam (all-in) instead of standard 3bet
const SB_25_VS_UTG_JAM = new Set(['QQ', 'AKs', 'AKo']);
const SB_25_VS_MP_JAM = new Set(['JJ', 'AKs', 'AKo', 'AQs']);
const SB_25_VS_CO_JAM = new Set(['JJ', 'TT', 'AKo', 'AQs', 'AQo']);
const SB_25_VS_BTN_JAM = new Set(['TT', '99', 'AQs', 'AQo', 'AJs', 'KQs']);

// ---------------------------------------------------------------------------
// 40bb ranges — ~20-25% tighter 3bet sets than 100bb
// ---------------------------------------------------------------------------

// SB vs UTG at 40bb — drop AKo and one blocker
const SB_40_VS_UTG_3BET = new Set([
  'AA', 'KK', 'QQ', 'AKs',
  'A5s',
]);

// SB vs MP at 40bb — drop JJ and tighten bluffs
const SB_40_VS_MP_3BET = new Set([
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
  'AA', 'KK', 'QQ', 'JJ',
  'AKs', 'AKo', 'AQs', 'AJs',
  'A5s', 'A4s',
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

// SB vs MP at 60bb — drop one blocker
const SB_60_VS_MP_3BET = new Set([
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
  'AKs', 'AKo', 'AQs', 'AQo',
  'A5s', 'A4s', 'A3s',
  'K9s',
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
// Helper
// ---------------------------------------------------------------------------

function sbDefendRange(threeBetSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, fold: 0 };
    return { '3bet': 0, fold: 1.0 };
  };
}

function sbDefendJamRange(threeBetSet: Set<string>, jamSet: Set<string>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, threeBetSet)) return { '3bet': 1.0, allin: 0, fold: 0 };
    if (inSet(h, jamSet)) return { '3bet': 0, allin: 1.0, fold: 0 };
    return { '3bet': 0, allin: 0, fold: 1.0 };
  };
}

// ---------------------------------------------------------------------------
// Depth-based chart builder
// ---------------------------------------------------------------------------

export function getSbDefendCharts(depth: StackDepth): ChartDef[] {
  if (depth === 15) return [];

  type MatchupDef = {
    vsPosition: string;
    threeBetSet: Set<string>;
    description: string;
  };

  let matchups: MatchupDef[];

  switch (depth) {
    case 25:
      return [
        {
          position: 'SB', situation: 'SB Defend', vsPosition: 'UTG', category: 'SB Defend',
          stackDepth: 25 as StackDepth, description: 'SB 3bet/jam vs UTG open (25bb)',
          actionTypes: SB_DEFEND_JAM_ACTIONS,
          ranges: sbDefendJamRange(SB_25_VS_UTG_3BET, SB_25_VS_UTG_JAM),
        },
        {
          position: 'SB', situation: 'SB Defend', vsPosition: 'MP', category: 'SB Defend',
          stackDepth: 25 as StackDepth, description: 'SB 3bet/jam vs MP open (25bb)',
          actionTypes: SB_DEFEND_JAM_ACTIONS,
          ranges: sbDefendJamRange(SB_25_VS_MP_3BET, SB_25_VS_MP_JAM),
        },
        {
          position: 'SB', situation: 'SB Defend', vsPosition: 'CO', category: 'SB Defend',
          stackDepth: 25 as StackDepth, description: 'SB 3bet/jam vs CO open (25bb)',
          actionTypes: SB_DEFEND_JAM_ACTIONS,
          ranges: sbDefendJamRange(SB_25_VS_CO_3BET, SB_25_VS_CO_JAM),
        },
        {
          position: 'SB', situation: 'SB Defend', vsPosition: 'BTN', category: 'SB Defend',
          stackDepth: 25 as StackDepth, description: 'SB 3bet/jam vs BTN open (25bb)',
          actionTypes: SB_DEFEND_JAM_ACTIONS,
          ranges: sbDefendJamRange(SB_25_VS_BTN_3BET, SB_25_VS_BTN_JAM),
        },
        {
          position: 'SB', situation: 'SB Defend', vsPosition: 'BB', category: 'SB Defend',
          stackDepth: 25 as StackDepth, description: 'SB raise vs BB limp (25bb)',
          actionTypes: SB_DEFEND_ACTIONS,
          ranges: sbDefendRange(SB_25_VS_BB_RAISE),
        },
      ];

    case 40:
      matchups = [
        { vsPosition: 'UTG', threeBetSet: SB_40_VS_UTG_3BET, description: `SB 3bet or fold vs UTG open (${depth}bb)` },
        { vsPosition: 'MP',  threeBetSet: SB_40_VS_MP_3BET,  description: `SB 3bet or fold vs MP open (${depth}bb)` },
        { vsPosition: 'CO',  threeBetSet: SB_40_VS_CO_3BET,  description: `SB 3bet or fold vs CO open (${depth}bb)` },
        { vsPosition: 'BTN', threeBetSet: SB_40_VS_BTN_3BET, description: `SB 3bet or fold vs BTN open (${depth}bb)` },
        { vsPosition: 'BB',  threeBetSet: SB_40_VS_BB_RAISE,  description: `SB raise vs BB limp (${depth}bb)` },
      ];
      break;

    case 60:
      matchups = [
        { vsPosition: 'UTG', threeBetSet: SB_60_VS_UTG_3BET, description: `SB 3bet or fold vs UTG open (${depth}bb)` },
        { vsPosition: 'MP',  threeBetSet: SB_60_VS_MP_3BET,  description: `SB 3bet or fold vs MP open (${depth}bb)` },
        { vsPosition: 'CO',  threeBetSet: SB_60_VS_CO_3BET,  description: `SB 3bet or fold vs CO open (${depth}bb)` },
        { vsPosition: 'BTN', threeBetSet: SB_60_VS_BTN_3BET, description: `SB 3bet or fold vs BTN open (${depth}bb)` },
        { vsPosition: 'BB',  threeBetSet: SB_60_VS_BB_RAISE,  description: `SB raise vs BB limp (${depth}bb)` },
      ];
      break;

    case 100:
    default:
      matchups = [
        { vsPosition: 'UTG', threeBetSet: SB_VS_UTG_3BET, description: `SB 3bet or fold vs UTG open (${depth}bb)` },
        { vsPosition: 'MP',  threeBetSet: SB_VS_MP_3BET,  description: `SB 3bet or fold vs MP open (${depth}bb)` },
        { vsPosition: 'CO',  threeBetSet: SB_VS_CO_3BET,  description: `SB 3bet or fold vs CO open (${depth}bb)` },
        { vsPosition: 'BTN', threeBetSet: SB_VS_BTN_3BET, description: `SB 3bet or fold vs BTN open (${depth}bb)` },
        { vsPosition: 'BB',  threeBetSet: SB_VS_BB_RAISE,  description: `SB raise vs BB limp (${depth}bb)` },
      ];
      break;
  }

  return matchups.map((m) => ({
    position: 'SB',
    situation: 'SB Defend',
    vsPosition: m.vsPosition,
    category: 'SB Defend',
    stackDepth: depth,
    description: m.description,
    actionTypes: SB_DEFEND_ACTIONS,
    ranges: sbDefendRange(m.threeBetSet),
  }));
}

// Backward-compatible flat export (100bb)
export const SB_DEFEND_CHARTS = getSbDefendCharts(100);
