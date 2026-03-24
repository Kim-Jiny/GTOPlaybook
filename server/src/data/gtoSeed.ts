import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/db';
import { initDatabase } from '../config/initDb';

// 13x13 grid labels
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function handLabel(row: number, col: number): string {
  if (row === col) return `${RANKS[row]}${RANKS[col]}`;
  if (row < col) return `${RANKS[row]}${RANKS[col]}s`; // suited (above diagonal)
  return `${RANKS[col]}${RANKS[row]}o`; // offsuit (below diagonal)
}

interface RangeEntry {
  hand: string;
  row: number;
  col: number;
  action: string;
  raise: number;
  call: number;
  fold: number;
}

type ChartDef = {
  position: string;
  situation: string;
  description: string;
  ranges: (row: number, col: number) => { action: string; raise: number; call: number; fold: number };
};

// Helper: check if hand is in a set of hand labels
function inSet(hand: string, set: Set<string>): boolean {
  return set.has(hand);
}

// UTG RFI — very tight (~15%)
const UTG_RAISE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs',
  'AKo', 'AQo',
]);
const UTG_MIXED = new Set(['88', 'A9s', 'KTs', 'T9s', 'AJo']); // ~50% raise

// MP RFI — slightly wider (~19%)
const MP_RAISE = new Set([
  ...UTG_RAISE,
  '88', '77', 'A9s', 'KTs', 'QTs', 'JTs', 'T9s', '98s',
  'AJo', 'KQo',
]);
const MP_MIXED = new Set(['66', 'A8s', 'K9s', 'Q9s', '87s', 'ATo', 'KJo']);

// CO RFI — wide (~27%)
const CO_RAISE = new Set([
  ...MP_RAISE,
  '66', '55', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'K9s', 'Q9s', 'J9s', 'T9s', '98s', '87s', '76s', '65s',
  'ATo', 'KJo', 'KTo', 'QJo',
]);
const CO_MIXED = new Set(['44', '33', 'K8s', 'Q8s', 'J8s', '86s', '75s', 'QTo', 'JTo']);

// BTN RFI — very wide (~43%)
const BTN_RAISE = new Set([
  ...CO_RAISE,
  '44', '33', '22',
  'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'Q8s', 'J8s', 'T8s', '97s', '86s', '75s', '64s', '54s',
  'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  'KTo', 'KJo', 'QJo', 'QTo', 'JTo', 'J9o', 'T9o',
]);
const BTN_MIXED = new Set(['K2s', 'Q7s', 'J7s', 'T7s', '96s', '85s', '74s', '53s', 'A4o', 'A3o', 'K9o', 'Q9o']);

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
const SB_MIXED = new Set(['33', '22', 'K4s', 'Q7s', 'J7s', 'T7s', '96s', '85s', 'A4o', 'A3o', 'K8o', 'Q9o']);

// BB — not an RFI position, but defend vs BTN open
// Action will be "defend" with call/raise frequencies
const BB_DEFEND_3BET = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs',
]);
const BB_DEFEND_CALL = new Set([
  'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s',
  'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s', '43s',
  'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', 'T8o', '98o', '87o', '76o',
]);

