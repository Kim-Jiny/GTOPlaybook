import { Router, Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import pool from '../config/db';

const router = Router();

declare module 'express-session' {
  interface SessionData {
    adminId?: number;
    adminUser?: string;
  }
}

function requireAdminSession(req: Request, res: Response, next: () => void) {
  if (req.session.adminId) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

const viewsDir = path.join(__dirname, '..', 'views');

// GET /admin/login
router.get('/login', (_req: Request, res: Response) => {
  res.sendFile(path.join(viewsDir, 'login.html'));
});

// POST /admin/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM admin_accounts WHERE username = $1',
      [username],
    );

    if (result.rows.length === 0) {
      res.redirect('/admin/login?error=1');
      return;
    }

    const match = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!match) {
      res.redirect('/admin/login?error=1');
      return;
    }

    req.session.adminId = result.rows[0].id;
    req.session.adminUser = username;
    res.redirect('/admin');
  } catch (err) {
    console.error('Admin login error:', err);
    res.redirect('/admin/login?error=1');
  }
});

// POST /admin/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// GET /admin — dashboard
router.get('/', requireAdminSession, (_req: Request, res: Response) => {
  res.sendFile(path.join(viewsDir, 'dashboard.html'));
});

// GET /admin/api/stats
router.get('/api/stats', requireAdminSession, async (_req: Request, res: Response) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalInquiries = await pool.query('SELECT COUNT(*) FROM inquiries');
    const inquiryStats = await pool.query(
      'SELECT status, COUNT(*) as count FROM inquiries GROUP BY status',
    );
    const dailySignups = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
    );

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalInquiries: parseInt(totalInquiries.rows[0].count),
      inquiryStats: inquiryStats.rows,
      dailySignups: dailySignups.rows,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /admin/api/inquiries
router.get('/api/inquiries', requireAdminSession, async (req: Request, res: Response) => {
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
    console.error('Admin inquiries error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// POST /admin/api/inquiries/:id/reply
router.post('/api/inquiries/:id/reply', requireAdminSession, async (req: Request, res: Response) => {
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
    console.error('Admin reply error:', err);
    res.status(500).json({ error: 'Failed to reply' });
  }
});

export default router;
