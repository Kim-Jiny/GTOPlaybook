import { ChartDef, handLabel, inSet, smoothFrequencies, StackDepth, MaxPlayers, rfiPositions } from './helpers';
import { RFI_ACTIONS, RFI_JAM_ACTIONS } from './actionColors';

// ═══════════════════════════════════════════════════════════════════════
//  100bb ranges
// ═══════════════════════════════════════════════════════════════════════

// ─── UTG (6-max) / MP (7+) — ~15% ───────────────────────────────────

const UTG_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'JTs',
  'AKo', 'AQo',
]);
const UTG_MIXED: Record<string, number> = {
  '88': 0.75,
  'A9s': 0.58,
  'KTs': 0.42,
  'QJs': 0.55,
  'T9s': 0.34,
  'AJo': 0.52,
};

// ─── HJ (was "MP" in 6-max) — ~19% ──────────────────────────────────

const HJ_RAISE = new Set([
  ...UTG_RAISE,
  '88', '77', 'A9s', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
  'AJo',
]);
const HJ_MIXED: Record<string, number> = {
  '66': 0.76,
  'A8s': 0.58,
  'K9s': 0.46,
  'Q9s': 0.36,
  '87s': 0.32,
  'ATo': 0.58,
  'KJo': 0.48,
  'KQo': 0.82,
};

// ─── CO — ~27% ──────────────────────────────────────────────────────

const CO_RAISE = new Set([
  ...HJ_RAISE,
  '66', '55', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'K9s', 'Q9s', 'J9s', 'T9s', '98s', '87s', '76s',
  'ATo', 'KJo', 'QJo', 'KQo',
]);
const CO_MIXED: Record<string, number> = {
  '44': 0.76,
  '33': 0.54,
  'K8s': 0.44,
  'Q8s': 0.38,
  'J8s': 0.32,
  '86s': 0.28,
  '75s': 0.24,
  '65s': 0.72,
  'KTo': 0.62,
  'QTo': 0.5,
  'JTo': 0.42,
};

// ─── BTN — ~43% ─────────────────────────────────────────────────────

const BTN_RAISE = new Set([
  ...CO_RAISE,
  '44', '33', '22',
  'K8s', 'K7s', 'K6s', 'K5s',
  'Q8s', 'J8s', 'T8s', '97s', '86s', '75s', '65s', '64s', '54s',
  'A9o', 'A8o', 'A7o', 'A6o',
  'KJo', 'QJo', 'JTo',
]);
const BTN_MIXED: Record<string, number> = {
  'K4s': 0.72,
  'K3s': 0.56,
  'K2s': 0.42,
  'Q7s': 0.44,
  'J7s': 0.38,
  'T7s': 0.32,
  '96s': 0.38,
  '85s': 0.32,
  '74s': 0.24,
  '53s': 0.22,
  'A5o': 0.82,
  'A4o': 0.62,
  'A3o': 0.48,
  'KTo': 0.76,
  'K9o': 0.44,
  'QTo': 0.66,
  'Q9o': 0.34,
  'J9o': 0.52,
  'T9o': 0.72,
};

// ─── SB (multiway, 3+ players) — ~42% ──────────────────────────────

const SB_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KQo', 'KJo', 'KTo', 'K9o',
  'QJo', 'QTo', 'JTo', 'T9o',
]);
const SB_MIXED: Record<string, number> = {
  '33': 0.58,
  '22': 0.38,
  'K4s': 0.62,
  'Q7s': 0.42,
  'J7s': 0.34,
  'T7s': 0.3,
  '96s': 0.3,
  '85s': 0.24,
  'A4o': 0.58,
  'A3o': 0.44,
  'K8o': 0.42,
  'Q9o': 0.34,
  'J9o': 0.58,
};

// ─── UTG 9-max (~11% - very tight) ─────────────────────────────────

const UTG_9MAX_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'JTs',
  'AKo', 'AQo',
]);
const UTG_9MAX_MIXED: Record<string, number> = { '88': 0.5, 'KJs': 0.5, 'T9s': 0.3 };

// ─── UTG+1 (~12%) ──────────────────────────────────────────────────

