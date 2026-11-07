#!/usr/bin/env node
/**
 * PayPal sandbox setup — product and subscription plans (T10d.1).
 *
 * Creates (or reuses) one catalog product and the four subscription plans
 * the checkout needs, then prints the env lines for `.env.local` and Netlify:
 *
 *   PAYPAL_PRODUCT_ID=PROD-…
 *   PAYPAL_PLAN_LECTOR_USD=P-…
 *   PAYPAL_PLAN_LECTOR_EUR=P-…
 *   PAYPAL_PLAN_COLABORADOR_USD=P-…
 *   PAYPAL_PLAN_COLABORADOR_EUR=P-…
 *
 * Idempotent: an existing product (same name) and an existing plan (same
 * name and same product) are reused, never duplicated.
 *
 * The script never runs by itself: `runSetup` takes its `fetch`, `env` and
 * `log` from the caller, so the tests run offline.
 *
 * Run it with Node 20+ (no dependencies). The user loads `.env.local`:
 *
 *   node --env-file=.env.local scripts/paypal-setup-plans.mjs
 */

import { pathToFileURL } from 'node:url';

/** The catalog product the four plans belong to. */
const PRODUCT_NAME = 'Plocos Nomás que la Vida';
const PRODUCT_TYPE = 'SERVICE';
const PRODUCT_CATEGORY = 'SOFTWARE';

/**
 * The four plans. PayPal allows only one currency per plan
 * ("Only one `currency_code` is allowed per subscription plan"), so the plan
 * is duplicated per currency (T10d, Log L20).
 */
const PLANS = [
  { key: 'LECTOR_USD', name: 'Plocos Lector USD', price: '5.00', currency: 'USD' },
  { key: 'LECTOR_EUR', name: 'Plocos Lector EUR', price: '5.00', currency: 'EUR' },
  { key: 'COLABORADOR_USD', name: 'Plocos Colaborador USD', price: '10.00', currency: 'USD' },
  { key: 'COLABORADOR_EUR', name: 'Plocos Colaborador EUR', price: '10.00', currency: 'EUR' },
];

/** Give up on a PayPal API call after this long. */
const API_TIMEOUT_MS = 30_000;

/** Hard stop for the pagination loops (never reached in practice). */
const MAX_PAGES = 20;

