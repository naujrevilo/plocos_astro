/**
 * T11 - MercadoPago integration
 *
 * First slice: webhook signature verification (Red). The webhook
 * notification comes from MP with two headers:
 *   - x-signature: ts=<timestamp>,v1=<hex_hmac_sha256>
 *   - x-request-id: <string>
 *
 * The signature is HMAC-SHA256(secret, manifest) where the manifest
 * is built from the resource id, the request id, and the timestamp.
 * Per MP's IPN docs, the canonical v1 manifest template is:
 *   "id=<dataId>;request-id=<xRequestId>;ts=<ts>;"
 *
 * Replay protection: reject signatures older than 5 minutes.
 */
import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyMPSignature } from '../src/lib/mercadopago';

vi.mock('@clerk/astro/server', () => ({
  clerkClient: vi.fn(async () => ({
    users: { updateUserMetadata: vi.fn(async () => ({})) },
  })),
}));

vi.mock('../src/lib/db/subscriptions', () => ({
  activateSubscription: vi.fn(async () => ({ id: 1 })),
}));

vi.mock('../src/lib/mercadopago', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/mercadopago')>();
  return { ...actual, fetchPreapproval: vi.fn() };
});

const SECRET = 'test-webhook-secret-12345';
const MAX_AGE_SECONDS = 5 * 60;

function computeExpectedSignature(args: {
  dataId: string;
  xRequestId: string;
  ts: number;
  secret: string;
}): string {
  const manifest = `id:${args.dataId};request-id:${args.xRequestId};ts:${args.ts};`;
  return crypto.createHmac('sha256', args.secret).update(manifest).digest('hex');
}

function buildHeader(ts: number, v1: string): string {
  return `ts=${ts},v1=${v1}`;
}

