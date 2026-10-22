/**
 * T10c — POST /api/webhooks/paypal
 *
 * Every event is signed in the test with an in-memory RSA key; the real
 * `verifyWebhookSignature` checks it against a certificate served by a stubbed
 * global `fetch`. Only `getSubscription` (PayPal API), the Turso helpers and
 * Clerk are mocked.
 *
 * Source of truth: for every handled event the handler reads the subscription
 * with GET /v1/billing/subscriptions/{id} and acts on THAT state, never on the
 * event type. Out-of-order and repeated deliveries therefore converge on
 * PayPal's current state.
 *
 * Policy (Log L6, L7 and the T10c request):
 *   ACTIVE                         → active + role + accessUntil (idempotent)
 *   ACTIVE, failed_payments_count>0 → past_due, role kept
 *   CANCELLED                      → canceled, role kept until accessUntil
 *   SUSPENDED                      → suspended, role removed
 *   EXPIRED                        → expired, role removed
 * "Role removed" means: unless another subscription of the user still grants
 * access; then Clerk gets the role and accessUntil the DB helpers return
 * (Log L14).
 *   APPROVAL_PENDING / APPROVED    → nothing
 */
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { updateUserMetadata } = vi.hoisted(() => ({
  updateUserMetadata: vi.fn(async () => ({})),
}));

vi.mock('@clerk/astro/server', () => ({
  clerkClient: vi.fn(async () => ({ users: { updateUserMetadata } })),
}));

vi.mock('../src/lib/db/subscriptions', () => ({
  activateSubscription: vi.fn(async (input: { plan: string; currentPeriodEnd?: Date | null }) => ({
    id: 1,
    role: input.plan,
    accessUntil: input.currentPeriodEnd ?? null,
  })),
  updateSubscriptionStatus: vi.fn(async (input: { revokeRole: boolean }) =>
    input.revokeRole ? { role: null, accessUntil: null } : undefined,
  ),
}));

vi.mock('../src/lib/paypal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/paypal')>();
  return { ...actual, getSubscription: vi.fn() };
});

import { activateSubscription, updateSubscriptionStatus } from '../src/lib/db/subscriptions';
import {
  getSubscription,
  resetPayPalCaches,
  SubscriptionNotFoundError,
  type PayPalSubscription,
} from '../src/lib/paypal';
import { POST } from '../src/pages/api/webhooks/paypal';

const WEBHOOK_ID = '8PT597110X687430LKGECATA';
const CERT_URL =
  'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-ab66f33d';
const TRANSMISSION_ID = '69cd13f0-d67a-11e5-baa3-778b53f4ae55';
const TRANSMISSION_TIME = '2026-10-21T20:00:00Z';

const PLAN_LECTOR_EUR = 'P-LECTOR-EUR';
const PLAN_COLABORADOR_USD = 'P-COLABORADOR-USD';
const SUBSCRIPTION_ID = 'I-BW452GLLEP1G';
const NEXT_BILLING_TIME = '2026-11-21T10:00:00Z';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PUBLIC_PEM = publicKey.export({ type: 'spki', format: 'pem' }).toString();

const mocked = {
  getSubscription: getSubscription as unknown as ReturnType<typeof vi.fn>,
  activateSubscription: activateSubscription as unknown as ReturnType<typeof vi.fn>,
  updateSubscriptionStatus: updateSubscriptionStatus as unknown as ReturnType<typeof vi.fn>,
};

/** Raw body with spacing JSON.stringify would not reproduce. */
function eventBody(eventType: string, resource: Record<string, unknown>): string {
  return `{ "id": "WH-1", "event_type": "${eventType}",  "resource": ${JSON.stringify(resource)} }`;
}

function sign(rawBody: string, webhookId: string): string {
  const crc = zlib.crc32(Buffer.from(rawBody, 'utf8'));
  const message = `${TRANSMISSION_ID}|${TRANSMISSION_TIME}|${webhookId}|${crc}`;
  return crypto.createSign('SHA256').update(message).sign(privateKey, 'base64');
}

