import { Router } from 'express';
import pool from '../config/db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/gto/charts — list all charts with optional filters
router.get('/charts', requireAuth, async (req, res) => {
  try {
    const { position, situation, vs_position } = req.query;
    let query = 'SELECT * FROM gto_charts WHERE 1=1';
    const params: string[] = [];

    if (position) {
      params.push(position as string);
      query += ` AND position = $${params.length}`;
    }
    if (situation) {
      params.push(situation as string);
      query += ` AND situation = $${params.length}`;
    }
    if (vs_position) {
      params.push(vs_position as string);
      query += ` AND vs_position = $${params.length}`;
    }

    query += ' ORDER BY id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching charts:', err);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
});

// GET /api/gto/charts/:id — chart detail with all 169 hands
router.get('/charts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const chartResult = await pool.query('SELECT * FROM gto_charts WHERE id = $1', [id]);
    if (chartResult.rows.length === 0) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const rangesResult = await pool.query(
      'SELECT * FROM gto_ranges WHERE chart_id = $1 ORDER BY row_idx, col_idx',
      [id],
    );

    res.json({
      ...chartResult.rows[0],
      ranges: rangesResult.rows,
    });
  } catch (err) {
    console.error('Error fetching chart detail:', err);
    res.status(500).json({ error: 'Failed to fetch chart' });
  }
});

export default router;
