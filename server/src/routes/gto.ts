import { Router } from 'express';
import pool from '../config/db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/gto/positions — position tree with situation categories
router.get('/positions', requireAuth, async (req, res) => {
  try {
    const stackDepth = parseInt(req.query.stack_depth as string) || 100;
    const maxPlayers = parseInt(req.query.max_players as string) || 6;
    const result = await pool.query(
      `SELECT id, position, situation, vs_position, description, category, action_types
       FROM gto_charts WHERE stack_depth = $1 AND max_players = $2 ORDER BY position, category, vs_position`,
      [stackDepth, maxPlayers],
    );

    // Group by position → category → charts
    const positionMap: Record<string, Record<string, any[]>> = {};
    for (const row of result.rows) {
      const pos = row.position;
      const cat = row.category || row.situation;
      if (!positionMap[pos]) positionMap[pos] = {};
      if (!positionMap[pos][cat]) positionMap[pos][cat] = [];
      positionMap[pos][cat].push({
        id: row.id,
        situation: row.situation,
        vsPosition: row.vs_position,
        description: row.description,
        actionTypes: row.action_types,
      });
    }

    // Convert to array format
    const positions = Object.entries(positionMap).map(([position, categories]) => ({
      position,
      categories: Object.entries(categories).map(([category, charts]) => ({
        category,
        charts,
      })),
    }));

    res.json(positions);
  } catch (err) {
    console.error('Error fetching positions:', err);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// GET /api/gto/charts — list all charts with optional filters
router.get('/charts', requireAuth, async (req, res) => {
  try {
    const { position, situation, vs_position, stack_depth, max_players } = req.query;
    const sd = parseInt(stack_depth as string) || 100;
    const mp = parseInt(max_players as string) || 6;
    let query = 'SELECT * FROM gto_charts WHERE stack_depth = $1 AND max_players = $2';
    const params: (string | number)[] = [sd, mp];

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