function signedRequest(
  rawBody: string,
  opts: { webhookId?: string; signedBody?: string; omit?: string } = {},
): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'paypal-transmission-id': TRANSMISSION_ID,
    'paypal-transmission-time': TRANSMISSION_TIME,
    'paypal-transmission-sig': sign(opts.signedBody ?? rawBody, opts.webhookId ?? WEBHOOK_ID),
    'paypal-cert-url': CERT_URL,
    'paypal-auth-algo': 'SHA256withRSA',
  };
  if (opts.omit) delete headers[opts.omit];
  return new Request('https://plocos.test/api/webhooks/paypal', {
    method: 'POST',
    headers,
    body: rawBody,
  });
}

async function callPost(request: Request): Promise<Response> {
  return POST({ request } as any) as Promise<Response>;
}

function subscription(overrides: Partial<PayPalSubscription> = {}): PayPalSubscription {
  return {
    id: SUBSCRIPTION_ID,
    status: 'ACTIVE',
    plan_id: PLAN_COLABORADOR_USD,
    custom_id: 'user_123',
    billing_info: { next_billing_time: NEXT_BILLING_TIME, failed_payments_count: 0 },
    ...overrides,
  };
}

const subscriptionEvent = (type: string, resource: Record<string, unknown> = {}) =>
  eventBody(`BILLING.SUBSCRIPTION.${type}`, { id: SUBSCRIPTION_ID, ...resource });

let certFetch: ReturnType<typeof vi.fn>;
let info: ReturnType<typeof vi.spyOn>;
let warn: ReturnType<typeof vi.spyOn>;

/** True when any info/warn log line contains `text`. */
function logged(text: string): boolean {
  return [...info.mock.calls, ...warn.mock.calls].some((args) =>
    args.some((arg: unknown) => String(arg).includes(text)),
  );
}

function expectNothingTouched() {
  expect(mocked.activateSubscription).not.toHaveBeenCalled();
  expect(mocked.updateSubscriptionStatus).not.toHaveBeenCalled();
  expect(updateUserMetadata).not.toHaveBeenCalled();
}

