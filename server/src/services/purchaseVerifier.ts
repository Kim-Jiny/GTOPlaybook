import crypto from 'crypto';
import fs from 'fs';

export const REMOVE_ADS_PRODUCT_ID = process.env.REMOVE_ADS_PRODUCT_ID || 'remove_ads';
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE_NAME || 'com.jiny.gtoplaybook';
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID || 'com.jiny.gtoplaybook';

export type VerifiedPurchase = {
  platform: 'ios' | 'android';
  productId: string;
  /** Stable id for the purchase: Apple original_transaction_id / Google orderId. */
  transactionId: string;
};

export class PurchaseVerificationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Apple — App Store receipt validation (verifyReceipt).
// A non-consumable needs no shared secret. Apple marks this endpoint legacy but
// still serves it; the in_app_purchase plugin hands us the app receipt.
// ---------------------------------------------------------------------------
type AppleReceipt = {
  status: number;
  receipt?: {
    bundle_id?: string;
    in_app?: Array<{ product_id: string; transaction_id: string; original_transaction_id: string; cancellation_date?: string }>;
  };
};

async function appleVerify(receiptData: string, sandbox: boolean): Promise<AppleReceipt> {
  const url = sandbox
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';
  const body: Record<string, unknown> = { 'receipt-data': receiptData };
  if (process.env.APPLE_SHARED_SECRET) body.password = process.env.APPLE_SHARED_SECRET;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new PurchaseVerificationError('App Store is unavailable', 502);
  return (await res.json()) as AppleReceipt;
}

export async function verifyApple(receiptData: string, productId: string): Promise<VerifiedPurchase> {
  let result = await appleVerify(receiptData, false);
  // 21007: a sandbox receipt was sent to production (TestFlight / review builds).
  if (result.status === 21007) result = await appleVerify(receiptData, true);
  if (result.status !== 0 || !result.receipt) {
    throw new PurchaseVerificationError(`Receipt rejected (status ${result.status})`);
  }
  if (result.receipt.bundle_id !== IOS_BUNDLE_ID) {
    throw new PurchaseVerificationError('Receipt belongs to a different app');
  }
  const item = (result.receipt.in_app ?? []).find(
    (p) => p.product_id === productId && !p.cancellation_date,
  );
  if (!item) throw new PurchaseVerificationError('Product not found in receipt');
  return {
    platform: 'ios',
    productId,
    transactionId: item.original_transaction_id || item.transaction_id,
  };
}

// ---------------------------------------------------------------------------
// Google Play — Developer API purchases.products.get with a service account.
// Needs GOOGLE_PLAY_SERVICE_ACCOUNT (JSON string) or GOOGLE_PLAY_SERVICE_ACCOUNT_FILE,
// and the account must be granted access to the app in Play Console.
// ---------------------------------------------------------------------------
function loadServiceAccount(): { client_email: string; private_key: string } {
  const inline = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const file = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_FILE;
  const raw = inline || (file ? fs.readFileSync(file, 'utf8') : '');
  if (!raw) throw new PurchaseVerificationError('Google Play verification is not configured', 503);
  return JSON.parse(raw);
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');

let cachedToken: { value: string; expiresAt: number } | null = null;

async function googleAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const sa = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = crypto.createSign('RSA-SHA256').update(`${header}.${claims}`).sign(sa.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new PurchaseVerificationError('Google authorization failed', 502);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export async function verifyGoogle(purchaseToken: string, productId: string): Promise<VerifiedPurchase> {
  const token = await googleAccessToken();
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE}` +
    `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404 || res.status === 400) throw new PurchaseVerificationError('Purchase not found');
  if (!res.ok) throw new PurchaseVerificationError('Google Play is unavailable', 502);
  const data = (await res.json()) as { purchaseState?: number; orderId?: string };
  // purchaseState: 0 purchased, 1 canceled, 2 pending
  if (data.purchaseState !== 0) throw new PurchaseVerificationError('Purchase is not completed');
  return { platform: 'android', productId, transactionId: data.orderId || purchaseToken };
}
