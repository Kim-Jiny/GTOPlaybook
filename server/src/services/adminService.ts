import pool from '../config/db';
import { QueryResultRow } from 'pg';

type InquiryStatusFilter = string | undefined;

export const INQUIRY_STATUSES = ['pending', 'in_progress', 'replied'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export function isValidInquiryStatus(value: unknown): value is InquiryStatus {
  return (
    typeof value === 'string' &&
    (INQUIRY_STATUSES as readonly string[]).includes(value)
  );
}

/* ────────────────────────── Stats ────────────────────────── */

export async function getAdminStats() {
  const [
    totalUsers,
    totalInquiries,
    inquiryStats,
    dailySignupsDesc,
    dailySignupsAsc,
    todaySignups,
    todayActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    returningUsers,
    responseMetrics,
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
    pool.query(`SELECT COUNT(*) FROM users WHERE DATE(last_active_at) = CURRENT_DATE`),
    pool.query(`SELECT COUNT(*) FROM users WHERE last_active_at >= NOW() - INTERVAL '7 days'`),
    pool.query(`SELECT COUNT(*) FROM users WHERE last_active_at >= NOW() - INTERVAL '30 days'`),
    // Returning users: active in the last 7 days but signed up more than 7 days ago.
    pool.query(
      `SELECT COUNT(*) FROM users
       WHERE last_active_at >= NOW() - INTERVAL '7 days'
         AND created_at < NOW() - INTERVAL '7 days'`,
    ),
    // Response rate & average first-response time (hours) over replied inquiries.
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'replied') AS replied,
         COUNT(*) AS total,
         AVG(EXTRACT(EPOCH FROM (replied_at - created_at)) / 3600.0)
           FILTER (WHERE replied_at IS NOT NULL) AS avg_hours
       FROM inquiries`,
    ),
  ]);

  const replied = parseInt(responseMetrics.rows[0].replied, 10) || 0;
  const totalInq = parseInt(responseMetrics.rows[0].total, 10) || 0;
  const avgHoursRaw = responseMetrics.rows[0].avg_hours;

  return {
    totalUsers: parseCount(totalUsers.rows[0]),
    totalInquiries: parseCount(totalInquiries.rows[0]),
    inquiryStats: inquiryStats.rows,
    dailySignupsDesc: dailySignupsDesc.rows,
    dailySignupsAsc: dailySignupsAsc.rows,
    todaySignups: parseCount(todaySignups.rows[0]),
    todayActiveUsers: parseCount(todayActiveUsers.rows[0]),
    weeklyActiveUsers: parseCount(weeklyActiveUsers.rows[0]),
    monthlyActiveUsers: parseCount(monthlyActiveUsers.rows[0]),
    returningUsers: parseCount(returningUsers.rows[0]),
    responseRate: totalInq > 0 ? Math.round((replied / totalInq) * 100) : 0,
    avgResponseHours: avgHoursRaw != null ? Math.round(Number(avgHoursRaw) * 10) / 10 : null,
  };
}

export async function getPurchaseStats() {
  const [summary, daily, byPlatform, users] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active,
         COUNT(*) FILTER (WHERE revoked_at IS NOT NULL) AS refunded,
         COUNT(*) FILTER (WHERE revoked_at IS NULL AND DATE(created_at) = CURRENT_DATE) AS today,
         COUNT(*) FILTER (WHERE revoked_at IS NULL AND created_at >= NOW() - INTERVAL '7 days') AS week
       FROM purchases`,
    ),
    pool.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM purchases
       WHERE revoked_at IS NULL AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
    ),
    pool.query(
      `SELECT platform, COUNT(*) AS count
       FROM purchases WHERE revoked_at IS NULL GROUP BY platform`,
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE ads_removed) AS ads_removed, COUNT(*) AS total FROM users`,
    ),
  ]);

  const row = summary.rows[0];
  const adsRemoved = parseInt(users.rows[0].ads_removed, 10) || 0;
  const totalUsers = parseInt(users.rows[0].total, 10) || 0;
  const platforms: Record<string, number> = { ios: 0, android: 0 };
  for (const r of byPlatform.rows) platforms[r.platform] = parseInt(r.count, 10) || 0;

  return {
    adsRemovedUsers: adsRemoved,
    conversionRate: totalUsers > 0 ? Math.round((adsRemoved / totalUsers) * 1000) / 10 : 0,
    activePurchases: parseInt(row.active, 10) || 0,
    refundedPurchases: parseInt(row.refunded, 10) || 0,
    purchasesToday: parseInt(row.today, 10) || 0,
    purchasesThisWeek: parseInt(row.week, 10) || 0,
    byPlatform: platforms,
    dailyPurchases: daily.rows,
  };
}

/* ────────────────────────── Purchases ────────────────────────── */

export interface PurchaseListOptions {
  status?: string; // 'active' | 'refunded' | '' (all)
  platform?: string; // 'ios' | 'android' | ''
  search?: string;
  page?: number;
  limit?: number;
}

function buildPurchaseWhere(options: Pick<PurchaseListOptions, 'status' | 'platform' | 'search'>) {
  const conditions: string[] = [];
  const params: string[] = [];
  if (options.status === 'active') conditions.push('p.revoked_at IS NULL');
  if (options.status === 'refunded') conditions.push('p.revoked_at IS NOT NULL');
  if (options.platform === 'ios' || options.platform === 'android') {
    params.push(options.platform);
    conditions.push(`p.platform = $${params.length}`);
  }
  if (options.search) {
    params.push(`%${options.search}%`);
    conditions.push(`(u.email ILIKE $${params.length} OR u.display_name ILIKE $${params.length} OR u.id ILIKE $${params.length})`);
  }
  return { clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export async function getPurchases(options: PurchaseListOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const { clause, params } = buildPurchaseWhere(options);

  const count = await pool.query(
    `SELECT COUNT(*) FROM purchases p JOIN users u ON u.id = p.user_id ${clause}`,
    params,
  );
  const result = await pool.query(
    `SELECT p.id, p.platform, p.product_id, p.created_at, p.revoked_at, p.last_checked_at,
            u.id AS user_id, u.email, u.display_name
     FROM purchases p JOIN users u ON u.id = p.user_id
     ${clause}
     ORDER BY p.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit],
  );
  return { purchases: result.rows, total: parseInt(count.rows[0].count, 10), page, limit };
}

