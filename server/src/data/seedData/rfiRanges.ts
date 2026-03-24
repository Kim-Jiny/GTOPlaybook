import { ChartDef, handLabel, inSet, StackDepth } from './helpers';
import { RFI_ACTIONS, RFI_JAM_ACTIONS } from './actionColors';

// ─── 100bb ranges (original, unchanged) ────────────────────────────

// UTG RFI — very tight (~15%)
const UTG_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs',
  'AKo', 'AQo',
]);
const UTG_MIXED: Record<string, number> = { '88': 0.75, 'A9s': 0.6, 'KTs': 0.5, 'T9s': 0.4, 'AJo': 0.6 };

// MP RFI — slightly wider (~19%)
const MP_RAISE = new Set([
  ...UTG_RAISE,
  '88', '77', 'A9s', 'KTs', 'QTs', 'JTs', 'T9s', '98s',
  'AJo', 'KQo',
]);
const MP_MIXED: Record<string, number> = { '66': 0.8, 'A8s': 0.6, 'K9s': 0.5, 'Q9s': 0.4, '87s': 0.4, 'ATo': 0.65, 'KJo': 0.55 };

// CO RFI — wide (~27%)
const CO_RAISE = new Set([
  ...MP_RAISE,
  '66', '55', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'K9s', 'Q9s', 'J9s', 'T9s', '98s', '87s', '76s', '65s',
  'ATo', 'KJo', 'KTo', 'QJo',
]);
const CO_MIXED: Record<string, number> = { '44': 0.8, '33': 0.6, 'K8s': 0.5, 'Q8s': 0.45, 'J8s': 0.4, '86s': 0.4, '75s': 0.35, 'QTo': 0.6, 'JTo': 0.5 };

// BTN RFI — very wide (~43%)
const BTN_RAISE = new Set([
  ...CO_RAISE,
  '44', '33', '22',
  'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s',
  'Q8s', 'J8s', 'T8s', '97s', '86s', '75s', '64s', '54s',
  'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KTo', 'KJo', 'QJo', 'QTo', 'JTo', 'J9o', 'T9o',
]);
const BTN_MIXED: Record<string, number> = { 'K2s': 0.5, 'Q7s': 0.5, 'J7s': 0.45, 'T7s': 0.4, '96s': 0.45, '85s': 0.4, '74s': 0.35, '53s': 0.35, 'A4o': 0.7, 'A3o': 0.6, 'K9o': 0.55, 'Q9o': 0.45 };

// SB RFI — open-raise or fold (wide ~40%)
const SB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KQo', 'KJo', 'KTo', 'K9o',
  'QJo', 'QTo', 'JTo', 'J9o', 'T9o',
]);
const SB_MIXED: Record<string, number> = { '33': 0.7, '22': 0.5, 'K4s': 0.5, 'Q7s': 0.45, 'J7s': 0.4, 'T7s': 0.4, '96s': 0.4, '85s': 0.35, 'A4o': 0.65, 'A3o': 0.55, 'K8o': 0.5, 'Q9o': 0.45 };

// ─── 25bb ranges (tight push/fold-adjacent) ────────────────────────

// UTG 25bb — only premiums, no mixed
const UTG_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs',
  'AKo',
]);
const UTG_25_MIXED: Record<string, number> = {};

// MP 25bb — UTG premiums + a few broadways
const MP_25_RAISE = new Set([
  ...UTG_25_RAISE,
  '88', '77',
  'AJs', 'KQs',
]);
const MP_25_MIXED: Record<string, number> = {};

// CO 25bb — roughly MP 100bb pure raise set
const CO_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
  'AKo', 'AQo', 'AJo', 'KQo',
]);
const CO_25_MIXED: Record<string, number> = {};

// BTN 25bb — roughly CO 100bb pure raise set
const BTN_25_RAISE = new Set([
  ...CO_25_RAISE,
  '66', '55',
  'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'K9s', 'Q9s', 'J9s', '87s', '76s', '65s',
  'ATo', 'KJo', 'KTo', 'QJo',
]);
const BTN_25_MIXED: Record<string, number> = {};

// SB 25bb — roughly BTN 100bb but narrower, no mixed
const SB_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '65s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
  'KQo', 'KJo', 'KTo',
  'QJo', 'QTo', 'JTo',
]);
const SB_25_MIXED: Record<string, number> = {};

