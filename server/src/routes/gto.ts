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
      `SELECT id, position, situation, vs_position, caller_position, description, category, action_types, flop_texture
       FROM gto_charts WHERE stack_depth = $1 AND max_players = $2
       ORDER BY position, category, vs_position, caller_position, flop_texture`,
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
        callerPosition: row.caller_position,
        description: row.description,
        actionTypes: row.action_types,
        flopTexture: row.flop_texture,
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
    const { position, situation, vs_position, caller_position, flop_texture, stack_depth, max_players } = req.query;
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
    if (caller_position) {
      params.push(caller_position as string);
      query += ` AND caller_position = $${params.length}`;
    }
    if (flop_texture) {
      params.push(flop_texture as string);
      query += ` AND flop_texture = $${params.length}`;
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

// GET /api/gto/charts/:id/tiers — stack depths that have a chart for the same spot
router.get('/charts/:id/tiers', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT b.stack_depth
       FROM gto_charts a
       JOIN gto_charts b
         ON b.position = a.position
        AND b.situation = a.situation
        AND b.max_players = a.max_players
        AND b.vs_position IS NOT DISTINCT FROM a.vs_position
        AND b.caller_position IS NOT DISTINCT FROM a.caller_position
        AND b.flop_texture IS NOT DISTINCT FROM a.flop_texture
       WHERE a.id = $1
       ORDER BY b.stack_depth`,
      [req.params.id],
    );
    res.json(result.rows.map((r) => r.stack_depth));
  } catch (err) {
    console.error('Error fetching chart tiers:', err);
    res.status(500).json({ error: 'Failed to fetch tiers' });
  }
});

export default router;
