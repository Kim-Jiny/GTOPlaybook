import { ChartDef, handLabel, inSet, StackDepth, MaxPlayers, rfiPositions } from './helpers';
import { RFI_ACTIONS, RFI_JAM_ACTIONS } from './actionColors';

// ═══════════════════════════════════════════════════════════════════════
//  100bb ranges
// ═══════════════════════════════════════════════════════════════════════

// ─── UTG (6-max) / MP (7+) — ~15% ───────────────────────────────────

const UTG_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs',
  'AKo', 'AQo',
]);
const UTG_MIXED: Record<string, number> = { '88': 0.75, 'A9s': 0.6, 'KTs': 0.5, 'T9s': 0.4, 'AJo': 0.6 };

// ─── HJ (was "MP" in 6-max) — ~19% ──────────────────────────────────

const HJ_RAISE = new Set([
  ...UTG_RAISE,
  '88', '77', 'A9s', 'KTs', 'QTs', 'JTs', 'T9s', '98s',
  'AJo', 'KQo',
]);
const HJ_MIXED: Record<string, number> = { '66': 0.8, 'A8s': 0.6, 'K9s': 0.5, 'Q9s': 0.4, '87s': 0.4, 'ATo': 0.65, 'KJo': 0.55 };

// ─── CO — ~27% ──────────────────────────────────────────────────────

const CO_RAISE = new Set([
  ...HJ_RAISE,
  '66', '55', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'K9s', 'Q9s', 'J9s', 'T9s', '98s', '87s', '76s', '65s',
  'ATo', 'KJo', 'KTo', 'QJo',
]);
const CO_MIXED: Record<string, number> = { '44': 0.8, '33': 0.6, 'K8s': 0.5, 'Q8s': 0.45, 'J8s': 0.4, '86s': 0.4, '75s': 0.35, 'QTo': 0.6, 'JTo': 0.5 };

// ─── BTN — ~43% ─────────────────────────────────────────────────────

const BTN_RAISE = new Set([
  ...CO_RAISE,
  '44', '33', '22',
  'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s',
  'Q8s', 'J8s', 'T8s', '97s', '86s', '75s', '64s', '54s',
  'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KTo', 'KJo', 'QJo', 'QTo', 'JTo', 'J9o', 'T9o',
]);
const BTN_MIXED: Record<string, number> = { 'K2s': 0.5, 'Q7s': 0.5, 'J7s': 0.45, 'T7s': 0.4, '96s': 0.45, '85s': 0.4, '74s': 0.35, '53s': 0.35, 'A4o': 0.7, 'A3o': 0.6, 'K9o': 0.55, 'Q9o': 0.45 };

// ─── SB (multiway, 3+ players) — ~40% ──────────────────────────────

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

// ─── HU SB (~80% - very wide) ──────────────────────────────────────

const HU_SB_RAISE = new Set([
  // All pocket pairs
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  // All suited Ax
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  // All suited Kx
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  // All suited Qx
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  // Suited Jx down to J5s
  'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s',
  // Suited Tx down to T6s
  'T9s', 'T8s', 'T7s', 'T6s',
  // Suited 9x down to 95s
  '98s', '97s', '96s', '95s',
  // Suited 8x down to 84s
  '87s', '86s', '85s', '84s',
  // Suited 7x down to 73s
  '76s', '75s', '74s', '73s',
  // Suited 6x down to 63s
  '65s', '64s', '63s',
  // Low suited connectors
  '54s', '53s', '43s',
  // Offsuit Ax all
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  // Offsuit Kx down to K5o
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o',
  // Offsuit Qx down to Q8o
  'QJo', 'QTo', 'Q9o', 'Q8o',
  // Offsuit Jx down to J8o
  'JTo', 'J9o', 'J8o',
  // Offsuit Tx down to T8o
  'T9o', 'T8o',
  // Offsuit 9x
  '98o',
  // Offsuit 8x
  '87o',
]);
const HU_SB_MIXED: Record<string, number> = { 'J4s': 0.5, 'T5s': 0.5, '94s': 0.4, '83s': 0.4, '72s': 0.3, '62s': 0.3, 'K4o': 0.6, 'K3o': 0.5, 'Q7o': 0.5, 'J7o': 0.4, 'T7o': 0.35, '97o': 0.3, '76o': 0.3 };

// ═══════════════════════════════════════════════════════════════════════
//  25bb ranges (tight push/fold-adjacent)
// ═══════════════════════════════════════════════════════════════════════

// UTG 25bb — only premiums
const UTG_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs',
  'AKo',
]);
const UTG_25_MIXED: Record<string, number> = {};

// HJ 25bb (was MP) — UTG premiums + a few broadways
const HJ_25_RAISE = new Set([
  ...UTG_25_RAISE,
  '99', '88', '77',
  'AJs', 'KQs',
]);
const HJ_25_MIXED: Record<string, number> = {};

// CO 25bb
const CO_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
  'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
  'AKo', 'AQo', 'AJo', 'KQo',
]);
const CO_25_MIXED: Record<string, number> = {};

