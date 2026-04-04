import pool from '../config/db';
import { QueryResultRow } from 'pg';

type InquiryStatusFilter = string | undefined;

export async function getAdminStats() {
  const [
    totalUsers,
    totalInquiries,
    inquiryStats,
    dailySignupsDesc,
    dailySignupsAsc,
    todaySignups,
    weeklyActiveUsers,
    monthlyActiveUsers,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM inquiries'),
    pool.query('SELECT status, COUNT(*) as count FROM inquiries GROUP BY status'),
    pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
    ),
    pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
    ),
    pool.query(`SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE`),
    pool.query(`SELECT COUNT(*) FROM users WHERE last_active_at >= NOW() - INTERVAL '7 days'`),
    pool.query(`SELECT COUNT(*) FROM users WHERE last_active_at >= NOW() - INTERVAL '30 days'`),
  ]);

  return {
    totalUsers: parseCount(totalUsers.rows[0]),
    totalInquiries: parseCount(totalInquiries.rows[0]),
    inquiryStats: inquiryStats.rows,
    dailySignupsDesc: dailySignupsDesc.rows,
    dailySignupsAsc: dailySignupsAsc.rows,
    todaySignups: parseCount(todaySignups.rows[0]),
    weeklyActiveUsers: parseCount(weeklyActiveUsers.rows[0]),
    monthlyActiveUsers: parseCount(monthlyActiveUsers.rows[0]),
  };
}

export async function getAdminInquiries(status?: InquiryStatusFilter) {
  let query = `
    SELECT i.*, u.email, u.display_name
    FROM inquiries i
    JOIN users u ON i.user_id = u.id
  `;
  const params: string[] = [];

  if (status) {
    query += ' WHERE i.status = $1';
    params.push(status);
  }

  query += ' ORDER BY i.created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function replyToInquiry(id: string, reply: string) {
  const result = await pool.query(
    `UPDATE inquiries
     SET admin_reply = $1, status = 'replied', replied_at = NOW(), updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [reply, id],
  );

  return result.rows[0] ?? null;
}

function parseCount(row: QueryResultRow): number {
  return parseInt(row.count, 10);
}