// ─── 40bb ranges — 100bb pure raise set, mixed tightened by ~30% ───

// 40bb mixed — entries that overlap with jam sets removed (jam takes priority)
const UTG_40_MIXED: Record<string, number> = { '88': 0.53, 'T9s': 0.28, 'AJo': 0.42 };
const MP_40_MIXED: Record<string, number> = { '66': 0.56, 'Q9s': 0.28, 'ATo': 0.46, 'KJo': 0.39 };
const CO_40_MIXED: Record<string, number> = { 'J8s': 0.28, 'QTo': 0.42, 'JTo': 0.35 };
const BTN_40_MIXED: Record<string, number> = { 'K2s': 0.35, 'A4o': 0.49, 'A3o': 0.42, 'K9o': 0.39, 'Q9o': 0.32 };
const SB_40_MIXED: Record<string, number> = { 'K4s': 0.35, 'A4o': 0.46, 'A3o': 0.39, 'K8o': 0.35, 'Q9o': 0.32 };

// ─── 60bb ranges — 100bb pure raise set, mixed tightened by ~15% ───

const UTG_60_MIXED: Record<string, number> = { '88': 0.64, 'A9s': 0.51, 'KTs': 0.43, 'T9s': 0.34, 'AJo': 0.51 };
const MP_60_MIXED: Record<string, number> = { '66': 0.68, 'A8s': 0.51, 'K9s': 0.43, 'Q9s': 0.34, '87s': 0.34, 'ATo': 0.55, 'KJo': 0.47 };
const CO_60_MIXED: Record<string, number> = { '44': 0.68, '33': 0.51, 'K8s': 0.43, 'Q8s': 0.38, 'J8s': 0.34, '86s': 0.34, '75s': 0.30, 'QTo': 0.51, 'JTo': 0.43 };
const BTN_60_MIXED: Record<string, number> = { 'K2s': 0.43, 'Q7s': 0.43, 'J7s': 0.38, 'T7s': 0.34, '96s': 0.38, '85s': 0.34, '74s': 0.30, '53s': 0.30, 'A4o': 0.60, 'A3o': 0.51, 'K9o': 0.47, 'Q9o': 0.38 };
const SB_60_MIXED: Record<string, number> = { '33': 0.60, '22': 0.43, 'K4s': 0.43, 'Q7s': 0.38, 'J7s': 0.34, 'T7s': 0.34, '96s': 0.34, '85s': 0.30, 'A4o': 0.55, 'A3o': 0.47, 'K8o': 0.43, 'Q9o': 0.38 };

// ─── 25bb jam sets (hands that open-jam instead of raise) ───────────

const UTG_25_JAM = new Set(['99', '88', 'AJs', 'ATs', 'KQs']);
const MP_25_JAM = new Set(['66', '55', 'ATs', 'A9s', 'KJs', 'QJs', 'JTs']);
const CO_25_JAM = new Set([
  '66', '55', '44',
  'A8s', 'A7s', 'A6s', 'A5s', 'A4s',
  'K9s', 'Q9s', 'J9s', '87s', '76s',
  'ATo', 'KJo',
]);
const BTN_25_JAM = new Set([
  '44', '33', '22',
  'K8s', 'K7s', 'K6s', 'Q8s', 'J8s', 'T8s', '97s', '86s', '54s',
  'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KTo', 'QTo', 'JTo',
]);
const SB_25_JAM = new Set([
  '33', '22',
  'K5s', 'K4s', 'Q7s', 'J7s', 'T7s', '96s', '85s', '75s', '64s', '53s',
  'A7o', 'A6o', 'A5o', 'A4o',
  'K9o', 'K8o', 'Q9o', 'Q8o',
]);

// ─── 40bb jam sets (fewer hands jam at 40bb) ────────────────────────

const UTG_40_JAM = new Set(['A9s', 'KTs']);
const MP_40_JAM = new Set(['A8s', 'K9s', '87s']);
const CO_40_JAM = new Set(['44', '33', 'K8s', 'Q8s', '86s', '75s']);
const BTN_40_JAM = new Set(['Q7s', 'J7s', 'T7s', '96s', '85s', '74s', '53s']);
const SB_40_JAM = new Set(['33', '22', 'Q7s', 'J7s', 'T7s', '96s', '85s']);