const UTG1_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'JTs',
  'AKo', 'AQo',
]);
const UTG1_MIXED: Record<string, number> = { '88': 0.6, 'KTs': 0.4, 'QJs': 0.35, 'T9s': 0.35, 'AJo': 0.4 };

// ─── UTG+2 (~13%) ──────────────────────────────────────────────────

const UTG2_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs',
  'AKo', 'AQo',
]);
const UTG2_MIXED: Record<string, number> = { '77': 0.6, 'A9s': 0.45, 'KTs': 0.45, 'T9s': 0.35, 'AJo': 0.5 };

// ─── HU SB (~78% - very wide) ──────────────────────────────────────

const HU_SB_RAISE = new Set([
  // All pocket pairs
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  // All suited Ax
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  // All suited Kx
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  // All suited Qx
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  // All suited Jx
  'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
  // Suited Tx down to T3s
  'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s',
  // Suited 9x down to 93s
  '98s', '97s', '96s', '95s', '94s', '93s',
  // Suited 8x down to 82s
  '87s', '86s', '85s', '84s', '83s', '82s',
  // Suited 7x down to 72s
  '76s', '75s', '74s', '73s', '72s',
  // Suited 6x down to 62s
  '65s', '64s', '63s', '62s',
  // Low suited
  '54s', '53s', '52s', '43s', '42s', '32s',
  // Offsuit Ax all
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  // Offsuit Kx down to K2o
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
  // Offsuit Qx down to Q3o
  'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o',
  // Offsuit Jx down to J4o
  'JTo', 'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o',
  // Offsuit Tx down to T5o
  'T9o', 'T8o', 'T7o', 'T6o', 'T5o',
  // Offsuit 9x down to 95o
  '98o', '97o', '96o', '95o',
  // Offsuit 8x down to 85o
  '87o', '86o', '85o',
  // Offsuit 7x down to 74o
  '76o', '75o', '74o',
  // Offsuit 6x
  '65o', '64o',
  // Offsuit 5x
  '54o', '53o',
]);
const HU_SB_MIXED: Record<string, number> = {
  'Q2o': 0.35, 'J3o': 0.3, 'T4o': 0.28, '94o': 0.22, '84o': 0.2, '73o': 0.2, '63o': 0.18, '52o': 0.15, '43o': 0.15,
};

// ═══════════════════════════════════════════════════════════════════════
//  25bb ranges (tight push/fold-adjacent)
// ═══════════════════════════════════════════════════════════════════════

// UTG 25bb — only premiums
const UTG_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs', 'AKo', 'AQo',
]);
const UTG_25_MIXED: Record<string, number> = { '99': 0.42, 'AJs': 0.36, 'KQs': 0.28 };

// HJ 25bb (was MP) — UTG premiums + a few broadways
const HJ_25_RAISE = new Set([
  ...UTG_25_RAISE,
  '99', '88', '77',
  'AJs', 'KQs', 'AQo',
]);
const HJ_25_MIXED: Record<string, number> = { '66': 0.48, 'ATs': 0.44, 'KJs': 0.38, 'QJs': 0.3, 'AJo': 0.42 };

// CO 25bb
const CO_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
  'KQs', 'JTs', 'T9s', '98s',
  'AKo', 'AQo',
]);
const CO_25_MIXED: Record<string, number> = {
  '66': 0.52,
  '55': 0.34,
  'A8s': 0.44,
  'A7s': 0.32,
  'KJs': 0.72,
  'KTs': 0.54,
  'QJs': 0.66,
  'QTs': 0.46,
  'AJo': 0.7,
  'KQo': 0.58,
};

// BTN 25bb
const BTN_25_RAISE = new Set([
  ...CO_25_RAISE,
  '66',
  'A8s', 'A7s', 'A6s', 'A3s', 'A2s',
  '76s', '65s',
]);
const BTN_25_MIXED: Record<string, number> = {
  '55': 0.52,
  '44': 0.32,
  'A5s': 0.62,
  'A4s': 0.48,
  'K9s': 0.42,
  'Q9s': 0.34,
  'J9s': 0.28,
  '87s': 0.34,
  'ATo': 0.64,
  'KJo': 0.54,
  'KTo': 0.42,
  'QJo': 0.46,
};

