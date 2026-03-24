import { Router } from 'express';
import pool from '../config/db';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats — dashboard stats
router.get('/stats', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');

    const dailySignups = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
    );

    const inquiryStats = await pool.query(
      `SELECT status, COUNT(*) as count FROM inquiries GROUP BY status`,
    );

    const totalInquiries = await pool.query('SELECT COUNT(*) FROM inquiries');

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalInquiries: parseInt(totalInquiries.rows[0].count),
      dailySignups: dailySignups.rows,
      inquiryStats: inquiryStats.rows,
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/inquiries — all inquiries with user info
router.get('/inquiries', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT i.*, u.email, u.display_name
      FROM inquiries i
      JOIN users u ON i.user_id = u.id
    `;
    const params: string[] = [];

    if (status) {
      query += ' WHERE i.status = $1';
      params.push(status as string);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin inquiries:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// POST /api/admin/inquiries/:id/reply — reply to inquiry
router.post('/inquiries/:id/reply', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      res.status(400).json({ error: 'Reply is required' });
      return;
    }

    const result = await pool.query(
      `UPDATE inquiries
       SET admin_reply = $1, status = 'replied', replied_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reply, id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error replying to inquiry:', err);
    res.status(500).json({ error: 'Failed to reply to inquiry' });
  }
});

export default router;
