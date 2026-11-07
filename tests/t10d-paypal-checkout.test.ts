/**
 * T10d.2 — PayPal checkout plumbing
 *
 * Two units under test:
 *   - `src/lib/paypal-plans.ts`: the (plan, currency) -> `PAYPAL_PLAN_*`
 *     mapping and its inverse, shared with the PayPal webhook.
 *   - `src/lib/paypal.ts`: `createSubscription`, the
 *     `POST /v1/billing/subscriptions` call that returns the approval link.
 *
 * Offline: every HTTP call goes through an injected `fetch`. The first call
 * is always the OAuth token request, the second one the API call.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSubscription, resetPayPalCaches } from '../src/lib/paypal';
import { paypalPlanFromId, paypalPlanId } from '../src/lib/paypal-plans';

const API_BASE = 'https://api-m.sandbox.paypal.com';
const APPROVE_URL = 'https://www.paypal.com/webapps/billing/subscriptions?ba_token=BA-1';

function stubPlanIds(): void {
  vi.stubEnv('PAYPAL_PLAN_LECTOR_USD', 'P-LECTOR-USD');
  vi.stubEnv('PAYPAL_PLAN_LECTOR_EUR', 'P-LECTOR-EUR');
  vi.stubEnv('PAYPAL_PLAN_COLABORADOR_USD', 'P-COLABORADOR-USD');
  vi.stubEnv('PAYPAL_PLAN_COLABORADOR_EUR', 'P-COLABORADOR-EUR');
}

beforeEach(() => {
  resetPayPalCaches();
  vi.stubEnv('PAYPAL_API_BASE', API_BASE);
  vi.stubEnv('PAYPAL_CLIENT_ID', 'client-id');
  vi.stubEnv('PAYPAL_CLIENT_SECRET', 'client-secret');
  stubPlanIds();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// T10d.2 — src/lib/paypal-plans.ts
// ----------------------------------------------------------------------------

describe('T10d.2 — paypalPlanId', () => {
  it('maps lector/USD to PAYPAL_PLAN_LECTOR_USD', () => {
    expect(paypalPlanId('lector', 'USD')).toBe('P-LECTOR-USD');
  });

  it('maps lector/EUR to PAYPAL_PLAN_LECTOR_EUR', () => {
    expect(paypalPlanId('lector', 'EUR')).toBe('P-LECTOR-EUR');
  });

  it('maps colaborador/USD to PAYPAL_PLAN_COLABORADOR_USD', () => {
    expect(paypalPlanId('colaborador', 'USD')).toBe('P-COLABORADOR-USD');
  });

  it('maps colaborador/EUR to PAYPAL_PLAN_COLABORADOR_EUR', () => {
    expect(paypalPlanId('colaborador', 'EUR')).toBe('P-COLABORADOR-EUR');
  });

  it('returns null when the plan is not configured for that currency', () => {
    vi.stubEnv('PAYPAL_PLAN_LECTOR_EUR', '');
    expect(paypalPlanId('lector', 'EUR')).toBeNull();
  });

  it('returns null when the env var is missing altogether', () => {
    vi.stubEnv('PAYPAL_PLAN_COLABORADOR_USD', '');
    expect(paypalPlanId('colaborador', 'USD')).toBeNull();
  });
});

describe('T10d.2 — paypalPlanFromId', () => {
  it('resolves a configured plan id to its plan', () => {
    expect(paypalPlanFromId('P-LECTOR-USD')).toBe('lector');
    expect(paypalPlanFromId('P-LECTOR-EUR')).toBe('lector');
  });

  it('resolves a configured colaborador plan id to its plan', () => {
    expect(paypalPlanFromId('P-COLABORADOR-USD')).toBe('colaborador');
    expect(paypalPlanFromId('P-COLABORADOR-EUR')).toBe('colaborador');
  });

  it('returns null for a plan id that is not one of ours', () => {
    expect(paypalPlanFromId('P-SOMEONE-ELSE')).toBeNull();
  });
});

// ----------------------------------------------------------------------------
// T10d.2 — createSubscription
// ----------------------------------------------------------------------------

function tokenResponse(token = 'token-1'): Response {
  return new Response(JSON.stringify({ access_token: token, expires_in: 3600 }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function subscriptionResponse(links: unknown[] = [
  { href: APPROVE_URL, rel: 'approve' },
  { href: 'https://www.paypal.com/cancel', rel: 'cancel' },
]): Response {
  return new Response(
    JSON.stringify({
      id: 'I-SUB1',
      status: 'APPROVAL_PENDING',
      plan_id: 'P-LECTOR-USD',
      links,
    }),
    { status: 201, headers: { 'content-type': 'application/json' } },
  );
}

const CREATE_INPUT = {
  planId: 'P-LECTOR-USD',
  customId: 'user_123',
  returnUrl: 'https://plocos.netlify.app/api/suscripcion/paypal/verify',
  cancelUrl: 'https://plocos.netlify.app/suscripcion?status=cancelled',
  brandName: 'Plocos',
  locale: 'es',
};

describe('T10d.2 — createSubscription', () => {
  it('POSTs the plan, the custom id and the return/cancel URLs to PayPal', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(subscriptionResponse());

    await createSubscription(CREATE_INPUT, { fetch, now: () => 0 });

    const [tokenUrl, tokenInit] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(tokenUrl).toBe(`${API_BASE}/v1/oauth2/token`);
    expect(tokenInit.method).toBe('POST');

    const [url, init] = fetch.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe(`${API_BASE}/v1/billing/subscriptions`);
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer token-1');

    const body = JSON.parse(String(init.body)) as {
      plan_id: string;
      custom_id: string;
      application_context: {
        return_url: string;
        cancel_url: string;
        user_action: string;
        shipping_preference: string;
        brand_name: string;
        locale: string;
      };
    };
    expect(body.plan_id).toBe('P-LECTOR-USD');
    expect(body.custom_id).toBe('user_123');
    expect(body.application_context.return_url).toBe(
      'https://plocos.netlify.app/api/suscripcion/paypal/verify',
    );
    expect(body.application_context.cancel_url).toBe(
      'https://plocos.netlify.app/suscripcion?status=cancelled',
    );
    expect(body.application_context.user_action).toBe('SUBSCRIBE_NOW');
    expect(body.application_context.shipping_preference).toBe('NO_SHIPPING');
    expect(body.application_context.brand_name).toBe('Plocos');
    expect(body.application_context.locale).toBe('es');
  });

  it('returns the subscription id, its status and the approval link', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(subscriptionResponse());

    const created = await createSubscription(CREATE_INPUT, { fetch, now: () => 0 });

    expect(created.id).toBe('I-SUB1');
    expect(created.status).toBe('APPROVAL_PENDING');
    expect(created.approveUrl).toBe(APPROVE_URL);
  });

  it('returns a null approval link when PayPal sends no approve link', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        subscriptionResponse([{ href: 'https://www.paypal.com/cancel', rel: 'cancel' }]),
      );

    const created = await createSubscription(CREATE_INPUT, { fetch, now: () => 0 });

    expect(created.approveUrl).toBeNull();
  });

  it('throws an error mentioning the status when PayPal rejects the request', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response('{"name":"UNPROCESSABLE_ENTITY"}', { status: 422 }));

    await expect(createSubscription(CREATE_INPUT, { fetch, now: () => 0 })).rejects.toThrow(
      /422/,
    );
  });
});
