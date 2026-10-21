/**
 * @module paypal
 * @description PayPal REST wrapper (T10b): config, OAuth token and webhook
 * signature self-verification; reading a subscription (T10c). Plain REST over `fetch`, no SDK
 * (`@paypal/checkout-server-sdk` is deprecated and `@paypal/paypal-server-sdk`
 * covers neither catalog products nor webhook verification).
 *
 * Webhook self-verification (developer.paypal.com/api/rest/webhooks/rest):
 *   signed message = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32}`
 *   - crc32 is computed over the RAW body, in decimal. Never parse and
 *     re-serialize the body first.
 *   - `paypal-transmission-sig` is a base64 SHA256withRSA signature, checked
 *     with the public key of the certificate at `paypal-cert-url`.
 *   - Simulator (mock) events are signed with the literal webhook id
 *     "WEBHOOK_ID": they verify as `simulated`, never as `valid`.
 *
 * Every HTTP call goes through an injectable `fetch` so tests run offline.
 */
import crypto from 'node:crypto';
import zlib from 'node:zlib';

export type WebhookVerification = 'valid' | 'simulated' | 'invalid';

export interface PayPalDeps {
  fetch?: typeof fetch;
  now?: () => number;
}

export interface PayPalConfig {
  apiBase: string;
  clientId: string;
  clientSecret: string;
}

/** Webhook id PayPal uses to sign events sent from the webhook simulator. */
export const SIMULATOR_WEBHOOK_ID = 'WEBHOOK_ID';

/** Exact hosts allowed to serve the webhook signing certificate. */
const CERT_HOSTS = new Set(['api.paypal.com', 'api.sandbox.paypal.com']);

/** Path prefix of PayPal's signing certificates (`/v1/notifications/certs/CERT-…`). */
const CERT_PATH_PREFIX = '/v1/notifications/certs/';

/** Give up on a PayPal API call (OAuth token or REST request) after this long. */
export const PAYPAL_API_TIMEOUT_MS = 8_000;

/** Refresh the OAuth token this long before PayPal says it expires. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

// Env vars are read the Astro way: `import.meta.env` (Vite loads `.env.local`
// there and replaces static accesses at build time) with a `process.env`
// fallback for Node-only contexts. Each access is spelled out on purpose; a
// dynamic `import.meta.env[name]` is not replaced at build time.
const ENV = {
  PAYPAL_API_BASE: () => import.meta.env.PAYPAL_API_BASE ?? process.env.PAYPAL_API_BASE,
  PAYPAL_CLIENT_ID: () => import.meta.env.PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: () =>
    import.meta.env.PAYPAL_CLIENT_SECRET ?? process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_WEBHOOK_ID: () => import.meta.env.PAYPAL_WEBHOOK_ID ?? process.env.PAYPAL_WEBHOOK_ID,
} as const;

function requireEnv(name: keyof typeof ENV): string {
  const value = ENV[name]();
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getPayPalConfig(): PayPalConfig {
  return {
    apiBase: requireEnv('PAYPAL_API_BASE'),
    clientId: requireEnv('PAYPAL_CLIENT_ID'),
    clientSecret: requireEnv('PAYPAL_CLIENT_SECRET'),
  };
}

// ----------------------------------------------------------------------------
// Webhook signature
// ----------------------------------------------------------------------------

export function buildSignedMessage(args: {
  transmissionId: string;
  transmissionTime: string;
  webhookId: string;
  rawBody: string;
}): string {
  const crc = zlib.crc32(Buffer.from(args.rawBody, 'utf8'));
  return `${args.transmissionId}|${args.transmissionTime}|${args.webhookId}|${crc}`;
}

/**
 * Only https URLs on an exact PayPal host, default port, no credentials, and
 * under the certificates path. The path is checked after URL normalization,
 * so `..` segments cannot escape it.
 */
export function isAllowedCertUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === 'https:' &&
    CERT_HOSTS.has(parsed.hostname) &&
    parsed.port === '' &&
    parsed.username === '' &&
    parsed.password === '' &&
    parsed.pathname.startsWith(CERT_PATH_PREFIX) &&
    parsed.pathname.length > CERT_PATH_PREFIX.length
  );
}

/**
 * Give up on the certificate download after this long. Netlify's synchronous
 * function limit is 60 s and cannot be configured
 * (https://docs.netlify.com/build/functions/configuration/); the worst case
 * here is this plus four PayPal API calls (token + GET, twice on a 401).
 */
export const CERT_FETCH_TIMEOUT_MS = 5_000;

/**
 * The signing certificate could not be downloaded (network, timeout,
 * redirect or non-2xx). Transient: the webhook answers 5xx so PayPal retries.
 */
export class CertificateUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CertificateUnavailableError';
  }
}

const certCache = new Map<string, string>();

/**
 * Download the certificate with a timeout and without following redirects:
 * the allow-list checks the URL PayPal sent, and a redirect would bypass it.
 * PayPal's docs only ask to cache the certificate; they say nothing about
 * timeouts or redirects.
 */
