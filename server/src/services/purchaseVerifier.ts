import crypto from 'crypto';
import fs from 'fs';

export const REMOVE_ADS_PRODUCT_ID = process.env.REMOVE_ADS_PRODUCT_ID || 'gto.remove_ads';
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE_NAME || 'com.jiny.gtoplaybook';
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID || 'com.jiny.gtoplaybook';

const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');

export type VerifiedPurchase = {
  platform: 'ios' | 'android';
  productId: string;
  /** Stable id for the purchase: Apple original_transaction_id / Google orderId. */
  transactionId: string;
  /** What is needed to re-check this purchase later: Apple transaction id / Google purchase token. */
  ref: string;
};

export type PurchaseState = 'active' | 'revoked' | 'unknown';

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

// StoreKit 2 (the in_app_purchase default) sends a signed transaction (JWS) instead of an
// app receipt. We only read the transaction id from it, then ask Apple's App Store Server
// API for the authoritative record, so nothing in the client payload is trusted.
// Needs APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID and APPLE_IAP_PRIVATE_KEY (the .p8 contents).
type AppleTransaction = {
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  bundleId?: string;
  revocationDate?: number;
};

function decodeJwsPayload(jws: string): AppleTransaction {
  const parts = jws.split('.');
  if (parts.length !== 3) throw new PurchaseVerificationError('Malformed transaction');
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as AppleTransaction;
  } catch {
    throw new PurchaseVerificationError('Malformed transaction');
  }
}

function appleApiToken(): string {
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuer = process.env.APPLE_IAP_ISSUER_ID;
  const privateKey = process.env.APPLE_IAP_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!keyId || !issuer || !privateKey) {
    throw new PurchaseVerificationError('App Store verification is not configured', 503);
  }
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({ iss: issuer, iat: now, exp: now + 1800, aud: 'appstoreconnect-v1', bid: IOS_BUNDLE_ID }),
  );
  const signature = crypto.sign('sha256', Buffer.from(`${header}.${claims}`), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });
  return `${header}.${claims}.${b64url(signature)}`;
}

async function appleTransactionLookup(transactionId: string, sandbox: boolean): Promise<Response> {
  const host = sandbox ? 'api.storekit-sandbox.itunes.apple.com' : 'api.storekit.itunes.apple.com';
  return fetch(`https://${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
    headers: { Authorization: `Bearer ${appleApiToken()}` },
  });
}

async function verifyAppleTransaction(jws: string, productId: string): Promise<VerifiedPurchase> {
  const claimed = decodeJwsPayload(jws);
  const id = claimed.transactionId;
  if (!id) throw new PurchaseVerificationError('Malformed transaction');

  let res = await appleTransactionLookup(id, false);
  // Not found in production: TestFlight / App Review purchases live in the sandbox.
  if (res.status === 404) res = await appleTransactionLookup(id, true);
  if (res.status === 404) throw new PurchaseVerificationError('Transaction not found');
  if (res.status === 401) throw new PurchaseVerificationError('App Store authorization failed', 502);
  if (!res.ok) throw new PurchaseVerificationError('App Store is unavailable', 502);

  const body = (await res.json()) as { signedTransactionInfo?: string };
  if (!body.signedTransactionInfo) throw new PurchaseVerificationError('Transaction not found');
  const tx = decodeJwsPayload(body.signedTransactionInfo);
  if (tx.bundleId !== IOS_BUNDLE_ID) throw new PurchaseVerificationError('Transaction belongs to a different app');
  if (tx.productId !== productId) throw new PurchaseVerificationError('Product mismatch');
  if (tx.revocationDate) throw new PurchaseVerificationError('Purchase was refunded');
  return {
    platform: 'ios',
    productId,
    transactionId: tx.originalTransactionId || tx.transactionId || id,
    ref: tx.originalTransactionId || tx.transactionId || id,
  };
}

export async function verifyApple(receiptData: string, productId: string): Promise<VerifiedPurchase> {
  // A JWS has three dot-separated parts; a StoreKit 1 app receipt is plain base64.
  if (receiptData.split('.').length === 3) return verifyAppleTransaction(receiptData, productId);
  return verifyAppleReceipt(receiptData, productId);
}

async function verifyAppleReceipt(receiptData: string, productId: string): Promise<VerifiedPurchase> {
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
    ref: item.original_transaction_id || item.transaction_id,
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

const PLAY_API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE}`;

function playProductUrl(productId: string, purchaseToken: string): string {
  return `${PLAY_API}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
}

export async function verifyGoogle(purchaseToken: string, productId: string): Promise<VerifiedPurchase> {
  const token = await googleAccessToken();
  const url = playProductUrl(productId, purchaseToken);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404 || res.status === 400) throw new PurchaseVerificationError('Purchase not found');
  if (!res.ok) throw new PurchaseVerificationError('Google Play is unavailable', 502);
  const data = (await res.json()) as { purchaseState?: number; acknowledgementState?: number };
  // purchaseState: 0 purchased, 1 canceled, 2 pending
  if (data.purchaseState !== 0) throw new PurchaseVerificationError('Purchase is not completed');

  // Acknowledge from the backend as well: Google refunds purchases that are not acknowledged
  // within 3 days, and the app-side acknowledgement can fail. Acknowledging twice is harmless.
  if (data.acknowledgementState === 0) {
    try {
      const ack = await fetch(`${url}:acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!ack.ok) console.error(`Play acknowledge failed (${ack.status})`);
    } catch (err) {
      console.error('Play acknowledge failed:', err);
    }
  }

  // The purchase token is the only identifier Google guarantees; orderId can be missing.
  return { platform: 'android', productId, transactionId: purchaseToken, ref: purchaseToken };
}