// SB 25bb (multiway)
const SB_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K7s', 'K6s',
  'QJs', 'QTs', 'Q9s',
  'JTs', 'J9s', 'T9s', '98s', '97s', '87s', '86s', '76s', '65s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
  'KQo', 'KTo',
  'QJo',
]);
const SB_25_MIXED: Record<string, number> = {
  '44': 0.56,
  '33': 0.38,
  'A5s': 0.68,
  'A4s': 0.52,
  'K8s': 0.44,
  'Q8s': 0.36,
  'T8s': 0.32,
  'A8o': 0.64,
  'KJo': 0.58,
  'QTo': 0.48,
  'JTo': 0.38,
};

// UTG 9-max 25bb — very tight
const UTG_9MAX_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ',
  'AKs',
  'AKo', 'AQo',
]);
const UTG_9MAX_25_MIXED: Record<string, number> = { '99': 0.34, 'AJs': 0.28, 'KQs': 0.22 };

// UTG+1 25bb
const UTG1_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs',
  'AKo', 'AQo',
]);
const UTG1_25_MIXED: Record<string, number> = { '99': 0.42, 'AJs': 0.32, 'KQs': 0.26 };

// UTG+2 25bb
const UTG2_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs',
  'AKo', 'AQo',
]);
const UTG2_25_MIXED: Record<string, number> = { '88': 0.42, 'ATs': 0.34, 'AJo': 0.3 };

// HU SB 25bb — very wide push/fold
const HU_SB_25_RAISE = new Set([
  ...SB_25_RAISE,
  '44', '33', '22',
  'A5s', 'A4s',
  'K8s', 'K5s', 'K4s', 'K3s', 'K2s',
  'Q8s', 'Q7s', 'Q6s', 'Q5s',
  'J7s', 'J6s',
  'T8s', 'T7s', 'T6s',
  '96s', '95s',
  '85s', '84s',
  '75s', '74s',
  '64s', '63s',
  '53s', '43s',
  'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KJo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o',
  'QTo', 'Q9o', 'Q8o',
  'JTo', 'J9o', 'J8o',
  'T9o', 'T8o',
  '98o', '87o',
]);
const HU_SB_25_MIXED: Record<string, number> = {};

// ═══════════════════════════════════════════════════════════════════════
//  25bb jam sets (hands that open-jam instead of raise)
// ═══════════════════════════════════════════════════════════════════════

const UTG_25_JAM = new Set(['88', 'ATs']);
const HJ_25_JAM = new Set(['55', 'A9s', 'JTs']);
const CO_25_JAM = new Set([
  '44',
  'A6s', 'A5s', 'A4s',
  'Q9s', 'J9s', '87s', '76s',
  'ATo',
]);
const BTN_25_JAM = new Set([
  '33', '22',
  'K7s', 'K6s', 'Q8s', 'J8s', 'T8s', '97s', '86s', '54s',
  'A8o', 'A7o', 'A6o', 'A5o',
  'QTo', 'JTo',
]);
const SB_25_JAM = new Set([
  '22',
  'K5s', 'K4s', 'Q7s', 'J7s', 'T7s', '96s', '85s', '75s', '64s', '53s',
  'A7o', 'A6o', 'A5o', 'A4o',
  'K8o', 'Q8o',
]);

const UTG_9MAX_25_JAM = new Set(['TT', '99', 'AQs', 'AJs']);
const UTG1_25_JAM = new Set(['99', '88', 'AQs', 'AJs', 'KQs']);
const UTG2_25_JAM = new Set(['99', '88', 'AJs', 'ATs', 'KQs']);

const HU_SB_25_JAM = new Set([
  'Q4s', 'Q3s', 'Q2s',
  'J5s', 'J4s', 'J3s',
  'T5s', 'T4s',
  '94s', '93s',
  '83s', '82s',
  '73s', '72s',
  '62s', '52s', '42s',
  'K4o', 'K3o', 'K2o',
  'Q7o', 'Q6o', 'Q5o',
  'J7o', 'J6o',
  'T7o', 'T6o',
  '97o', '96o',
  '86o', '76o', '65o',
]);

// ═══════════════════════════════════════════════════════════════════════
//  15bb ranges — mostly open-jam, only premiums min-raise (trap)
// ═══════════════════════════════════════════════════════════════════════