describe('T11 - verifyMPSignature', () => {
  const dataId = '1234567890';
  const xRequestId = 'req-abc-123';
  const ts = 1_700_000_000;
  const nowMs = ts * 1000;

  it('accepts a valid signature (v1, fresh timestamp)', () => {
    const v1 = computeExpectedSignature({ dataId, xRequestId, ts, secret: SECRET });
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: buildHeader(ts, v1),
      secret: SECRET,
      nowMs,
    });
    expect(result).toBe(true);
  });

  it('rejects when the HMAC was signed with a different secret', () => {
    const v1 = computeExpectedSignature({
      dataId,
      xRequestId,
      ts,
      secret: 'wrong-secret',
    });
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: buildHeader(ts, v1),
      secret: SECRET,
      nowMs,
    });
    expect(result).toBe(false);
  });

  it('rejects when the manifest dataId was tampered with', () => {
    const v1 = computeExpectedSignature({ dataId, xRequestId, ts, secret: SECRET });
    const result = verifyMPSignature({
      dataId: 'different-resource-id',
      xRequestId,
      xSignature: buildHeader(ts, v1),
      secret: SECRET,
      nowMs,
    });
    expect(result).toBe(false);
  });

  it('rejects when the timestamp is older than 5 minutes (replay protection)', () => {
    const v1 = computeExpectedSignature({ dataId, xRequestId, ts, secret: SECRET });
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: buildHeader(ts, v1),
      secret: SECRET,
      nowMs: (ts + MAX_AGE_SECONDS + 1) * 1000,
    });
    expect(result).toBe(false);
  });

  it('accepts a signature exactly at the 5-minute boundary (inclusive)', () => {
    const v1 = computeExpectedSignature({ dataId, xRequestId, ts, secret: SECRET });
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: buildHeader(ts, v1),
      secret: SECRET,
      nowMs: (ts + MAX_AGE_SECONDS) * 1000,
    });
    expect(result).toBe(true);
  });

  it('rejects when the x-signature header is missing the v1 part', () => {
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: `ts=${ts}`,
      secret: SECRET,
      nowMs,
    });
    expect(result).toBe(false);
  });

  it('rejects when the x-signature header is missing the ts part', () => {
    const v1 = computeExpectedSignature({ dataId, xRequestId, ts, secret: SECRET });
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: `v1=${v1}`,
      secret: SECRET,
      nowMs,
    });
    expect(result).toBe(false);
  });

  it('rejects when the x-signature header is malformed garbage', () => {
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: 'not-a-valid-signature-header',
      secret: SECRET,
      nowMs,
    });
    expect(result).toBe(false);
  });

  it('rejects when the timestamp is not a number', () => {
    const v1 = computeExpectedSignature({ dataId, xRequestId, ts, secret: SECRET });
    const result = verifyMPSignature({
      dataId,
      xRequestId,
      xSignature: `ts=not-a-number,v1=${v1}`,
      secret: SECRET,
      nowMs,
    });
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T11 - POST /api/webhooks/mercadopago (handler)
// ---------------------------------------------------------------------------

function sign(dataId: string, xRequestId: string, ts: number, secret: string): string {
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

function buildRequest(args: {
  body: unknown;
  dataId?: string;
  xRequestId?: string;
  xSignature?: string | null;
}): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (args.xSignature !== null) {
    headers.set('x-signature', args.xSignature ?? sign(args.dataId ?? '123456', args.xRequestId ?? 'req-1', 1_700_000_000, SECRET));
  }
  if (args.xRequestId !== null) {
    headers.set('x-request-id', args.xRequestId ?? 'req-1');
  }
  return new Request('http://localhost/api/webhooks/mercadopago', {
    method: 'POST',
    headers,
    body: JSON.stringify(args.body),
  });
}

const PANEL_PAYLOAD = {
  action: 'updated',
  application_id: '5052374470578601',
  data: { id: '123456' },
  date: '2021-11-01T02:02:02Z',
  entity: 'preapproval',
  id: '123456',
  type: 'subscription_preapproval',
  version: 8,
};

async function callPost(request: Request) {
  const { POST } = await import('../src/pages/api/webhooks/mercadopago');
  return POST({ request } as any);
}

describe('T11 - POST /api/webhooks/mercadopago', () => {
  const NOW_MS = 1_700_000_000_000;

  beforeEach(() => {
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', SECRET);
    vi.useFakeTimers({ now: NOW_MS });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 500 when the webhook secret is not configured', async () => {
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', '');
    const res = await callPost(buildRequest({ body: PANEL_PAYLOAD }));
    expect(res.status).toBe(500);
  });

  it('returns 200 without processing when signature headers are missing (MP panel test)', async () => {
    const res = await callPost(buildRequest({ body: PANEL_PAYLOAD, xSignature: null }));
    expect(res.status).toBe(200);
    const mp = await import('../src/lib/mercadopago');
    expect(mp.fetchPreapproval).not.toHaveBeenCalled();

    const res2 = await callPost(buildRequest({ body: PANEL_PAYLOAD, xRequestId: null }));
    expect(res2.status).toBe(200);
    expect(mp.fetchPreapproval).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid signature', async () => {
    const res = await callPost(
      buildRequest({ body: PANEL_PAYLOAD, xSignature: 'ts=1,v1=deadbeef' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 and upgrades the role when the preapproval is authorized', async () => {
    const mp = await import('../src/lib/mercadopago');
    (mp.fetchPreapproval as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: '123456',
      status: 'authorized',
      external_reference: 'user_clerk_123',
      start_date: '2026-01-01T00:00:00Z',
      next_payment_date: '2026-02-01T00:00:00Z',
    });

    const res = await callPost(buildRequest({ body: PANEL_PAYLOAD }));
    expect(res.status).toBe(200);

    const { activateSubscription } = await import('../src/lib/db/subscriptions');
    expect(activateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkUserId: 'user_clerk_123',
        provider: 'mercadopago',
        providerSubscriptionId: '123456',
        plan: 'colaborador',
      }),
    );

    const { clerkClient } = await import('@clerk/astro/server');
    expect(clerkClient).toHaveBeenCalled();
  });

  it('returns 200 without any role change when the preapproval is cancelled', async () => {
    const mp = await import('../src/lib/mercadopago');
    (mp.fetchPreapproval as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: '123456',
      status: 'cancelled',
      external_reference: 'user_clerk_123',
    });

    const res = await callPost(buildRequest({ body: PANEL_PAYLOAD }));
    expect(res.status).toBe(200);

    const { activateSubscription } = await import('../src/lib/db/subscriptions');
    expect(activateSubscription).not.toHaveBeenCalled();
  });

  it('returns 200 silently for unknown event types (no retry loop)', async () => {
    const res = await callPost(
      buildRequest({ body: { ...PANEL_PAYLOAD, type: 'something_else' } }),
    );
    expect(res.status).toBe(200);
    const mp = await import('../src/lib/mercadopago');
    expect(mp.fetchPreapproval).not.toHaveBeenCalled();
  });

  it('returns 500 when the DB or Clerk write fails (so MP retries)', async () => {
    const mp = await import('../src/lib/mercadopago');
    (mp.fetchPreapproval as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: '123456',
      status: 'authorized',
      external_reference: 'user_clerk_123',
    });
    const { activateSubscription } = await import('../src/lib/db/subscriptions');
    (activateSubscription as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('db down'),
    );

    const res = await callPost(buildRequest({ body: PANEL_PAYLOAD }));
    expect(res.status).toBe(500);
  });
});