/** @param {Record<string, string | undefined>} env */
function requireEnv(env, name) {
  const value = env?.[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

/**
 * Call the API with a deadline: the script is interactive, a hung request
 * would hang it forever.
 */
async function fetchWithTimeout(doFetch, url, init) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`PayPal API request timed out after ${API_TIMEOUT_MS} ms`)),
    API_TIMEOUT_MS,
  );
  timer.unref?.();
  try {
    return await doFetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** The error detail of a failed response, as a short string. */
async function describeError(res) {
  let detail = '';
  try {
    detail = await res.text();
  } catch {
    detail = '';
  }
  return detail ? `${res.status} ${detail}` : String(res.status);
}

/**
 * Ask for an access token (OAuth2 client credentials).
 *
 * PayPal documents the grant as a form-encoded body
 * (`grant_type=client_credentials`); some gateways only read a JSON body, so
 * the request is retried once with the JSON shape when the first attempt
 * does not get a usable answer.
 */
async function requestToken(doFetch, apiBase, clientId, clientSecret) {
  const authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  const attempts = [
    {
      contentType: 'application/x-www-form-urlencoded',
      body: 'grant_type=client_credentials',
    },
    {
      contentType: 'application/json',
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    },
  ];

  const failures = [];
  for (const attempt of attempts) {
    let res;
    try {
      res = await fetchWithTimeout(doFetch, `${apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: { authorization, 'content-type': attempt.contentType },
        body: attempt.body,
      });
    } catch (err) {
      failures.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    if (res.status === 400 || res.status === 415) {
      // The body shape was refused: try the other one.
      failures.push(`PayPal OAuth token request failed: ${await describeError(res)}`);
      continue;
    }
    if (!res.ok) {
      throw new Error(`PayPal OAuth token request failed: ${await describeError(res)}`);
    }

    const json = await res.json();
    if (typeof json?.access_token !== 'string' || json.access_token.length === 0) {
      throw new Error('PayPal OAuth token response is missing access_token');
    }
    return json.access_token;
  }

  throw new Error(`PayPal OAuth token request failed: ${failures.join(' / ')}`);
}

/**
 * Read every page of a collection (`products` or `plans`).
 */
async function listAll({ doFetch, apiBase, path, key, token }) {
  const items = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    const res = await fetchWithTimeout(doFetch, `${apiBase}${path}?page=${page}`, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`PayPal GET ${path} failed: ${await describeError(res)}`);
    }

    const json = await res.json();
    const batch = Array.isArray(json?.[key]) ? json[key] : [];
    items.push(...batch);
    totalPages =
      Number.isInteger(json?.total_pages) && json.total_pages > 0 ? json.total_pages : 1;
    page += 1;
  }

  return items;
}

/** Reuse the product with the expected name, or create it. */
async function ensureProduct({ doFetch, apiBase, token }) {
  const products = await listAll({
    doFetch,
    apiBase,
    path: '/v1/catalogs/products',
    key: 'products',
    token,
  });
  const existing = products.find((product) => product?.name === PRODUCT_NAME);
  if (existing && typeof existing.id === 'string') {
    return existing.id;
  }

  const res = await fetchWithTimeout(doFetch, `${apiBase}/v1/catalogs/products`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: PRODUCT_NAME,
      type: PRODUCT_TYPE,
      category: PRODUCT_CATEGORY,
      description: 'Suscripción a la plataforma de lectura de Plocos, No más que la Vida.',
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal product creation failed: ${await describeError(res)}`);
  }

  const created = await res.json();
  if (typeof created?.id !== 'string' || created.id.length === 0) {
    throw new Error('PayPal product creation returned no id');
  }
  return created.id;
}

/** Reuse the plan with the expected name on this product, or create it. */
async function ensurePlan({ doFetch, apiBase, token, productId, plan, existingPlans }) {
  const existing = existingPlans.find(
    (candidate) => candidate?.name === plan.name && candidate?.product_id === productId,
  );
  if (existing && typeof existing.id === 'string') {
    return existing.id;
  }

  const res = await fetchWithTimeout(doFetch, `${apiBase}/v1/billing/plans`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      name: plan.name,
      description: `Suscripción mensual de Plocos, No más que la Vida (${plan.currency}).`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: plan.price, currency_code: plan.currency },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
        setup_fee: { currency_code: plan.currency, value: '0.00' },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal plan creation failed (${plan.name}): ${await describeError(res)}`);
  }

  const created = await res.json();
  if (typeof created?.id !== 'string' || created.id.length === 0) {
    throw new Error(`PayPal plan creation returned no id (${plan.name})`);
  }
  return created.id;
}

/**
 * Create (or reuse) the product and the four plans, and print the env lines.
 *
 * @param {{
 *   fetch: typeof fetch,
 *   env: Record<string, string | undefined>,
 *   log: (message: string) => void,
 * }} deps
 * @returns {Promise<{ productId: string, planIds: Record<string, string> }>}
 */
export async function runSetup({ fetch: doFetch, env, log }) {
  const apiBase = requireEnv(env, 'PAYPAL_API_BASE').replace(/\/+$/, '');
  const clientId = requireEnv(env, 'PAYPAL_CLIENT_ID');
  const clientSecret = requireEnv(env, 'PAYPAL_CLIENT_SECRET');

  const token = await requestToken(doFetch, apiBase, clientId, clientSecret);
  const productId = await ensureProduct({ doFetch, apiBase, token });

  // One listing for the four plans: the plan names are unique, so a plan
  // created here never shows up in the snapshot again.
  const existingPlans = await listAll({
    doFetch,
    apiBase,
    path: '/v1/billing/plans',
    key: 'plans',
    token,
  });

  const planIds = {};
  for (const plan of PLANS) {
    planIds[plan.key] = await ensurePlan({
      doFetch,
      apiBase,
      token,
      productId,
      plan,
      existingPlans,
    });
  }

  log(`PAYPAL_PRODUCT_ID=${productId}`);
  for (const plan of PLANS) {
    log(`PAYPAL_PLAN_${plan.key}=${planIds[plan.key]}`);
  }

  return { productId, planIds };
}

// Run as a CLI: `node --env-file=.env.local scripts/paypal-setup-plans.mjs`.
const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  runSetup({
    fetch: globalThis.fetch,
    env: process.env,
    log: (message) => console.log(message),
  }).catch((err) => {
    console.error(`PayPal setup failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  });
}