const UTG_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'AKs', 'AKo',
]);
const UTG_15_JAM = new Set([
  'JJ', 'TT', '99',
  'AQs', 'AJs', 'ATs', 'KQs',
  'AQo',
]);

const HJ_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo',
]);
const HJ_15_JAM = new Set([
  'TT', '99', '88',
  'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'QTs',
  'AQo', 'AJo',
]);

const CO_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs', 'AJs', 'AKo', 'AQo',
  'KQs',
]);
const CO_15_JAM = new Set([
  '99', '88', '77', '66',
  'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s',
  'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
  'AJo', 'ATo', 'KQo', 'KJo',
]);

const BTN_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'AKo', 'AQo', 'AJo',
  'KQs', 'KJs', 'QJs',
]);
const BTN_15_JAM = new Set([
  '88', '77', '66', '55', '44', '33', '22',
  'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
  'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
  'ATo', 'A9o', 'A8o', 'A7o',
  'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
]);

const SB_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
  'AKo', 'AQo', 'AJo',
  'KQs', 'KJs', 'QJs',
]);
const SB_15_JAM = new Set([
  '88', '77', '66', '55', '44', '33', '22',
  'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
  'QTs', 'Q9s', 'Q8s', 'Q7s',
  'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '85s', '76s', '75s', '65s', '64s', '54s', '53s',
  'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o',
]);

const UTG_9MAX_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'AKs', 'AKo',
]);
const UTG_9MAX_15_JAM = new Set([
  'JJ', 'TT',
  'AQs', 'AJs',
  'AQo',
]);

const UTG1_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'AKs', 'AQs', 'AKo',
]);
const UTG1_15_JAM = new Set([
  'JJ', 'TT', '99',
  'AJs',
  'AQo',
]);

const UTG2_15_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo',
]);
const UTG2_15_JAM = new Set([
  'TT', '99',
  'AJs', 'ATs', 'KQs',
  'AQo',
]);

const HU_SB_15_RAISE = new Set(['AA', 'KK']);
const HU_SB_15_JAM = new Set([
  'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s',
  'T9s', 'T8s', 'T7s', 'T6s', 'T5s',
  '98s', '97s', '96s', '95s', '94s',
  '87s', '86s', '85s', '84s', '83s',
  '76s', '75s', '74s', '73s',
  '65s', '64s', '63s', '62s',
  '54s', '53s', '52s', '43s', '42s', '32s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o',
  'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o',
  'JTo', 'J9o', 'J8o', 'J7o',
  'T9o', 'T8o', 'T7o',
  '98o', '97o',
  '87o', '86o',
  '76o', '75o',
  '65o', '64o',
  '54o', '53o',
]);

// ═══════════════════════════════════════════════════════════════════════
//  40bb ranges — 100bb pure raise set, mixed tightened by ~30%
// ═══════════════════════════════════════════════════════════════════════

const UTG_40_MIXED: Record<string, number> = { '88': 0.53, 'QJs': 0.46, 'T9s': 0.24, 'AJo': 0.38 };
const HJ_40_MIXED: Record<string, number> = { '66': 0.52, 'Q9s': 0.24, 'ATo': 0.42, 'KJo': 0.34, 'KQo': 0.74 };
const CO_40_MIXED: Record<string, number> = { '44': 0.58, 'KTo': 0.52, 'J8s': 0.24, 'QTo': 0.36, 'JTo': 0.3 };
const BTN_40_MIXED: Record<string, number> = { 'K4s': 0.58, 'K3s': 0.42, 'K2s': 0.28, 'A5o': 0.7, 'A4o': 0.42, 'A3o': 0.34, 'KTo': 0.64, 'K9o': 0.33, 'QTo': 0.54, 'Q9o': 0.24 };
const SB_40_MIXED: Record<string, number> = { '44': 0.62, 'K5s': 0.68, 'K4s': 0.3, 'A5o': 0.74, 'A4o': 0.4, 'A3o': 0.32, 'K9o': 0.6, 'K8o': 0.3, 'QTo': 0.58, 'Q9o': 0.24 };

const UTG_9MAX_40_MIXED: Record<string, number> = { '88': 0.4, 'T9s': 0.2 };
const UTG1_40_MIXED: Record<string, number> = { '88': 0.45, 'T9s': 0.25, 'AJo': 0.35 };
const UTG2_40_MIXED: Record<string, number> = { '88': 0.5, 'T9s': 0.25, 'AJo': 0.4 };

