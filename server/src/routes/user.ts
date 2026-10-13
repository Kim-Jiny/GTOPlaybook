import { Router } from 'express';
import pool from '../config/db';
import firebaseApp from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { registerDeviceToken, removeDeviceToken } from '../services/pushService';

const router = Router();

// POST /api/users/sync — create or update user after Firebase login
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email } = req;
    const { displayName, photoUrl } = req.body;

    await pool.query(
      `INSERT INTO users (id, email, display_name, photo_url, last_active_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         photo_url = EXCLUDED.photo_url,
         last_active_at = NOW(),
         updated_at = NOW()`,
      [uid, email, displayName || null, photoUrl || null],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// POST /api/users/device-token — register this device for admin alerts (admins only)
router.post('/device-token', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { token, platform } = req.body ?? {};
    if (typeof token !== 'string' || token.length < 20 || token.length > 4096) {
      res.status(400).json({ error: 'A valid token is required' });
      return;
    }
    const admin = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.uid]);
    if (admin.rows[0]?.is_admin !== true) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    await registerDeviceToken(req.uid!, token, typeof platform === 'string' ? platform : null);
    res.json({ success: true });
  } catch (err) {
    console.error('Error registering device token:', err);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// DELETE /api/users/device-token — stop alerts on this device (sign-out)
router.delete('/device-token', requireAuth, async (req: AuthRequest, res) => {
  try {
    const token = req.body?.token ?? req.query.token;
    if (typeof token === 'string' && token) {
      // Only remove the caller's own token.
      await pool.query('DELETE FROM device_tokens WHERE token = $1 AND user_id = $2', [token, req.uid]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing device token:', err);
    res.status(500).json({ error: 'Failed to remove device' });
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

    // Delete from Firebase Auth first. If this fails, the DB row stays intact
    // so the account is not left in a half-deleted state.
    await firebaseApp.auth().deleteUser(uid);

    // Then delete from database (cascades to inquiries, etc.)
    await pool.query('DELETE FROM users WHERE id = $1', [uid]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
