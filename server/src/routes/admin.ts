import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  getAdminInquiries,
  getAdminStats,
  replyToInquiry,
} from '../services/adminService';

const router = Router();

// GET /api/admin/stats — dashboard stats
router.get('/stats', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const stats = await getAdminStats();

    res.json({
      totalUsers: stats.totalUsers,
      totalInquiries: stats.totalInquiries,
      dailySignups: stats.dailySignupsDesc,
      inquiryStats: stats.inquiryStats,
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/inquiries — all inquiries with user info
router.get('/inquiries', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const result = await getAdminInquiries(req.query.status as string | undefined);
    res.json(result);
  } catch (err) {
    console.error('Error fetching admin inquiries:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// POST /api/admin/inquiries/:id/reply — reply to inquiry
router.post('/inquiries/:id/reply', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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
    console.error('Error replying to inquiry:', err);
    res.status(500).json({ error: 'Failed to reply to inquiry' });
  }
});

export default router;
