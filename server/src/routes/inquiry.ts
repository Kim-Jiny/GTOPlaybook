import { Router } from 'express';
import pool from '../config/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { notifyAdmins } from '../services/pushService';

const router = Router();

// POST /api/inquiries — submit inquiry
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO inquiries (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.uid, title, content],
    );

    res.status(201).json(result.rows[0]);

    // After responding, so a slow or failing push never delays the user.
    const who = await pool
      .query('SELECT COALESCE(display_name, email) AS name FROM users WHERE id = $1', [req.uid])
      .then((r) => r.rows[0]?.name as string | undefined)
      .catch(() => undefined);
    void notifyAdmins({
      type: 'inquiry',
      title: '새 문의가 접수됐어요',
      body: `${who ? who + ' · ' : ''}${String(title).slice(0, 80)}`,
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error('Error creating inquiry:', err);
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
});

// GET /api/inquiries/my — my inquiries
router.get('/my', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM inquiries WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.uid],
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

export default router;