// HU SB at 40bb uses the wide 100bb HU raise set with mixed tightened
const HU_SB_40_MIXED: Record<string, number> = { 'K4o': 0.42, 'K3o': 0.35, 'Q7o': 0.35, 'J7o': 0.28, 'T7o': 0.25, '97o': 0.21, '76o': 0.21 };

// ─── 40bb jam sets ──────────────────────────────────────────────────

const UTG_40_JAM = new Set(['A9s', 'KTs']);
const HJ_40_JAM = new Set(['A8s', 'K9s', '87s']);
const CO_40_JAM = new Set(['33', 'K8s', 'Q8s', '86s', '75s']);
const BTN_40_JAM = new Set(['Q7s', 'J7s', 'T7s', '96s', '85s', '74s', '53s']);
const SB_40_JAM = new Set(['33', '22', 'Q7s', 'J7s', 'T7s', '96s', '85s']);

const UTG_9MAX_40_JAM = new Set(['A9s', 'KTs']);
const UTG1_40_JAM = new Set(['A9s', 'KTs']);
const UTG2_40_JAM = new Set(['A9s', 'KTs', 'KJs']);

const HU_SB_40_JAM = new Set([
  'J4s', 'T5s', '94s', '83s', '72s', '62s',
]);

// ═══════════════════════════════════════════════════════════════════════
//  60bb ranges — 100bb pure raise set, mixed tightened by ~15%
// ═══════════════════════════════════════════════════════════════════════

const UTG_60_MIXED: Record<string, number> = { '88': 0.64, 'A9s': 0.49, 'KTs': 0.39, 'QJs': 0.5, 'T9s': 0.3, 'AJo': 0.47 };
const HJ_60_MIXED: Record<string, number> = { '66': 0.66, 'A8s': 0.49, 'K9s': 0.39, 'Q9s': 0.3, '87s': 0.28, 'ATo': 0.51, 'KJo': 0.42, 'KQo': 0.78 };
const CO_60_MIXED: Record<string, number> = { '44': 0.66, '33': 0.47, 'K8s': 0.39, 'Q8s': 0.34, 'J8s': 0.3, '86s': 0.28, '75s': 0.24, '65s': 0.64, 'KTo': 0.56, 'QTo': 0.47, 'JTo': 0.39 };
const BTN_60_MIXED: Record<string, number> = { 'K4s': 0.66, 'K3s': 0.5, 'K2s': 0.36, 'Q7s': 0.39, 'J7s': 0.34, 'T7s': 0.3, '96s': 0.34, '85s': 0.28, '74s': 0.24, '53s': 0.22, 'A5o': 0.76, 'A4o': 0.54, 'A3o': 0.45, 'KTo': 0.7, 'K9o': 0.42, 'QTo': 0.6, 'Q9o': 0.32, 'J9o': 0.46, 'T9o': 0.66 };
const SB_60_MIXED: Record<string, number> = { '44': 0.7, '33': 0.56, '22': 0.38, 'K5s': 0.76, 'K4s': 0.38, 'Q8s': 0.68, 'Q7s': 0.34, 'J8s': 0.64, 'J7s': 0.3, 'T8s': 0.6, 'T7s': 0.28, '96s': 0.28, '85s': 0.24, 'A5o': 0.8, 'A4o': 0.5, 'A3o': 0.42, 'K9o': 0.66, 'K8o': 0.38, 'QTo': 0.64, 'Q9o': 0.32, 'J9o': 0.5, 'T9o': 0.7 };

const UTG_9MAX_60_MIXED: Record<string, number> = { '88': 0.45, 'KJs': 0.4, 'T9s': 0.25 };
const UTG1_60_MIXED: Record<string, number> = { '88': 0.55, 'A9s': 0.4, 'KTs': 0.35, 'T9s': 0.3 };
const UTG2_60_MIXED: Record<string, number> = { '77': 0.5, 'A9s': 0.45, 'KTs': 0.4, 'T9s': 0.3, 'AJo': 0.45 };