const CHARTS: ChartDef[] = [
  {
    position: 'UTG',
    situation: 'RFI',
    description: 'UTG Raise First In (100bb, 6-max)',
    ranges: (row, col) => {
      const h = handLabel(row, col);
      if (inSet(h, UTG_RAISE)) return { action: 'raise', raise: 1.0, call: 0, fold: 0 };
      if (inSet(h, UTG_MIXED)) return { action: 'raise', raise: 0.5, call: 0, fold: 0.5 };
      return { action: 'fold', raise: 0, call: 0, fold: 1.0 };
    },
  },
  {
    position: 'MP',
    situation: 'RFI',
    description: 'MP Raise First In (100bb, 6-max)',
    ranges: (row, col) => {
      const h = handLabel(row, col);
      if (inSet(h, MP_RAISE)) return { action: 'raise', raise: 1.0, call: 0, fold: 0 };
      if (inSet(h, MP_MIXED)) return { action: 'raise', raise: 0.5, call: 0, fold: 0.5 };
      return { action: 'fold', raise: 0, call: 0, fold: 1.0 };
    },
  },
  {
    position: 'CO',
    situation: 'RFI',
    description: 'CO Raise First In (100bb, 6-max)',
    ranges: (row, col) => {
      const h = handLabel(row, col);
      if (inSet(h, CO_RAISE)) return { action: 'raise', raise: 1.0, call: 0, fold: 0 };
      if (inSet(h, CO_MIXED)) return { action: 'raise', raise: 0.5, call: 0, fold: 0.5 };
      return { action: 'fold', raise: 0, call: 0, fold: 1.0 };
    },
  },
  {
    position: 'BTN',
    situation: 'RFI',
    description: 'BTN Raise First In (100bb, 6-max)',
    ranges: (row, col) => {
      const h = handLabel(row, col);
      if (inSet(h, BTN_RAISE)) return { action: 'raise', raise: 1.0, call: 0, fold: 0 };
      if (inSet(h, BTN_MIXED)) return { action: 'raise', raise: 0.5, call: 0, fold: 0.5 };
      return { action: 'fold', raise: 0, call: 0, fold: 1.0 };
    },
  },
  {
    position: 'SB',
    situation: 'RFI',
    description: 'SB Raise First In (100bb, 6-max)',
    ranges: (row, col) => {
      const h = handLabel(row, col);
      if (inSet(h, SB_RAISE)) return { action: 'raise', raise: 1.0, call: 0, fold: 0 };
      if (inSet(h, SB_MIXED)) return { action: 'raise', raise: 0.5, call: 0, fold: 0.5 };
      return { action: 'fold', raise: 0, call: 0, fold: 1.0 };
    },
  },
  {
    position: 'BB',
    situation: 'Defend vs BTN',
    description: 'BB Defend vs BTN Open (100bb, 6-max)',
    ranges: (row, col) => {
      const h = handLabel(row, col);
      if (inSet(h, BB_DEFEND_3BET)) return { action: 'raise', raise: 1.0, call: 0, fold: 0 };
      if (inSet(h, BB_DEFEND_CALL)) return { action: 'call', raise: 0, call: 1.0, fold: 0 };
      return { action: 'fold', raise: 0, call: 0, fold: 1.0 };
    },
  },
];

async function seed() {
  await initDatabase();

  // Check if already seeded
  const existing = await pool.query('SELECT COUNT(*) FROM gto_charts');
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('GTO charts already seeded, skipping');
    process.exit(0);
  }

  for (const chart of CHARTS) {
    const chartResult = await pool.query(
      `INSERT INTO gto_charts (position, situation, description, stack_depth)
       VALUES ($1, $2, $3, 100) RETURNING id`,
      [chart.position, chart.situation, chart.description],
    );
    const chartId = chartResult.rows[0].id;

    const entries: RangeEntry[] = [];
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        const h = handLabel(row, col);
        const r = chart.ranges(row, col);
        entries.push({
          hand: h,
          row,
          col,
          action: r.action,
          raise: r.raise,
          call: r.call,
          fold: r.fold,
        });
      }
    }

    // Batch insert
    const values: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;
    for (const e of entries) {
      values.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7})`);
      params.push(chartId, e.hand, e.row, e.col, e.action, e.raise, e.call, e.fold);
      idx += 8;
    }

    await pool.query(
      `INSERT INTO gto_ranges (chart_id, hand, row_idx, col_idx, action, raise_freq, call_freq, fold_freq)
       VALUES ${values.join(', ')}`,
      params,
    );

    console.log(`Seeded chart: ${chart.position} ${chart.situation} (${entries.length} hands)`);
  }

  console.log('GTO seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