export async function getPurchasesForExport(options: Pick<PurchaseListOptions, 'status' | 'platform' | 'search'>) {
  const { clause, params } = buildPurchaseWhere(options);
  const result = await pool.query(
    `SELECT p.id, u.email, u.display_name, p.platform, p.product_id,
            p.created_at, p.revoked_at, p.last_checked_at
     FROM purchases p JOIN users u ON u.id = p.user_id
     ${clause}
     ORDER BY p.created_at DESC`,
    params,
  );
  return result.rows;
}

export async function getUserPurchases(userId: string) {
  const result = await pool.query(
    `SELECT id, platform, product_id, created_at, revoked_at
     FROM purchases WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

/* ────────────────────────── Users ────────────────────────── */

const USER_SORT_COLUMNS: Record<string, string> = {
  created_at: 'created_at',
  last_active_at: 'last_active_at',
  email: 'email',
  display_name: 'display_name',
};

export interface UserListOptions {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}

// Columns are qualified with the `u` alias so the clause is safe to reuse in
// queries that JOIN inquiries (where a bare `id` would be ambiguous). Every
// query using this clause must alias users AS u.
function buildUserWhere(search?: string): { clause: string; params: string[] } {
  if (!search) return { clause: '', params: [] };
  return {
    clause: 'WHERE u.email ILIKE $1 OR u.display_name ILIKE $1 OR u.id ILIKE $1',
    params: [`%${search}%`],
  };
}

export async function getUsers(options: UserListOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;
  const sortColumn = USER_SORT_COLUMNS[options.sort || 'created_at'] || 'created_at';
  const order = options.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const { clause, params } = buildUserWhere(options.search);

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users u ${clause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.photo_url, u.is_admin, u.ads_removed,
            u.created_at, u.last_active_at,
            COUNT(i.id) AS inquiry_count
     FROM users u
     LEFT JOIN inquiries i ON i.user_id = u.id
     ${clause}
     GROUP BY u.id
     ORDER BY u.${sortColumn} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  return { users: result.rows, total, page, limit };
}

export async function getUserDetail(id: string) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.photo_url, u.is_admin, u.ads_removed,
            u.created_at, u.last_active_at, u.updated_at,
            COUNT(i.id) AS inquiry_count,
            COUNT(i.id) FILTER (WHERE i.status = 'pending') AS pending_inquiries
     FROM users u
     LEFT JOIN inquiries i ON i.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getUserInquiries(userId: string) {
  const result = await pool.query(
    `SELECT * FROM inquiries WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function setUserAdmin(id: string, isAdmin: boolean) {
  const result = await pool.query(
    `UPDATE users SET is_admin = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, display_name, is_admin`,
    [isAdmin, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteUser(id: string) {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getUsersForExport(search?: string) {
  const { clause, params } = buildUserWhere(search);
  const result = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.is_admin, u.ads_removed, u.created_at, u.last_active_at
     FROM users u ${clause}
     ORDER BY u.created_at DESC`,
    params,
  );
  return result.rows;
}

/* ────────────────────────── Inquiries ────────────────────────── */

const INQUIRY_SORT_COLUMNS: Record<string, string> = {
  created_at: 'i.created_at',
  status: 'i.status',
  replied_at: 'i.replied_at',
};

export interface InquiryListOptions {
  status?: InquiryStatusFilter;
  search?: string;
  sort?: string;
  order?: string;
}

export async function getAdminInquiries(
  optionsOrStatus?: InquiryListOptions | InquiryStatusFilter,
) {
  const options: InquiryListOptions =
    typeof optionsOrStatus === 'string' || optionsOrStatus === undefined
      ? { status: optionsOrStatus }
      : optionsOrStatus;

  const conditions: string[] = [];
  const params: string[] = [];

  if (options.status) {
    params.push(options.status);
    conditions.push(`i.status = $${params.length}`);
  }

  if (options.search) {
    params.push(`%${options.search}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(i.title ILIKE ${p} OR i.content ILIKE ${p} OR u.email ILIKE ${p} OR u.display_name ILIKE ${p})`,
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortColumn = INQUIRY_SORT_COLUMNS[options.sort || 'created_at'] || 'i.created_at';
  const order = options.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const result = await pool.query(
    `SELECT i.*, u.email, u.display_name
     FROM inquiries i
     JOIN users u ON i.user_id = u.id
     ${where}
     ORDER BY ${sortColumn} ${order} NULLS LAST`,
    params,
  );
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

export async function updateInquiryReply(id: string, reply: string) {
  const result = await pool.query(
    `UPDATE inquiries
     SET admin_reply = $1, status = 'replied', updated_at = NOW(),
         replied_at = COALESCE(replied_at, NOW())
     WHERE id = $2
     RETURNING *`,
    [reply, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteInquiryReply(id: string) {
  const result = await pool.query(
    `UPDATE inquiries
     SET admin_reply = NULL, status = 'pending', replied_at = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const result = await pool.query(
    `UPDATE inquiries SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id],
  );
  return result.rows[0] ?? null;
}

export async function getInquiriesForExport(status?: InquiryStatusFilter) {
  return getAdminInquiries({ status });
}

/* ────────────────────────── Helpers ────────────────────────── */

function parseCount(row: QueryResultRow): number {
  return parseInt(row.count, 10);
}