// ─── Helpers ────────────────────────────────────────────────────────

function rfiRange(raiseSet: Set<string>, mixedMap: Record<string, number>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, raiseSet)) return { raise: 1.0, fold: 0 };
    if (h in mixedMap) { const f = mixedMap[h]; return { raise: f, fold: 1 - f }; }
    return { raise: 0, fold: 1.0 };
  };
}

function rfiJamRange(raiseSet: Set<string>, jamSet: Set<string>, mixedMap: Record<string, number>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (inSet(h, raiseSet)) return { raise: 1.0, allin: 0, fold: 0 };
    if (inSet(h, jamSet)) return { raise: 0, allin: 1.0, fold: 0 };
    if (h in mixedMap) { const f = mixedMap[h]; return { raise: f, allin: 0, fold: 1 - f }; }
    return { raise: 0, allin: 0, fold: 1.0 };
  };
}

// ─── Depth-based chart builder ──────────────────────────────────────

export function getRfiCharts(depth: StackDepth): ChartDef[] {
  if (depth === 15) return [];

  type PositionDef = {
    position: string;
    raise: Set<string>;
    jam?: Set<string>;
    mixed: Record<string, number>;
  };

  let positions: PositionDef[];
  let useJam = false;

  switch (depth) {
    case 25:
      useJam = true;
      positions = [
        { position: 'UTG', raise: UTG_25_RAISE, jam: UTG_25_JAM, mixed: UTG_25_MIXED },
        { position: 'MP',  raise: MP_25_RAISE,  jam: MP_25_JAM,  mixed: MP_25_MIXED },
        { position: 'CO',  raise: CO_25_RAISE,  jam: CO_25_JAM,  mixed: CO_25_MIXED },
        { position: 'BTN', raise: BTN_25_RAISE, jam: BTN_25_JAM, mixed: BTN_25_MIXED },
        { position: 'SB',  raise: SB_25_RAISE,  jam: SB_25_JAM,  mixed: SB_25_MIXED },
      ];
      break;

    case 40:
      useJam = true;
      positions = [
        { position: 'UTG', raise: UTG_RAISE, jam: UTG_40_JAM, mixed: UTG_40_MIXED },
        { position: 'MP',  raise: MP_RAISE,  jam: MP_40_JAM,  mixed: MP_40_MIXED },
        { position: 'CO',  raise: CO_RAISE,  jam: CO_40_JAM,  mixed: CO_40_MIXED },
        { position: 'BTN', raise: BTN_RAISE, jam: BTN_40_JAM, mixed: BTN_40_MIXED },
        { position: 'SB',  raise: SB_RAISE,  jam: SB_40_JAM,  mixed: SB_40_MIXED },
      ];
      break;

    case 60:
      positions = [
        { position: 'UTG', raise: UTG_RAISE, mixed: UTG_60_MIXED },
        { position: 'MP',  raise: MP_RAISE,  mixed: MP_60_MIXED },
        { position: 'CO',  raise: CO_RAISE,  mixed: CO_60_MIXED },
        { position: 'BTN', raise: BTN_RAISE, mixed: BTN_60_MIXED },
        { position: 'SB',  raise: SB_RAISE,  mixed: SB_60_MIXED },
      ];
      break;

    case 100:
    default:
      positions = [
        { position: 'UTG', raise: UTG_RAISE, mixed: UTG_MIXED },
        { position: 'MP',  raise: MP_RAISE,  mixed: MP_MIXED },
        { position: 'CO',  raise: CO_RAISE,  mixed: CO_MIXED },
        { position: 'BTN', raise: BTN_RAISE, mixed: BTN_MIXED },
        { position: 'SB',  raise: SB_RAISE,  mixed: SB_MIXED },
      ];
      break;
  }

  return positions.map((p) => ({
    position: p.position,
    situation: 'RFI',
    category: 'RFI',
    stackDepth: depth,
    description: `${p.position} Raise First In (${depth}bb)`,
    actionTypes: useJam ? RFI_JAM_ACTIONS : RFI_ACTIONS,
    ranges: useJam && p.jam
      ? rfiJamRange(p.raise, p.jam, p.mixed)
      : rfiRange(p.raise, p.mixed),
  }));
}

// Backward-compatible flat export (100bb)
export const RFI_CHARTS = getRfiCharts(100);
