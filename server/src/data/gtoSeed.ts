import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/db';
import { initDatabase } from '../config/initDb';
import { handLabel, ChartDef } from './seedData/helpers';
import { getAllCharts } from './seedData/allChartsByDepth';

const ALL_CHARTS: ChartDef[] = getAllCharts();

async function seed() {
  await initDatabase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add new columns if they don't exist (migration for existing DBs)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS action_types JSONB;
        ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS flop_texture TEXT;
        ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 6;
        ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS caller_position TEXT;
        ALTER TABLE gto_ranges ADD COLUMN IF NOT EXISTS frequencies JSONB;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);

    // Clear existing data for re-seed
    await client.query('DELETE FROM gto_ranges');
    await client.query('DELETE FROM gto_charts');

    for (const chart of ALL_CHARTS) {
      const chartResult = await client.query(
        `INSERT INTO gto_charts (position, situation, vs_position, caller_position, description, stack_depth, max_players, category, action_types, flop_texture)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          chart.position,
          chart.situation,
          chart.vsPosition || null,
          chart.callerPosition || null,
          chart.description,
          chart.stackDepth ?? 100,
          chart.maxPlayers ?? 6,
          chart.category,
          JSON.stringify(chart.actionTypes),
          chart.flopTexture || null,
        ],
      );
      const chartId = chartResult.rows[0].id;

      const values: string[] = [];
      const params: (string | number | null)[] = [];
      let idx = 1;

      for (let row = 0; row < 13; row++) {
        for (let col = 0; col < 13; col++) {
          const h = handLabel(row, col);
          const freqs = chart.ranges(row, col);

          let dominant = 'fold';
          let maxFreq = 0;
          for (const [key, val] of Object.entries(freqs)) {
            if (key !== 'fold' && val > maxFreq) {
              dominant = key;
              maxFreq = val;
            }
          }

          const raiseFreq = freqs['raise'] || freqs['4bet'] || freqs['3bet'] || freqs['5bet'] || freqs['bet'] || freqs['allin'] || 0;
          const callFreq = freqs['call'] || freqs['check'] || 0;
          const foldFreq = freqs['fold'] ?? (1 - raiseFreq - callFreq);

          values.push(
            `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8})`,
          );
          params.push(chartId, h, row, col, dominant, raiseFreq, callFreq, foldFreq, JSON.stringify(freqs));
          idx += 9;
        }
      }

      await client.query(
        `INSERT INTO gto_ranges (chart_id, hand, row_idx, col_idx, action, raise_freq, call_freq, fold_freq, frequencies)
         VALUES ${values.join(', ')}`,
        params,
      );

      console.log(`Seeded: ${chart.position} ${chart.situation}${chart.vsPosition ? ' vs ' + chart.vsPosition : ''} [${chart.stackDepth ?? 100}bb, ${chart.maxPlayers ?? 6}-max] (169 hands)`);
    }

    await client.query('COMMIT');
    console.log(`\nGTO seed complete: ${ALL_CHARTS.length} charts`);
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
