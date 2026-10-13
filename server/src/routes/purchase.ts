import { Router } from 'express';
import pool from '../config/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  checkPurchaseState,
  PurchaseVerificationError,
  REMOVE_ADS_PRODUCT_ID,
  verifyApple,
  verifyGoogle,
} from '../services/purchaseVerifier';

const router = Router();

const RECHECK_AFTER_HOURS = 6;

/**
 * Re-check purchases that have not been looked at recently, so a refund taken through
 * the store takes the ad-free upgrade away again. Failures never revoke anything.
 */
async function reconcileRefunds(uid: string): Promise<void> {
  const stale = await pool.query(
    `SELECT id, platform, product_id, receipt_ref
       FROM purchases
      WHERE user_id = $1 AND revoked_at IS NULL AND receipt_ref IS NOT NULL
        AND (last_checked_at IS NULL OR last_checked_at < NOW() - ($2 || ' hours')::interval)
      LIMIT 3`,
    [uid, String(RECHECK_AFTER_HOURS)],
  );
  if (stale.rows.length === 0) return;

  for (const row of stale.rows) {
    const state = await checkPurchaseState(row.platform, row.receipt_ref, row.product_id);
    if (state === 'unknown') continue;
    await pool.query(
      `UPDATE purchases
          SET last_checked_at = NOW(), revoked_at = CASE WHEN $2 = 'revoked' THEN NOW() ELSE NULL END
        WHERE id = $1`,
      [row.id, state],
    );
  }

  await pool.query(
    `UPDATE users
        SET ads_removed = EXISTS (SELECT 1 FROM purchases WHERE user_id = $1 AND revoked_at IS NULL),
            updated_at = NOW()
      WHERE id = $1`,
    [uid],
  );
}

// GET /api/purchases/status — has this account bought the ad-free upgrade?
router.get('/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    await reconcileRefunds(req.uid!).catch((err) => console.error('Refund reconciliation failed:', err));
    const result = await pool.query('SELECT ads_removed FROM users WHERE id = $1', [req.uid]);
    res.json({ adsRemoved: result.rows[0]?.ads_removed === true });
  } catch (err) {
    console.error('Error reading purchase status:', err);
    res.status(500).json({ error: 'Failed to read purchase status' });
  }
});

// POST /api/purchases/verify — { platform: 'ios'|'android', productId, receipt }
// `receipt` is the app receipt (iOS) or the purchase token (Android).
router.post('/verify', requireAuth, async (req: AuthRequest, res) => {
  const { platform, productId, receipt } = req.body ?? {};
  if ((platform !== 'ios' && platform !== 'android') || typeof receipt !== 'string' || !receipt) {
    res.status(400).json({ error: 'platform and receipt are required' });
    return;
  }
  if (productId !== REMOVE_ADS_PRODUCT_ID) {
    res.status(400).json({ error: 'Unknown product' });
    return;
  }

  try {
    const verified =
      platform === 'ios'
        ? await verifyApple(receipt, productId)
        : await verifyGoogle(receipt, productId);

    // A store purchase unlocks one account only; restoring on the same account is fine.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Normally created by /users/sync at sign-in; make sure the row exists so the FK holds.
      await client.query(
        `INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [req.uid, req.email ?? ''],
      );
      const existing = await client.query(
        'SELECT user_id FROM purchases WHERE platform = $1 AND transaction_id = $2',
        [verified.platform, verified.transactionId],
      );
      if (existing.rows.length > 0 && existing.rows[0].user_id !== req.uid) {
        await client.query('ROLLBACK');
        res.status(409).json({ error: 'This purchase is already linked to another account' });
        return;
      }
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO purchases (user_id, platform, product_id, transaction_id, receipt_ref)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.uid, verified.platform, verified.productId, verified.transactionId, verified.ref],
        );
      } else {
        // Verified again (restore): it is valid now, so clear any earlier void and refresh the ref.
        await client.query(
          `UPDATE purchases SET revoked_at = NULL, last_checked_at = NOW(), receipt_ref = $3
            WHERE platform = $1 AND transaction_id = $2`,
          [verified.platform, verified.transactionId, verified.ref],
        );
      }
      await client.query('UPDATE users SET ads_removed = TRUE, updated_at = NOW() WHERE id = $1', [req.uid]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }

    res.json({ adsRemoved: true });
  } catch (err) {
    if (err instanceof PurchaseVerificationError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Error verifying purchase:', err);
    res.status(500).json({ error: 'Failed to verify purchase' });
  }
});

export default router;
