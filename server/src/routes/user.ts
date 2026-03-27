import { Router } from 'express';
import pool from '../config/db';
import firebaseApp from '../config/firebase';
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

    res.json({ success: true });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// GET /api/users/me — current user profile
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
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

// DELETE /api/users/me — delete account (DB + Firebase Auth)
router.delete('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.uid!;

    // Delete from database (cascades to inquiries, etc.)
    await pool.query('DELETE FROM users WHERE id = $1', [uid]);

    // Delete from Firebase Auth
    await firebaseApp.auth().deleteUser(uid);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