beforeEach(() => {
  resetPayPalCaches();
  vi.clearAllMocks();
  vi.stubEnv('PAYPAL_API_BASE', 'https://api-m.sandbox.paypal.com');
  vi.stubEnv('PAYPAL_CLIENT_ID', 'client-id');
  vi.stubEnv('PAYPAL_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('PAYPAL_WEBHOOK_ID', WEBHOOK_ID);
  vi.stubEnv('PAYPAL_PLAN_LECTOR_USD', 'P-LECTOR-USD');
  vi.stubEnv('PAYPAL_PLAN_LECTOR_EUR', PLAN_LECTOR_EUR);
  vi.stubEnv('PAYPAL_PLAN_COLABORADOR_USD', PLAN_COLABORADOR_USD);
  vi.stubEnv('PAYPAL_PLAN_COLABORADOR_EUR', 'P-COLABORADOR-EUR');
  certFetch = vi.fn(async () => new Response(PUBLIC_PEM, { status: 200 }));
  vi.stubGlobal('fetch', certFetch);
  mocked.getSubscription.mockResolvedValue(subscription());
  info = vi.spyOn(console, 'info').mockImplementation(() => {});
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ----------------------------------------------------------------------------
// 1. Signature
// ----------------------------------------------------------------------------

describe('T10c — webhook signature', () => {
  it('processes an event signed for PAYPAL_WEBHOOK_ID', async () => {
    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(200);
    expect(certFetch).toHaveBeenCalledWith(CERT_URL, expect.anything());
    expect(mocked.getSubscription).toHaveBeenCalledWith(SUBSCRIPTION_ID);
    expect(mocked.activateSubscription).toHaveBeenCalledTimes(1);
  });

  it('answers 200 and logs a simulator event without touching anything', async () => {
    const body = subscriptionEvent('ACTIVATED');
    const res = await callPost(signedRequest(body, { webhookId: 'WEBHOOK_ID' }));

    expect(res.status).toBe(200);
    expect(logged('simulat')).toBe(true);
    expect(mocked.getSubscription).not.toHaveBeenCalled();
    expectNothingTouched();
  });

  it('answers 401 when the signature does not match the body', async () => {
    const body = subscriptionEvent('ACTIVATED');
    const res = await callPost(
      signedRequest(body, { signedBody: subscriptionEvent('CANCELLED') }),
    );

    expect(res.status).toBe(401);
    expect(mocked.getSubscription).not.toHaveBeenCalled();
    expectNothingTouched();
  });

  it('answers 401 when a signature header is missing', async () => {
    const res = await callPost(
      signedRequest(subscriptionEvent('ACTIVATED'), { omit: 'paypal-transmission-sig' }),
    );

    expect(res.status).toBe(401);
    expectNothingTouched();
  });

  it.each([
    ['a non-2xx answer', () => new Response('', { status: 503 })],
    ['a network error or refused redirect', () => Promise.reject(new TypeError('fetch failed'))],
  ])('answers 503 so PayPal retries when the certificate download fails (%s)', async (_, reply) => {
    vi.stubGlobal('fetch', vi.fn(async () => reply()));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(503);
    expect(mocked.getSubscription).not.toHaveBeenCalled();
    expectNothingTouched();
  });

  it('answers 500 when PAYPAL_WEBHOOK_ID is not configured', async () => {
    vi.stubEnv('PAYPAL_WEBHOOK_ID', '');

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(500);
    expectNothingTouched();
  });

  it('answers 400 when a correctly signed body is not JSON', async () => {
    const res = await callPost(signedRequest('not json'));

    expect(res.status).toBe(400);
    expectNothingTouched();
  });

  // The real simulator delivery (X.509 certificate, Log L9/L17) is covered by
  // tests/t10c-paypal-fixture.test.ts.
});

// ----------------------------------------------------------------------------
// 2. Source of truth: GET /v1/billing/subscriptions/{id}
// ----------------------------------------------------------------------------

describe('T10c — the subscription read from PayPal is the source of truth', () => {
  it('ignores the event type: ACTIVATED with a CANCELLED subscription marks it canceled', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ status: 'CANCELLED' }));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(200);
    expect(mocked.activateSubscription).not.toHaveBeenCalled();
    expect(mocked.updateSubscriptionStatus).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId: SUBSCRIPTION_ID,
      status: 'canceled',
      revokeRole: false,
    });
  });

  // CANCELLED is terminal in PayPal; SUSPENDED is the state that can return to ACTIVE.
  it('a late SUSPENDED event for a subscription that is ACTIVE again keeps it active', async () => {
    const res = await callPost(signedRequest(subscriptionEvent('SUSPENDED')));

    expect(res.status).toBe(200);
    expect(mocked.updateSubscriptionStatus).not.toHaveBeenCalled();
    expect(mocked.activateSubscription).toHaveBeenCalledTimes(1);
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: 'colaborador', accessUntil: '2026-11-21T10:00:00.000Z' },
    });
  });

  it('takes the Clerk user from the subscription custom_id, not from the event', async () => {
    const body = subscriptionEvent('ACTIVATED', { custom_id: 'user_from_event' });

    await callPost(signedRequest(body));

    expect(mocked.activateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ clerkUserId: 'user_123' }),
    );
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', expect.anything());
  });

  it('a repeated delivery applies exactly the same change again', async () => {
    const body = subscriptionEvent('ACTIVATED');

    await callPost(signedRequest(body));
    await callPost(signedRequest(body));

    expect(mocked.activateSubscription).toHaveBeenCalledTimes(2);
    expect(mocked.activateSubscription.mock.calls[1]).toEqual(
      mocked.activateSubscription.mock.calls[0],
    );
    expect(updateUserMetadata.mock.calls[1]).toEqual(updateUserMetadata.mock.calls[0]);
  });
});

