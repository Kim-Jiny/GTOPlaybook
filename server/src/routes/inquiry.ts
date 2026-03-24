import { Router } from 'express';
import pool from '../config/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

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