// BTN 25bb
const BTN_25_RAISE = new Set([
  ...CO_25_RAISE,
  '66', '55',
  'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'K9s', 'Q9s', 'J9s', '87s', '76s', '65s',
  'ATo', 'KJo', 'KTo', 'QJo',
]);
const BTN_25_MIXED: Record<string, number> = {};

// SB 25bb (multiway)
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

// UTG 9-max 25bb — very tight
const UTG_9MAX_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ',
  'AKs',
  'AKo',
]);
const UTG_9MAX_25_MIXED: Record<string, number> = {};

// UTG+1 25bb
const UTG1_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs',
  'AKo',
]);
const UTG1_25_MIXED: Record<string, number> = {};

// UTG+2 25bb
const UTG2_25_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs',
  'AKo',
]);
const UTG2_25_MIXED: Record<string, number> = {};

// HU SB 25bb — very wide push/fold
const HU_SB_25_RAISE = new Set([
  ...SB_25_RAISE,
  '33', '22',
  'K5s', 'K4s', 'K3s', 'K2s',
  'Q7s', 'Q6s', 'Q5s',
  'J7s', 'J6s',
  'T7s', 'T6s',
  '96s', '95s',
  '85s', '84s',
  '75s', '74s',
  '64s', '63s',
  '53s', '43s',
  'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'K9o', 'K8o', 'K7o', 'K6o', 'K5o',
  'Q9o', 'Q8o',
  'J9o', 'J8o',
  'T8o', 'T9o',
  '98o', '87o',
]);
const HU_SB_25_MIXED: Record<string, number> = {};

// ═══════════════════════════════════════════════════════════════════════
//  25bb jam sets (hands that open-jam instead of raise)
// ═══════════════════════════════════════════════════════════════════════

const UTG_25_JAM = new Set(['99', '88', 'AJs', 'ATs', 'KQs']);
const HJ_25_JAM = new Set(['66', '55', 'ATs', 'A9s', 'KJs', 'QJs', 'JTs']);
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

const UTG_15_RAISE = new Set(['AA']);
const UTG_15_JAM = new Set([
  'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs',
  'AKo', 'AQo',
]);

const HJ_15_RAISE = new Set(['AA']);
const HJ_15_JAM = new Set([
  'KK', 'QQ', 'JJ', 'TT', '99', '88',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'QTs',
  'AKo', 'AQo', 'AJo',
]);

const CO_15_RAISE = new Set(['AA', 'KK']);
const CO_15_JAM = new Set([
  'QQ', 'JJ', 'TT', '99', '88', '77', '66',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s',
  'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
  'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo',
]);

const BTN_15_RAISE = new Set(['AA', 'KK']);
const BTN_15_JAM = new Set([
  'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
  'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
]);

const SB_15_RAISE = new Set(['AA', 'KK']);
const SB_15_JAM = new Set([
  'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
  'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '85s', '76s', '75s', '65s', '64s', '54s', '53s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o',
]);

const UTG_9MAX_15_RAISE = new Set(['AA']);
const UTG_9MAX_15_JAM = new Set([
  'KK', 'QQ', 'JJ', 'TT',
  'AKs', 'AQs', 'AJs',
  'AKo', 'AQo',
]);

const UTG1_15_RAISE = new Set(['AA']);
const UTG1_15_JAM = new Set([
  'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs',
  'AKo', 'AQo',
]);

