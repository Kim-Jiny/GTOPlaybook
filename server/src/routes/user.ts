import { Router } from 'express';
import pool from '../config/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/users/sync — create or update user after Firebase login
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email } = req;
    const { displayName, photoUrl } = req.body;

    await pool.query(
      `INSERT INTO users (id, email, display_name, photo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         photo_url = EXCLUDED.photo_url,
         updated_at = NOW()`,
      [uid, email, displayName || null, photoUrl || null],
    );

    // Ensure player_stats row exists
    await pool.query(
      `INSERT INTO player_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [uid],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// GET /api/users/me — current user profile + stats
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, ps.hands_played, ps.hands_won, ps.total_winnings,
              ps.biggest_pot, ps.vpip_hands, ps.pfr_hands
       FROM users u
       LEFT JOIN player_stats ps ON ps.user_id = u.id
       WHERE u.id = $1`,
      [req.uid],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
