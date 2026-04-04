import { Router, Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import {
  getAdminInquiries,
  getAdminStats,
  replyToInquiry,
} from '../services/adminService';

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
    const stats = await getAdminStats();

    res.json({
      totalUsers: stats.totalUsers,
      totalInquiries: stats.totalInquiries,
      inquiryStats: stats.inquiryStats,
      dailySignups: stats.dailySignupsAsc,
      todaySignups: stats.todaySignups,
      weeklyActiveUsers: stats.weeklyActiveUsers,
      monthlyActiveUsers: stats.monthlyActiveUsers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /admin/api/users — user list with search and pagination
router.get('/api/users', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: (string | number)[] = [];

    if (search) {
      whereClause = 'WHERE email ILIKE $1 OR display_name ILIKE $1 OR id ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT id, email, display_name, photo_url, is_admin,
              created_at, last_active_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams,
    );

    res.json({ users: result.rows, total, page, limit });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /admin/api/users/:id — user detail
router.get('/api/users/:id', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, display_name, photo_url, is_admin,
              created_at, last_active_at, updated_at
       FROM users WHERE id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /admin/api/inquiries
router.get('/api/inquiries', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const result = await getAdminInquiries(req.query.status as string | undefined);
    res.json(result);
  } catch (err) {
    console.error('Admin inquiries error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// POST /admin/api/inquiries/:id/reply
router.post('/api/inquiries/:id/reply', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reply } = req.body;

    if (!reply) {
      res.status(400).json({ error: 'Reply is required' });
      return;
    }

    const result = await replyToInquiry(id, reply);

    if (!result) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error('Admin reply error:', err);
    res.status(500).json({ error: 'Failed to reply' });
  }
});

export default router;
