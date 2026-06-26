import { Router, Request, Response } from 'express';
import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import {
  getAdminInquiries,
  getAdminStats,
  getUsers,
  getUserDetail,
  getUserInquiries,
  setUserAdmin,
  deleteUser,
  getUsersForExport,
  replyToInquiry,
  updateInquiryReply,
  deleteInquiryReply,
  updateInquiryStatus,
  getInquiriesForExport,
  isValidInquiryStatus,
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
  } else if (req.path.startsWith('/api/')) {
    res.status(401).json({ error: 'Unauthorized' });
  } else {
    res.redirect('/admin/login');
  }
}

const publicDir = path.join(__dirname, '..', 'public', 'admin');

// Express types route params as string | string[]; normalize to a single string.
function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

// Static assets (css/js) — non-sensitive, no session required.
router.use('/static', express.static(publicDir));

/* ────────────────────────── Auth ────────────────────────── */

// GET /admin/login
router.get('/login', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'login.html'));
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

// GET /admin — dashboard shell
router.get('/', requireAdminSession, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// GET /admin/api/me — current admin session info
router.get('/api/me', requireAdminSession, (req: Request, res: Response) => {
  res.json({ username: req.session.adminUser });
});

/* ────────────────────────── Stats ────────────────────────── */

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
      todayActiveUsers: stats.todayActiveUsers,
      weeklyActiveUsers: stats.weeklyActiveUsers,
      monthlyActiveUsers: stats.monthlyActiveUsers,
      returningUsers: stats.returningUsers,
      responseRate: stats.responseRate,
      avgResponseHours: stats.avgResponseHours,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/* ────────────────────────── Users ────────────────────────── */

// GET /admin/api/users — list with search, sort, pagination
router.get('/api/users', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const data = await getUsers({
      search: (req.query.search as string) || '',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sort: req.query.sort as string,
      order: req.query.order as string,
    });
    res.json(data);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /admin/api/users/export — CSV
router.get('/api/users/export', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const rows = await getUsersForExport((req.query.search as string) || '');
    sendCsv(res, 'users', ['id', 'email', 'display_name', 'is_admin', 'created_at', 'last_active_at'], rows);
  } catch (err) {
    console.error('Admin users export error:', err);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// GET /admin/api/users/:id — detail
router.get('/api/users/:id', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const user = await getUserDetail(paramId(req));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /admin/api/users/:id/inquiries
router.get('/api/users/:id/inquiries', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const rows = await getUserInquiries(paramId(req));
    res.json(rows);
  } catch (err) {
    console.error('Admin user inquiries error:', err);
    res.status(500).json({ error: 'Failed to fetch user inquiries' });
  }
});

// PATCH /admin/api/users/:id/admin — grant / revoke admin
router.patch('/api/users/:id/admin', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') {
      res.status(400).json({ error: 'isAdmin (boolean) is required' });
      return;
    }
    const updated = await setUserAdmin(paramId(req), isAdmin);
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error('Admin set-admin error:', err);
    res.status(500).json({ error: 'Failed to update admin status' });
  }
});

// DELETE /admin/api/users/:id
router.delete('/api/users/:id', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const deleted = await deleteUser(paramId(req));
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ ok: true, id: deleted.id });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/* ────────────────────────── Inquiries ────────────────────────── */

// GET /admin/api/inquiries — list with status filter, search, sort
router.get('/api/inquiries', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const result = await getAdminInquiries({
      status: req.query.status as string | undefined,
      search: (req.query.search as string) || '',
      sort: req.query.sort as string,
      order: req.query.order as string,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin inquiries error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// GET /admin/api/inquiries/export — CSV
router.get('/api/inquiries/export', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const rows = await getInquiriesForExport(req.query.status as string | undefined);
    sendCsv(
      res,
      'inquiries',
      ['id', 'email', 'display_name', 'title', 'content', 'status', 'admin_reply', 'created_at', 'replied_at'],
      rows,
    );
  } catch (err) {
    console.error('Admin inquiries export error:', err);
    res.status(500).json({ error: 'Failed to export inquiries' });
  }
});

// POST /admin/api/inquiries/:id/reply — create reply
router.post('/api/inquiries/:id/reply', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      res.status(400).json({ error: 'Reply is required' });
      return;
    }
    const result = await replyToInquiry(paramId(req), reply);
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

// PUT /admin/api/inquiries/:id/reply — edit reply
router.put('/api/inquiries/:id/reply', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      res.status(400).json({ error: 'Reply is required' });
      return;
    }
    const result = await updateInquiryReply(paramId(req), reply);
    if (!result) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Admin edit reply error:', err);
    res.status(500).json({ error: 'Failed to update reply' });
  }
});

// DELETE /admin/api/inquiries/:id/reply — remove reply (reopen)
router.delete('/api/inquiries/:id/reply', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const result = await deleteInquiryReply(paramId(req));
    if (!result) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Admin delete reply error:', err);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// PATCH /admin/api/inquiries/:id/status — change status
router.patch('/api/inquiries/:id/status', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!isValidInquiryStatus(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const result = await updateInquiryStatus(paramId(req), status);
    if (!result) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/* ────────────────────────── CSV helper ────────────────────────── */

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sendCsv(
  res: Response,
  name: string,
  columns: string[],
  rows: Record<string, unknown>[],
) {
  const header = columns.join(',');
  const body = rows
    .map((row) => columns.map((col) => csvCell(row[col])).join(','))
    .join('\n');
  // Prefix BOM so Excel reads UTF-8 (Korean) correctly.
  const csv = '﻿' + header + '\n' + body;
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${stamp}.csv"`);
  res.send(csv);
}

export default router;
