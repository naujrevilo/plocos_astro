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
 * where `manifest = "id:<dataId>;request-id:<xRequestId>;ts:<ts>;"` — colons, per MP's official docs (support article 51017):
 *
 *   echo -n "id:$payment_id;request-id:$request_id;ts:$ts;" \
 *     | openssl dgst -sha256 -hmac 'secret_panel_webhooks'
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

  const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${parsed.ts};`;
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
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not set');
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
}

/**
 * Read the MP access token the Astro way: `import.meta.env` (Vite loads
 * `.env.local` there) with a `process.env` fallback for Node-only
 * contexts like Netlify Functions at runtime.
 */
function getAccessToken(): string | undefined {
  return (
    import.meta.env.MERCADOPAGO_ACCESS_TOKEN ??
    process.env.MERCADOPAGO_ACCESS_TOKEN ??
    undefined
  );
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
 * Response subset of POST /preapproval (create a subscription from a
 * plan). `init_point` is the MP-hosted checkout URL the user must be
 * redirected to.
 */
export type PreapprovalCreation = {
  id: string;
  init_point: string;
  status: string;
};

/**
 * Create a subscription (preapproval) without an associated plan:
 * recurrence and amount travel inline (`auto_recurring`), and the
 * preapproval is created in `pending` status so MP returns an
 * `init_point` where the payer authorizes on the MP-hosted page.
 *
 * Why not plan-associated: plans created via the MP panel are bound to
 * automatic card debit, and API-created preapprovals against them
 * demand a client-side `card_token_id`. The pending+init_point flow
 * needs no tokenization in our code and keeps `external_reference`
 * (our Clerk user id) intact — the ONLY binding the webhook can use
 * to map the approval back to the subscriber.
 */
export async function createPreapprovalSubscription(input: {
  payerEmail: string;
  externalReference: string;
  backUrl: string;
  reason: string;
  /** Monthly amount in the given currency (must exceed the country minimum). */
  amount: number;
  currency?: string;
  frequency?: number;
  frequencyType?: 'months' | 'days';
  accessToken?: string;
}): Promise<PreapprovalCreation> {
  const accessToken = input.accessToken ?? getAccessToken() ?? '';
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not set');
  }
  const res = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payer_email: input.payerEmail,
      external_reference: input.externalReference,
      back_url: input.backUrl,
      reason: input.reason,
      auto_recurring: {
        frequency: input.frequency ?? 1,
        frequency_type: input.frequencyType ?? 'months',
        transaction_amount: input.amount,
        currency_id: input.currency ?? 'COP',
      },
      status: 'pending',
    }),
  });
  if (!res.ok) {
    // Surface MP's error body: 400s here carry the real reason
    // (e.g. amounts below the country minimum).
    const errorBody = await res.text();
    throw new Error(
      `createPreapprovalSubscription failed: MP responded ${res.status}: ${errorBody}`,
    );
  }
  return (await res.json()) as PreapprovalCreation;
}

/**
 * Thrown when MP answers 404 for a preapproval id: the resource was
 * deleted or never existed (e.g. the panel's simulated test id).
 * Permanent — the webhook handler must NOT ask MP to retry.
 */
export class PreapprovalNotFoundError extends Error {
  constructor(public readonly preapprovalId: string) {
    super(`Preapproval ${preapprovalId} not found (MP responded 404)`);
    this.name = 'PreapprovalNotFoundError';
  }
}

/**
 * Fetch the full preapproval object from the MP Subscriptions API.
 * The webhook notification only carries the id; the status and our
 * external_reference (Clerk user id) live here.
 */
export async function fetchPreapproval(
  id: string,
  accessToken: string = getAccessToken() ?? '',
): Promise<Preapproval> {
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not set');
  }
  const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) {
    throw new PreapprovalNotFoundError(id);
  }
  if (!res.ok) {
    throw new Error(`fetchPreapproval failed: MP responded ${res.status}`);
  }
  return (await res.json()) as Preapproval;
}