// ----------------------------------------------------------------------------
// 3. Approved policy
// ----------------------------------------------------------------------------

describe('T10c — approved policy', () => {
  it('ACTIVATED → active, role and accessUntil from next_billing_time', async () => {
    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(200);
    expect(mocked.activateSubscription).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId: SUBSCRIPTION_ID,
      plan: 'colaborador',
      currentPeriodEnd: new Date(NEXT_BILLING_TIME),
    });
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: 'colaborador', accessUntil: '2026-11-21T10:00:00.000Z' },
    });
  });

  it('maps the plan_id to the plan through PAYPAL_PLAN_<PLAN>_<CURRENCY>', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ plan_id: PLAN_LECTOR_EUR }));

    await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(mocked.activateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'lector' }),
    );
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: 'lector', accessUntil: '2026-11-21T10:00:00.000Z' },
    });
  });

  it('PAYMENT.SALE.COMPLETED renews accessUntil, reading the subscription by billing_agreement_id', async () => {
    const renewed = '2026-12-21T10:00:00Z';
    mocked.getSubscription.mockResolvedValue(
      subscription({ billing_info: { next_billing_time: renewed, failed_payments_count: 0 } }),
    );
    const body = eventBody('PAYMENT.SALE.COMPLETED', {
      id: '80021663DE681814L',
      billing_agreement_id: SUBSCRIPTION_ID,
      state: 'completed',
    });

    const res = await callPost(signedRequest(body));

    expect(res.status).toBe(200);
    expect(mocked.getSubscription).toHaveBeenCalledWith(SUBSCRIPTION_ID);
    expect(mocked.activateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ currentPeriodEnd: new Date(renewed) }),
    );
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: 'colaborador', accessUntil: '2026-12-21T10:00:00.000Z' },
    });
  });

  it('PAYMENT.SALE.COMPLETED without billing_agreement_id (not a subscription) → 200 + log', async () => {
    const body = eventBody('PAYMENT.SALE.COMPLETED', { id: '80021663DE681814L' });

    const res = await callPost(signedRequest(body));

    expect(res.status).toBe(200);
    expect(logged('billing_agreement_id')).toBe(true);
    expect(mocked.getSubscription).not.toHaveBeenCalled();
    expectNothingTouched();
  });

  it('CANCELLED → canceled, keeps the role and accessUntil', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ status: 'CANCELLED' }));

    const res = await callPost(signedRequest(subscriptionEvent('CANCELLED')));

    expect(res.status).toBe(200);
    expect(mocked.updateSubscriptionStatus).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId: SUBSCRIPTION_ID,
      status: 'canceled',
      revokeRole: false,
    });
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it.each([
    ['SUSPENDED', 'suspended'],
    ['EXPIRED', 'expired'],
  ] as const)('%s → %s and removes the role in Turso and Clerk', async (status, dbStatus) => {
    mocked.getSubscription.mockResolvedValue(subscription({ status }));

    const res = await callPost(signedRequest(subscriptionEvent(status)));

    expect(res.status).toBe(200);
    expect(mocked.updateSubscriptionStatus).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId: SUBSCRIPTION_ID,
      status: dbStatus,
      revokeRole: true,
    });
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: null, accessUntil: null },
    });
    expect(mocked.activateSubscription).not.toHaveBeenCalled();
  });

  it('SUSPENDED of A keeps the role in Clerk when another subscription still grants access', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ status: 'SUSPENDED' }));
    mocked.updateSubscriptionStatus.mockResolvedValueOnce({
      role: 'colaborador',
      accessUntil: new Date('2026-12-01T00:00:00Z'),
    });

    const res = await callPost(signedRequest(subscriptionEvent('SUSPENDED')));

    expect(res.status).toBe(200);
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: 'colaborador', accessUntil: '2026-12-01T00:00:00.000Z' },
    });
  });

  it('a lector activation writes the role activateSubscription keeps (colaborador from MercadoPago)', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ plan_id: PLAN_LECTOR_EUR }));
    mocked.activateSubscription.mockResolvedValueOnce({
      id: 1,
      role: 'colaborador',
      accessUntil: new Date('2026-12-01T00:00:00Z'),
    });

    await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(mocked.activateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'lector' }),
    );
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: 'colaborador', accessUntil: '2026-12-01T00:00:00.000Z' },
    });
  });

  it('ACTIVE without next_billing_time clears accessUntil in Clerk and currentPeriodEnd in Turso', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ billing_info: undefined }));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(200);
    expect(mocked.activateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ currentPeriodEnd: null }),
    );
    expect(updateUserMetadata).toHaveBeenCalledWith('user_123', {
      publicMetadata: { role: 'colaborador', accessUntil: null },
    });
  });

  it('PAYMENT.FAILED (ACTIVE with failed payments) → past_due, keeps the role', async () => {
    mocked.getSubscription.mockResolvedValue(
      subscription({
        billing_info: { next_billing_time: NEXT_BILLING_TIME, failed_payments_count: 1 },
      }),
    );

    const res = await callPost(signedRequest(subscriptionEvent('PAYMENT.FAILED')));

    expect(res.status).toBe(200);
    expect(mocked.updateSubscriptionStatus).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId: SUBSCRIPTION_ID,
      status: 'past_due',
      revokeRole: false,
    });
    expect(mocked.activateSubscription).not.toHaveBeenCalled();
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it.each(['APPROVAL_PENDING', 'APPROVED'] as const)(
    '%s (not paid yet) → 200 without changes',
    async (status) => {
      mocked.getSubscription.mockResolvedValue(subscription({ status }));

      const res = await callPost(signedRequest(subscriptionEvent('CREATED')));

      expect(res.status).toBe(200);
      expectNothingTouched();
    },
  );
});