const UTG2_15_RAISE = new Set(['AA']);
const UTG2_15_JAM = new Set([
  'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs',
  'AKo', 'AQo',
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

const UTG_40_MIXED: Record<string, number> = { '88': 0.53, 'T9s': 0.28, 'AJo': 0.42 };
const HJ_40_MIXED: Record<string, number> = { '66': 0.56, 'Q9s': 0.28, 'ATo': 0.46, 'KJo': 0.39 };
const CO_40_MIXED: Record<string, number> = { 'J8s': 0.28, 'QTo': 0.42, 'JTo': 0.35 };
const BTN_40_MIXED: Record<string, number> = { 'K2s': 0.35, 'A4o': 0.49, 'A3o': 0.42, 'K9o': 0.39, 'Q9o': 0.32 };
const SB_40_MIXED: Record<string, number> = { 'K4s': 0.35, 'A4o': 0.46, 'A3o': 0.39, 'K8o': 0.35, 'Q9o': 0.32 };

const UTG_9MAX_40_MIXED: Record<string, number> = { '88': 0.4, 'T9s': 0.2 };
const UTG1_40_MIXED: Record<string, number> = { '88': 0.45, 'T9s': 0.25, 'AJo': 0.35 };
const UTG2_40_MIXED: Record<string, number> = { '88': 0.5, 'T9s': 0.25, 'AJo': 0.4 };

// HU SB at 40bb uses the wide 100bb HU raise set with mixed tightened
const HU_SB_40_MIXED: Record<string, number> = { 'K4o': 0.42, 'K3o': 0.35, 'Q7o': 0.35, 'J7o': 0.28, 'T7o': 0.25, '97o': 0.21, '76o': 0.21 };

// ─── 40bb jam sets ──────────────────────────────────────────────────

const UTG_40_JAM = new Set(['A9s', 'KTs']);
const HJ_40_JAM = new Set(['A8s', 'K9s', '87s']);
const CO_40_JAM = new Set(['44', '33', 'K8s', 'Q8s', '86s', '75s']);
const BTN_40_JAM = new Set(['Q7s', 'J7s', 'T7s', '96s', '85s', '74s', '53s']);
const SB_40_JAM = new Set(['33', '22', 'Q7s', 'J7s', 'T7s', '96s', '85s']);

const UTG_9MAX_40_JAM = new Set(['A9s', 'KTs']);
const UTG1_40_JAM = new Set(['A9s', 'KTs']);
const UTG2_40_JAM = new Set(['A9s', 'KTs', 'KJs']);

const HU_SB_40_JAM = new Set([
  'J4s', 'T5s', '94s', '83s', '72s', '62s',
  'K4o', 'Q7o', 'J7o', 'T7o',
]);

// ═══════════════════════════════════════════════════════════════════════
//  60bb ranges — 100bb pure raise set, mixed tightened by ~15%
// ═══════════════════════════════════════════════════════════════════════

const UTG_60_MIXED: Record<string, number> = { '88': 0.64, 'A9s': 0.51, 'KTs': 0.43, 'T9s': 0.34, 'AJo': 0.51 };
const HJ_60_MIXED: Record<string, number> = { '66': 0.68, 'A8s': 0.51, 'K9s': 0.43, 'Q9s': 0.34, '87s': 0.34, 'ATo': 0.55, 'KJo': 0.47 };
const CO_60_MIXED: Record<string, number> = { '44': 0.68, '33': 0.51, 'K8s': 0.43, 'Q8s': 0.38, 'J8s': 0.34, '86s': 0.34, '75s': 0.30, 'QTo': 0.51, 'JTo': 0.43 };
const BTN_60_MIXED: Record<string, number> = { 'K2s': 0.43, 'Q7s': 0.43, 'J7s': 0.38, 'T7s': 0.34, '96s': 0.38, '85s': 0.34, '74s': 0.30, '53s': 0.30, 'A4o': 0.60, 'A3o': 0.51, 'K9o': 0.47, 'Q9o': 0.38 };
const SB_60_MIXED: Record<string, number> = { '33': 0.60, '22': 0.43, 'K4s': 0.43, 'Q7s': 0.38, 'J7s': 0.34, 'T7s': 0.34, '96s': 0.34, '85s': 0.30, 'A4o': 0.55, 'A3o': 0.47, 'K8o': 0.43, 'Q9o': 0.38 };

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
 *  - 'MP'    at maxPlayers>=7  → UTG data (same ~15% range)
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
  if (position === 'MP') return 'utg';          // MP at 7+ uses the same ~15% range as 6-max UTG
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
  switch (key) {
    case 'utg9max': return { raise: base.raise, mixed: UTG_9MAX_60_MIXED };
    case 'utg1':    return { raise: base.raise, mixed: UTG1_60_MIXED };
    case 'utg2':    return { raise: base.raise, mixed: UTG2_60_MIXED };
    case 'utg':     return { raise: base.raise, mixed: UTG_60_MIXED };
    case 'hj':      return { raise: base.raise, mixed: HJ_60_MIXED };
    case 'co':      return { raise: base.raise, mixed: CO_60_MIXED };
    case 'btn':     return { raise: base.raise, mixed: BTN_60_MIXED };
    case 'sb':      return { raise: base.raise, mixed: SB_60_MIXED };
    case 'hu_sb':   return { raise: base.raise, mixed: HU_SB_60_MIXED };
  }
}

function rangeData40(key: RangeKey): RangeData {
  // 40bb uses 100bb raise set + jam set + tightened mixed
  const base = rangeData100(key);
  switch (key) {
    case 'utg9max': return { raise: base.raise, jam: UTG_9MAX_40_JAM, mixed: UTG_9MAX_40_MIXED };
    case 'utg1':    return { raise: base.raise, jam: UTG1_40_JAM,     mixed: UTG1_40_MIXED };
    case 'utg2':    return { raise: base.raise, jam: UTG2_40_JAM,     mixed: UTG2_40_MIXED };
    case 'utg':     return { raise: base.raise, jam: UTG_40_JAM,      mixed: UTG_40_MIXED };
    case 'hj':      return { raise: base.raise, jam: HJ_40_JAM,       mixed: HJ_40_MIXED };
    case 'co':      return { raise: base.raise, jam: CO_40_JAM,       mixed: CO_40_MIXED };
    case 'btn':     return { raise: base.raise, jam: BTN_40_JAM,      mixed: BTN_40_MIXED };
    case 'sb':      return { raise: base.raise, jam: SB_40_JAM,       mixed: SB_40_MIXED };
    case 'hu_sb':   return { raise: base.raise, jam: HU_SB_40_JAM,    mixed: HU_SB_40_MIXED };
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
