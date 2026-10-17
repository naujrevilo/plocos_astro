/**
 * @module mercadopago
 * @description MercadoPago SDK wrapper for the Plocos webhook and
 * Checkout Pro flows (T11).
 *
 * This module is pure-ish: it wraps the SDK config and the
 * webhook signature verifier in functions that the rest of the app
 * can test and call. The SDK is only imported at module load; tests
 * that don't touch the SDK (e.g. signature verification) run
 * without needing network mocks.
 */
import crypto from 'node:crypto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

const FIVE_MINUTES_SECONDS = 5 * 60;

/**
 * Verify a MercadoPago webhook notification signature (v1).
 *
 * Headers expected on the request:
 *   - `x-signature`: `ts=<unix_seconds>,v1=<hex_hmac_sha256>`
 *   - `x-request-id`: arbitrary string
 *
 * The v1 HMAC is `HMAC-SHA256(MERCADOPAGO_WEBHOOK_SECRET, manifest)`
 * where `manifest = "id=<dataId>;request-id=<xRequestId>;ts=<ts>;"`.
 *
 * `dataId` is the resource id from the webhook payload (the payment
 * id, subscription id, etc). The function takes it explicitly so the
 * caller is forced to parse the body before verification — never
 * trust the signature before reading the data.
 */
export function verifyMPSignature(input: {
  dataId: string;
  xRequestId: string;
  xSignature: string;
  secret: string;
  nowMs?: number;
}): boolean {
  const now = input.nowMs ?? Date.now();
  const parsed = parseSignatureHeader(input.xSignature);
  if (!parsed) return false;

  const ageSeconds = Math.abs(now / 1000 - parsed.ts);
  if (ageSeconds > FIVE_MINUTES_SECONDS) return false;

  const manifest = `id=${input.dataId};request-id=${input.xRequestId};ts=${parsed.ts};`;
  const expected = crypto
    .createHmac('sha256', input.secret)
    .update(manifest)
    .digest('hex');

  const providedBuf = Buffer.from(parsed.v1, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Human-readable failure reason for logs. Pass the same inputs you
 * would have passed to verifyMPSignature. Returns null when the
 * signature is valid (defensive: only return non-null on rejection).
 */
export function signatureFailureReason(input: {
  dataId: string;
  xRequestId: string;
  xSignature: string;
  secret: string;
  nowMs?: number;
}): 'malformed_header' | 'stale_timestamp' | 'hmac_mismatch' | null {
  const now = input.nowMs ?? Date.now();
  const parsed = parseSignatureHeader(input.xSignature);
  if (!parsed) return 'malformed_header';
  const ageSeconds = Math.abs(now / 1000 - parsed.ts);
  if (ageSeconds > FIVE_MINUTES_SECONDS) return 'stale_timestamp';
  return 'hmac_mismatch';
}

function parseSignatureHeader(
  header: string,
): { ts: number; v1: string } | null {
  if (typeof header !== 'string' || header.length === 0) return null;
  const parts = header.split(',').map((segment) => {
    const idx = segment.indexOf('=');
    if (idx < 0) return null;
    return { key: segment.slice(0, idx), value: segment.slice(idx + 1) };
  });
  if (parts.some((p) => p === null)) return null;
  const map = Object.fromEntries(parts.map((p) => [p.key, p.value]));
  const ts = Number(map.ts);
  const v1 = map.v1;
  if (!Number.isFinite(ts) || !Number.isInteger(ts)) return null;
  if (typeof v1 !== 'string' || v1.length === 0) return null;
  return { ts, v1 };
}

/**
 * Build a configured MercadoPago client from the env. Throws if
 * MERCADOPAGO_ACCESS_TOKEN is missing. Use this in the API route
 * handler and in any server-side preference / payment call.
 */
export function createMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not set');
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
}

export { Payment, Preference };

/**
 * Shape of the subset of the MP preapproval (Suscripciones) object the
 * webhook handler needs. Fetched from GET /preapproval/{id}.
 */
export type Preapproval = {
  id: string;
  status: 'pending' | 'authorized' | 'paused' | 'cancelled';
  /** Our own Clerk user id, set when creating the subscription. */
  external_reference?: string;
  start_date?: string;
  next_payment_date?: string;
};

/**
 * Fetch the full preapproval object from the MP Subscriptions API.
 * The webhook notification only carries the id; the status and our
 * external_reference (Clerk user id) live here.
 */
export async function fetchPreapproval(
  id: string,
  accessToken: string = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '',
): Promise<Preapproval> {
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not set');
  }
  const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`fetchPreapproval failed: MP responded ${res.status}`);
  }
  return (await res.json()) as Preapproval;
}
