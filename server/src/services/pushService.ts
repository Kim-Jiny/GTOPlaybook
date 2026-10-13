import pool from '../config/db';
import firebaseApp from '../config/firebase';

export type AdminAlert = {
  type: 'inquiry' | 'purchase' | 'refund';
  title: string;
  body: string;
  /** Row id the alert refers to; lets the app open the right screen. */
  id?: number | string;
};

/** FCM error codes that mean the token will never work again. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export function isDeadTokenError(code: string | undefined): boolean {
  return code !== undefined && DEAD_TOKEN_CODES.has(code);
}

export async function registerDeviceToken(userId: string, token: string, platform: string | null) {
  // A token belongs to one account at a time: re-registering moves it.
  await pool.query(
    `INSERT INTO device_tokens (token, user_id, platform, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id,
       platform = EXCLUDED.platform, updated_at = NOW()`,
    [token, userId, platform],
  );
}

export async function removeDeviceToken(token: string) {
  await pool.query('DELETE FROM device_tokens WHERE token = $1', [token]);
}

/**
 * Pushes an alert to every device registered by an admin account. Never throws: a failed
 * push must not break the request that triggered it.
 */
export async function notifyAdmins(alert: AdminAlert): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT d.token FROM device_tokens d
         JOIN users u ON u.id = d.user_id
        WHERE u.is_admin = TRUE`,
    );
    const tokens: string[] = result.rows.map((r) => r.token);
    if (tokens.length === 0) return;

    const response = await firebaseApp.messaging().sendEachForMulticast({
      tokens,
      notification: { title: alert.title, body: alert.body },
      data: { type: alert.type, ...(alert.id !== undefined ? { id: String(alert.id) } : {}) },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    // Drop tokens the push service says are gone so the table does not grow forever.
    const dead = response.responses
      .map((r, i) => (!r.success && isDeadTokenError(r.error?.code) ? tokens[i] : null))
      .filter((t): t is string => t !== null);
    if (dead.length > 0) {
      await pool.query('DELETE FROM device_tokens WHERE token = ANY($1::text[])', [dead]);
    }
  } catch (err) {
    console.error('Admin push failed:', err);
  }
}