// ----------------------------------------------------------------------------
// 4. Unknown events, permanent and transient errors
// ----------------------------------------------------------------------------

describe('T10c — unknown events and errors', () => {
  it('unknown event type → 200 + log, no PayPal lookup', async () => {
    const body = eventBody('CHECKOUT.ORDER.APPROVED', { id: 'ORDER-1' });

    const res = await callPost(signedRequest(body));

    expect(res.status).toBe(200);
    expect(logged('CHECKOUT.ORDER.APPROVED')).toBe(true);
    expect(mocked.getSubscription).not.toHaveBeenCalled();
    expectNothingTouched();
  });

  it('subscription missing in PayPal (404) → 200 + log, like T11', async () => {
    mocked.getSubscription.mockRejectedValue(new SubscriptionNotFoundError(SUBSCRIPTION_ID));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(200);
    expect(logged(SUBSCRIPTION_ID)).toBe(true);
    expectNothingTouched();
  });

  it('subscription without custom_id → 200 + log (nobody to grant)', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ custom_id: undefined }));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(200);
    expect(logged('custom_id')).toBe(true);
    expectNothingTouched();
  });

  it('transient PayPal API failure → 500 so PayPal retries', async () => {
    mocked.getSubscription.mockRejectedValue(new Error('PayPal subscription request failed: 500'));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(500);
    expectNothingTouched();
  });

  it('DB or Clerk write failure → 500 so PayPal retries', async () => {
    mocked.activateSubscription.mockRejectedValue(new Error('turso down'));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(500);
  });

  it('ACTIVE subscription with a plan_id outside PAYPAL_PLAN_* → 500 (configuration error, retried)', async () => {
    mocked.getSubscription.mockResolvedValue(subscription({ plan_id: 'P-UNKNOWN' }));

    const res = await callPost(signedRequest(subscriptionEvent('ACTIVATED')));

    expect(res.status).toBe(500);
    expectNothingTouched();
  });
});
