/**
 * T10d.1 — PayPal product and plans setup script
 *
 * `scripts/paypal-setup-plans.mjs` creates (or reuses) the catalog product
 * and the four subscription plans the checkout needs, and prints the
 * `PAYPAL_PLAN_*` env lines for `.env.local` and Netlify.
 *
 * Offline: the script takes its `fetch`, `env` and `log` from the caller,
 * so the tests never touch the network.
 */
import { describe, expect, it, vi } from 'vitest';
import { runSetup } from '../scripts/paypal-setup-plans.mjs';

const ENV = {
  PAYPAL_API_BASE: 'https://api-m.sandbox.paypal.com',
  PAYPAL_CLIENT_ID: 'client-id',
  PAYPAL_CLIENT_SECRET: 'client-secret',
};

const PRODUCT_NAME = 'Plocos Nomás que la Vida';

type ScriptCall = {
  url: string;
  method: string;
  body: Record<string, unknown> | undefined;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** A fake PayPal API: the catalog products and the billing plans it knows. */
function createFetch(products: unknown[] = [], plans: unknown[] = []) {
  const calls: ScriptCall[] = [];

  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body
      ? (JSON.parse(String(init.body)) as Record<string, unknown>)
      : undefined;
    calls.push({ url, method, body });

    const path = new URL(url).pathname;
    if (path === '/v1/oauth2/token') {
      return json({ access_token: 'token-1', expires_in: 3600 });
    }
    if (path === '/v1/catalogs/products') {
      if (method === 'GET') {
        return json({ products, total_items: products.length, total_pages: 1 });
      }
      return json({ id: 'PROD-1', name: body?.name }, 201);
    }
    if (path === '/v1/billing/plans') {
      if (method === 'GET') {
        return json({ plans, total_items: plans.length, total_pages: 1 });
      }
      const name = String(body?.name ?? '');
      return json({ id: `P-${name.replace(/ /g, '-').toUpperCase()}`, name }, 201);
    }
    throw new Error(`unexpected request: ${method} ${url}`);
  });

  return { fetch, calls };
}

function planPosts(calls: ScriptCall[]): ScriptCall[] {
  return calls.filter(
    (call) => call.method === 'POST' && new URL(call.url).pathname === '/v1/billing/plans',
  );
}

function productPosts(calls: ScriptCall[]): ScriptCall[] {
  return calls.filter(
    (call) => call.method === 'POST' && new URL(call.url).pathname === '/v1/catalogs/products',
  );
}

describe('T10d.1 — runSetup creates what is missing', () => {
  it('creates the service product and the four monthly plans', async () => {
    const { fetch, calls } = createFetch();
    const log = vi.fn();

    await runSetup({ fetch, env: ENV, log });

    // The product.
    expect(productPosts(calls)).toHaveLength(1);
    expect(productPosts(calls)[0]!.body).toEqual(
      expect.objectContaining({
        name: PRODUCT_NAME,
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    );

    // The plans.
    const posts = planPosts(calls);
    expect(posts).toHaveLength(4);
    const byName = new Map(posts.map((post) => [String(post.body?.name), post.body]));

    expect(byName.get('Plocos Lector USD')).toEqual(
      expect.objectContaining({
        product_id: 'PROD-1',
        billing_cycles: [
          expect.objectContaining({
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            frequency: expect.objectContaining({
              interval_unit: 'MONTH',
              interval_count: 1,
            }),
            pricing_scheme: expect.objectContaining({
              fixed_price: expect.objectContaining({ value: '5.00', currency_code: 'USD' }),
            }),
          }),
        ],
      }),
    );

    expect(byName.get('Plocos Lector EUR')).toEqual(
      expect.objectContaining({
        product_id: 'PROD-1',
        billing_cycles: [
          expect.objectContaining({
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            frequency: expect.objectContaining({
              interval_unit: 'MONTH',
              interval_count: 1,
            }),
            pricing_scheme: expect.objectContaining({
              fixed_price: expect.objectContaining({ value: '5.00', currency_code: 'EUR' }),
            }),
          }),
        ],
      }),
    );

    expect(byName.get('Plocos Colaborador USD')).toEqual(
      expect.objectContaining({
        product_id: 'PROD-1',
        billing_cycles: [
          expect.objectContaining({
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            frequency: expect.objectContaining({
              interval_unit: 'MONTH',
              interval_count: 1,
            }),
            pricing_scheme: expect.objectContaining({
              fixed_price: expect.objectContaining({ value: '10.00', currency_code: 'USD' }),
            }),
          }),
        ],
      }),
    );

    expect(byName.get('Plocos Colaborador EUR')).toEqual(
      expect.objectContaining({
        product_id: 'PROD-1',
        billing_cycles: [
          expect.objectContaining({
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            frequency: expect.objectContaining({
              interval_unit: 'MONTH',
              interval_count: 1,
            }),
            pricing_scheme: expect.objectContaining({
              fixed_price: expect.objectContaining({ value: '10.00', currency_code: 'EUR' }),
            }),
          }),
        ],
      }),
    );
  });

  it('prints the four PAYPAL_PLAN_* env lines', async () => {
    const { fetch } = createFetch();
    const log = vi.fn();

    await runSetup({ fetch, env: ENV, log });

    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_LECTOR_USD=P-PLOCOS-LECTOR-USD');
    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_LECTOR_EUR=P-PLOCOS-LECTOR-EUR');
    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_COLABORADOR_USD=P-PLOCOS-COLABORADOR-USD');
    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_COLABORADOR_EUR=P-PLOCOS-COLABORADOR-EUR');
  });
});

describe('T10d.1 — runSetup is idempotent', () => {
  it('creates nothing when the product and the plans already exist', async () => {
    const { fetch, calls } = createFetch(
      [{ id: 'PROD-EXISTING', name: PRODUCT_NAME }],
      [
        { id: 'P-EX-LECTOR-USD', name: 'Plocos Lector USD', product_id: 'PROD-EXISTING' },
        { id: 'P-EX-LECTOR-EUR', name: 'Plocos Lector EUR', product_id: 'PROD-EXISTING' },
        {
          id: 'P-EX-COLABORADOR-USD',
          name: 'Plocos Colaborador USD',
          product_id: 'PROD-EXISTING',
        },
        {
          id: 'P-EX-COLABORADOR-EUR',
          name: 'Plocos Colaborador EUR',
          product_id: 'PROD-EXISTING',
        },
      ],
    );
    const log = vi.fn();

    await runSetup({ fetch, env: ENV, log });

    expect(productPosts(calls)).toHaveLength(0);
    expect(planPosts(calls)).toHaveLength(0);
    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_LECTOR_USD=P-EX-LECTOR-USD');
    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_LECTOR_EUR=P-EX-LECTOR-EUR');
    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_COLABORADOR_USD=P-EX-COLABORADOR-USD');
    expect(log).toHaveBeenCalledWith('PAYPAL_PLAN_COLABORADOR_EUR=P-EX-COLABORADOR-EUR');
  });
});