// HU SB at 60bb uses 100bb HU raise set with mixed tightened slightly
const HU_SB_60_MIXED: Record<string, number> = { 'J4s': 0.43, 'T5s': 0.43, '94s': 0.34, '83s': 0.34, '72s': 0.26, '62s': 0.26, 'K4o': 0.51, 'K3o': 0.43, 'Q7o': 0.43, 'J7o': 0.34, 'T7o': 0.30, '97o': 0.26, '76o': 0.26 };

// ═══════════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════════

function rfiRange(raiseSet: Set<string>, mixedMap: Record<string, number>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (h in mixedMap) { const f = mixedMap[h]; return { raise: f, fold: 1 - f }; }
    const currentKey = inSet(h, raiseSet) ? 'raise' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [{ key: 'raise', set: raiseSet }]);
    if (smooth) return smooth;
    if (inSet(h, raiseSet)) return { raise: 1.0, fold: 0 };
    return { raise: 0, fold: 1.0 };
  };
}

function rfiJamRange(raiseSet: Set<string>, jamSet: Set<string>, mixedMap: Record<string, number>) {
  return (row: number, col: number) => {
    const h = handLabel(row, col);
    if (h in mixedMap) { const f = mixedMap[h]; return { raise: f, allin: 0, fold: 1 - f }; }
    const currentKey = inSet(h, jamSet) ? 'allin' : inSet(h, raiseSet) ? 'raise' : 'fold';
    const smooth = smoothFrequencies(row, col, currentKey, [
      { key: 'raise', set: raiseSet },
      { key: 'allin', set: jamSet },
    ], 0.88, 0.1);
    if (smooth) return smooth;
    if (inSet(h, raiseSet)) return { raise: 1.0, allin: 0, fold: 0 };
    if (inSet(h, jamSet)) return { raise: 0, allin: 1.0, fold: 0 };
    return { raise: 0, allin: 0, fold: 1.0 };
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  Position → range-data mapping per depth
// ═══════════════════════════════════════════════════════════════════════

type RangeData = {
  raise: Set<string>;
  jam?: Set<string>;
  mixed: Record<string, number>;
};

/**
 * Return the correct range data for a given position / depth / maxPlayers.
 *
 * Position mapping:
 *  - 'SB'    at maxPlayers=2   → HU_SB data
 *  - 'SB'    at maxPlayers>2   → regular SB data
 *  - 'BTN'                     → BTN data
 *  - 'CO'                      → CO data
 *  - 'HJ'                      → HJ data (was "MP" in old 6-max file)
 *  - 'UTG'   at maxPlayers<=6  → UTG data (original 6-max UTG)
 *  - 'MP'    at 7-max          → UTG data
 *  - 'MP'    at 8-9max         → UTG+2 data
 *  - 'UTG'   at maxPlayers>=7  → UTG_9MAX data (~11%)
 *  - 'UTG+1'                   → UTG1 data (~12%)
 *  - 'UTG+2'                   → UTG2 data (~13%)
 */
function rangeDataFor(position: string, depth: StackDepth, maxPlayers: MaxPlayers): RangeData {
  // Determine the "range key" based on position + maxPlayers
  const key = resolveRangeKey(position, maxPlayers);

  switch (depth) {
    case 15: return rangeData15(key);
    case 25: return rangeData25(key);
    case 40: return rangeData40(key);
    case 60: return rangeData60(key);
    case 100:
    default: return rangeData100(key);
  }
}

type RangeKey = 'utg9max' | 'utg1' | 'utg2' | 'utg' | 'hj' | 'co' | 'btn' | 'sb' | 'hu_sb';

function resolveRangeKey(position: string, maxPlayers: MaxPlayers): RangeKey {
  if (position === 'SB' && maxPlayers === 2) return 'hu_sb';
  if (position === 'SB') return 'sb';
  if (position === 'BTN') return 'btn';
  if (position === 'CO') return 'co';
  if (position === 'HJ') return 'hj';
  if (position === 'MP' && maxPlayers >= 8) return 'utg2';
  if (position === 'MP') return 'utg';
  if (position === 'UTG' && maxPlayers >= 7) return 'utg9max';
  if (position === 'UTG') return 'utg';          // UTG at 6-max or fewer
  if (position === 'UTG+1') return 'utg1';
  if (position === 'UTG+2') return 'utg2';
  return 'utg'; // fallback
}

function rangeData15(key: RangeKey): RangeData {
  switch (key) {
    case 'utg9max': return { raise: UTG_9MAX_15_RAISE, jam: UTG_9MAX_15_JAM, mixed: {} };
    case 'utg1':    return { raise: UTG1_15_RAISE,     jam: UTG1_15_JAM,     mixed: {} };
    case 'utg2':    return { raise: UTG2_15_RAISE,     jam: UTG2_15_JAM,     mixed: {} };
    case 'utg':     return { raise: UTG_15_RAISE,      jam: UTG_15_JAM,      mixed: {} };
    case 'hj':      return { raise: HJ_15_RAISE,       jam: HJ_15_JAM,       mixed: {} };
    case 'co':      return { raise: CO_15_RAISE,       jam: CO_15_JAM,       mixed: {} };
    case 'btn':     return { raise: BTN_15_RAISE,      jam: BTN_15_JAM,      mixed: {} };
    case 'sb':      return { raise: SB_15_RAISE,       jam: SB_15_JAM,       mixed: {} };
    case 'hu_sb':   return { raise: HU_SB_15_RAISE,    jam: HU_SB_15_JAM,    mixed: {} };
  }
}

function rangeData100(key: RangeKey): RangeData {
  switch (key) {
    case 'utg9max': return { raise: UTG_9MAX_RAISE, mixed: UTG_9MAX_MIXED };
    case 'utg1':    return { raise: UTG1_RAISE,     mixed: UTG1_MIXED };
    case 'utg2':    return { raise: UTG2_RAISE,     mixed: UTG2_MIXED };
    case 'utg':     return { raise: UTG_RAISE,      mixed: UTG_MIXED };
    case 'hj':      return { raise: HJ_RAISE,       mixed: HJ_MIXED };
    case 'co':      return { raise: CO_RAISE,       mixed: CO_MIXED };
    case 'btn':     return { raise: BTN_RAISE,      mixed: BTN_MIXED };
    case 'sb':      return { raise: SB_RAISE,       mixed: SB_MIXED };
    case 'hu_sb':   return { raise: HU_SB_RAISE,    mixed: HU_SB_MIXED };
  }
}

function rangeData60(key: RangeKey): RangeData {
  // 60bb uses the 100bb raise set with tightened mixed
  const base = rangeData100(key);
  const tightenedRaise = (mixed: Record<string, number>) =>
    new Set([...base.raise].filter((hand) => !(hand in mixed)));
  switch (key) {
    case 'utg9max': return { raise: tightenedRaise(UTG_9MAX_60_MIXED), mixed: UTG_9MAX_60_MIXED };
    case 'utg1':    return { raise: tightenedRaise(UTG1_60_MIXED), mixed: UTG1_60_MIXED };
    case 'utg2':    return { raise: tightenedRaise(UTG2_60_MIXED), mixed: UTG2_60_MIXED };
    case 'utg':     return { raise: tightenedRaise(UTG_60_MIXED), mixed: UTG_60_MIXED };
    case 'hj':      return { raise: tightenedRaise(HJ_60_MIXED), mixed: HJ_60_MIXED };
    case 'co':      return { raise: tightenedRaise(CO_60_MIXED), mixed: CO_60_MIXED };
    case 'btn':     return { raise: tightenedRaise(BTN_60_MIXED), mixed: BTN_60_MIXED };
    case 'sb':      return { raise: tightenedRaise(SB_60_MIXED), mixed: SB_60_MIXED };
    case 'hu_sb':   return { raise: tightenedRaise(HU_SB_60_MIXED), mixed: HU_SB_60_MIXED };
  }
}

function rangeData40(key: RangeKey): RangeData {
  // 40bb uses 100bb raise set + jam set + tightened mixed
  const base = rangeData100(key);
  const adjustedRaise = (jam: Set<string>, mixed: Record<string, number>) =>
    new Set([...base.raise].filter((hand) => !jam.has(hand) && !(hand in mixed)));
  switch (key) {
    case 'utg9max': return { raise: adjustedRaise(UTG_9MAX_40_JAM, UTG_9MAX_40_MIXED), jam: UTG_9MAX_40_JAM, mixed: UTG_9MAX_40_MIXED };
    case 'utg1':    return { raise: adjustedRaise(UTG1_40_JAM, UTG1_40_MIXED), jam: UTG1_40_JAM, mixed: UTG1_40_MIXED };
    case 'utg2':    return { raise: adjustedRaise(UTG2_40_JAM, UTG2_40_MIXED), jam: UTG2_40_JAM, mixed: UTG2_40_MIXED };
    case 'utg':     return { raise: adjustedRaise(UTG_40_JAM, UTG_40_MIXED), jam: UTG_40_JAM, mixed: UTG_40_MIXED };
    case 'hj':      return { raise: adjustedRaise(HJ_40_JAM, HJ_40_MIXED), jam: HJ_40_JAM, mixed: HJ_40_MIXED };
    case 'co':      return { raise: adjustedRaise(CO_40_JAM, CO_40_MIXED), jam: CO_40_JAM, mixed: CO_40_MIXED };
    case 'btn':     return { raise: adjustedRaise(BTN_40_JAM, BTN_40_MIXED), jam: BTN_40_JAM, mixed: BTN_40_MIXED };
    case 'sb':      return { raise: adjustedRaise(SB_40_JAM, SB_40_MIXED), jam: SB_40_JAM, mixed: SB_40_MIXED };
    case 'hu_sb':   return { raise: adjustedRaise(HU_SB_40_JAM, HU_SB_40_MIXED), jam: HU_SB_40_JAM, mixed: HU_SB_40_MIXED };
  }
}

function rangeData25(key: RangeKey): RangeData {
  switch (key) {
    case 'utg9max': return { raise: UTG_9MAX_25_RAISE, jam: UTG_9MAX_25_JAM, mixed: UTG_9MAX_25_MIXED };
    case 'utg1':    return { raise: UTG1_25_RAISE,     jam: UTG1_25_JAM,     mixed: UTG1_25_MIXED };
    case 'utg2':    return { raise: UTG2_25_RAISE,     jam: UTG2_25_JAM,     mixed: UTG2_25_MIXED };
    case 'utg':     return { raise: UTG_25_RAISE,      jam: UTG_25_JAM,      mixed: UTG_25_MIXED };
    case 'hj':      return { raise: HJ_25_RAISE,       jam: HJ_25_JAM,       mixed: HJ_25_MIXED };
    case 'co':      return { raise: CO_25_RAISE,       jam: CO_25_JAM,       mixed: CO_25_MIXED };
    case 'btn':     return { raise: BTN_25_RAISE,      jam: BTN_25_JAM,      mixed: BTN_25_MIXED };
    case 'sb':      return { raise: SB_25_RAISE,       jam: SB_25_JAM,       mixed: SB_25_MIXED };
    case 'hu_sb':   return { raise: HU_SB_25_RAISE,    jam: HU_SB_25_JAM,    mixed: HU_SB_25_MIXED };
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Table-size label helper
// ═══════════════════════════════════════════════════════════════════════

function tableSizeLabel(maxPlayers: MaxPlayers): string {
  if (maxPlayers === 2) return 'HU';
  return `${maxPlayers}-max`;
}

// ═══════════════════════════════════════════════════════════════════════
//  Depth-based chart builder
// ═══════════════════════════════════════════════════════════════════════

export function getRfiCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  if (depth === 7) return []; // 7bb is pure push/fold

  const positions = rfiPositions(maxPlayers);
  const useJam = depth === 15 || depth === 25 || depth === 40;
  const sizeLabel = tableSizeLabel(maxPlayers);

  return positions.map((pos) => {
    const data = rangeDataFor(pos, depth, maxPlayers);

    return {
      position: pos,
      situation: 'RFI',
      category: 'RFI',
      stackDepth: depth,
      maxPlayers,
      description: `${pos} RFI (${depth}bb, ${sizeLabel})`,
      actionTypes: useJam ? RFI_JAM_ACTIONS : RFI_ACTIONS,
      ranges: useJam && data.jam
        ? rfiJamRange(data.raise, data.jam, data.mixed)
        : rfiRange(data.raise, data.mixed),
    };
  });
}

// Backward-compatible flat export (100bb, 6-max)
export const RFI_CHARTS = getRfiCharts(100);
