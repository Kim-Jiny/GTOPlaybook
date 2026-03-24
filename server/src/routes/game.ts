import { Router } from 'express';
import pool from '../config/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/games/history — user's game history
router.get('/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT gh.*, gr.name as room_name
       FROM game_hands gh
       JOIN game_rooms gr ON gr.id = gh.room_id
       WHERE gh.summary->'players' ? $1
       ORDER BY gh.played_at DESC
       LIMIT $2 OFFSET $3`,
      [req.uid, limit, offset],
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching game history:', err);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

// GET /api/games/stats — user's stats
router.get('/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM player_stats WHERE user_id = $1',
      [req.uid],
    );

    res.json(result.rows[0] || {
      hands_played: 0,
      hands_won: 0,
      total_winnings: 0,
      biggest_pot: 0,
      vpip_hands: 0,
      pfr_hands: 0,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