/** Purchase tokens Google reports as voided (refunded / canceled / charged back), cached briefly. */
let voidedCache: { tokens: Set<string>; fetchedAt: number } | null = null;

async function googleVoidedTokens(): Promise<Set<string> | null> {
  if (voidedCache && Date.now() - voidedCache.fetchedAt < 10 * 60_000) return voidedCache.tokens;
  const token = await googleAccessToken();
  const tokens = new Set<string>();
  let pageToken = '';
  for (let page = 0; page < 5; page++) {
    // type=0: in-app products only. Google only returns voids from the last 30 days.
    const url = `${PLAY_API}/purchases/voidedpurchases?type=0&maxResults=1000${pageToken ? `&token=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      voidedPurchases?: Array<{ purchaseToken?: string }>;
      tokenPagination?: { nextPageToken?: string };
    };
    for (const v of body.voidedPurchases ?? []) if (v.purchaseToken) tokens.add(v.purchaseToken);
    pageToken = body.tokenPagination?.nextPageToken ?? '';
    if (!pageToken) break;
  }
  voidedCache = { tokens, fetchedAt: Date.now() };
  return tokens;
}

// ---------------------------------------------------------------------------
// Refund reconciliation. Re-asks the store about an already-verified purchase.
// Anything uncertain (not configured, network error, pending) is 'unknown', which
// callers must treat as "leave the entitlement alone".
// ---------------------------------------------------------------------------
export async function checkPurchaseState(
  platform: string,
  ref: string,
  productId: string,
): Promise<PurchaseState> {
  try {
    if (platform === 'ios') {
      let res = await appleTransactionLookup(ref, false);
      if (res.status === 404) res = await appleTransactionLookup(ref, true);
      if (!res.ok) return 'unknown';
      const body = (await res.json()) as { signedTransactionInfo?: string };
      if (!body.signedTransactionInfo) return 'unknown';
      const tx = decodeJwsPayload(body.signedTransactionInfo);
      if (tx.productId !== productId) return 'unknown';
      return tx.revocationDate ? 'revoked' : 'active';
    }
    if (platform === 'android') {
      // The voided-purchases list is Google's source for refunds and chargebacks.
      const voided = await googleVoidedTokens().catch(() => null);
      if (voided?.has(ref)) return 'revoked';

      const token = await googleAccessToken();
      const res = await fetch(playProductUrl(productId, ref), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return 'unknown';
      const data = (await res.json()) as { purchaseState?: number };
      if (data.purchaseState === 0) return 'active';
      if (data.purchaseState === 1) return 'revoked'; // canceled
      return 'unknown';
    }
  } catch {
    // fall through
  }
  return 'unknown';
}