async function defaultFetchCert(url: string): Promise<string> {
  // A plain setTimeout (not AbortSignal.timeout) so tests can fake the clock.
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`timed out after ${CERT_FETCH_TIMEOUT_MS} ms`)),
    CERT_FETCH_TIMEOUT_MS,
  );
  try {
    const res = await fetch(url, { redirect: 'error', signal: controller.signal });
    if (!res.ok) {
      throw new Error(`PayPal certificate download failed: ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getCertificate(
  url: string,
  fetchCert: (url: string) => Promise<string>,
): Promise<string> {
  const cached = certCache.get(url);
  if (cached !== undefined) return cached;
  // Failures are not cached: a transient download error must not stick.
  let pem: string;
  try {
    pem = await fetchCert(url);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new CertificateUnavailableError(`PayPal certificate download failed: ${reason}`);
  }
  certCache.set(url, pem);
  return pem;
}

function signatureMatches(message: string, signature: string, pem: string): boolean {
  try {
    return crypto.createVerify('SHA256').update(message).verify(pem, signature, 'base64');
  } catch {
    return false;
  }
}

/**
 * Verify a webhook delivery against its raw body. Returns `valid` when it is
 * signed for `webhookId` (default `PAYPAL_WEBHOOK_ID`), `simulated` when it is
 * a simulator event signed with "WEBHOOK_ID", and `invalid` otherwise. A
 * missing header or a certificate URL outside the allow-list is `invalid`
 * without downloading anything.
 */
export async function verifyWebhookSignature(args: {
  rawBody: string;
  headers: Headers;
  webhookId?: string;
  fetchCert?: (url: string) => Promise<string>;
}): Promise<WebhookVerification> {
  const webhookId = args.webhookId ?? requireEnv('PAYPAL_WEBHOOK_ID');
  // With the simulator id configured, mock events would verify as `valid`.
  if (webhookId === SIMULATOR_WEBHOOK_ID) {
    throw new Error(`PAYPAL_WEBHOOK_ID must not be the simulator id "${SIMULATOR_WEBHOOK_ID}"`);
  }
  const transmissionId = args.headers.get('paypal-transmission-id');
  const transmissionTime = args.headers.get('paypal-transmission-time');
  const signature = args.headers.get('paypal-transmission-sig');
  const certUrl = args.headers.get('paypal-cert-url');
  if (!transmissionId || !transmissionTime || !signature || !certUrl) return 'invalid';
  if (!isAllowedCertUrl(certUrl)) return 'invalid';

  const pem = await getCertificate(certUrl, args.fetchCert ?? defaultFetchCert);
  const matchesFor = (id: string) =>
    signatureMatches(
      buildSignedMessage({ transmissionId, transmissionTime, webhookId: id, rawBody: args.rawBody }),
      signature,
      pem,
    );

  if (matchesFor(webhookId)) return 'valid';
  if (matchesFor(SIMULATOR_WEBHOOK_ID)) return 'simulated';
  return 'invalid';
}

// ----------------------------------------------------------------------------
// OAuth token + authenticated requests
// ----------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | undefined;

/**
 * Abort a PayPal API call after PAYPAL_API_TIMEOUT_MS. The timer is not
 * cleared when headers arrive, so it also bounds reading the body; `unref`
 * keeps it from holding the process open. A plain setTimeout (not
 * AbortSignal.timeout) so tests can fake the clock.
 */
function fetchWithTimeout(
  doFetch: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`PayPal API request timed out after ${PAYPAL_API_TIMEOUT_MS} ms`)),
    PAYPAL_API_TIMEOUT_MS,
  );
  (timer as { unref?: () => void }).unref?.();
  return doFetch(url, { ...init, signal: controller.signal });
}

export async function getAccessToken(deps: PayPalDeps = {}): Promise<string> {
  const now = (deps.now ?? Date.now)();
  if (cachedToken && now < cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS) {
    return cachedToken.token;
  }

  const { apiBase, clientId, clientSecret } = getPayPalConfig();
  const doFetch = deps.fetch ?? fetch;
  const res = await fetchWithTimeout(doFetch, `${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new Error(`PayPal OAuth token request failed: ${res.status}`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (typeof json.access_token !== 'string' || typeof json.expires_in !== 'number') {
    throw new Error('PayPal OAuth token response is missing access_token or expires_in');
  }
  cachedToken = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return json.access_token;
}

/**
 * Call the PayPal REST API with a Bearer token. A 401 means the cached token
 * is no longer accepted: drop it, fetch a new one and retry exactly once.
 */
export async function paypalRequest(
  path: string,
  init: RequestInit,
  deps: PayPalDeps = {},
): Promise<Response> {
  const { apiBase } = getPayPalConfig();
  const doFetch = deps.fetch ?? fetch;
  const send = async () => {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${await getAccessToken(deps)}`);
    if (init.body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return fetchWithTimeout(doFetch, `${apiBase}${path}`, { ...init, headers });
  };

  const res = await send();
  if (res.status !== 401) return res;
  cachedToken = undefined;
  return send();
}

// ----------------------------------------------------------------------------
// Subscriptions (T10c: read; T10d: create)
// ----------------------------------------------------------------------------

export type PayPalSubscriptionStatus =
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface PayPalSubscription {
  id: string;
  status: PayPalSubscriptionStatus;
  plan_id: string;
  custom_id?: string;
  billing_info?: {
    next_billing_time?: string;
    failed_payments_count?: number;
  };
}

/** PayPal answered 404 for a subscription id. Permanent: never retried. */
export class SubscriptionNotFoundError extends Error {
  constructor(public readonly subscriptionId: string) {
    super(`PayPal subscription ${subscriptionId} not found (PayPal responded 404)`);
    this.name = 'SubscriptionNotFoundError';
  }
}

/** Read a subscription: GET /v1/billing/subscriptions/{id}. */
export async function getSubscription(
  id: string,
  deps: PayPalDeps = {},
): Promise<PayPalSubscription> {
  const res = await paypalRequest(
    `/v1/billing/subscriptions/${encodeURIComponent(id)}`,
    { method: 'GET' },
    deps,
  );
  if (res.status === 404) {
    throw new SubscriptionNotFoundError(id);
  }
  if (!res.ok) {
    throw new Error(`PayPal subscription request failed: ${res.status}`);
  }
  return (await res.json()) as PayPalSubscription;
}

/** Clear the certificate and token caches (tests only). */
export function resetPayPalCaches(): void {
  certCache.clear();
  cachedToken = undefined;
}
