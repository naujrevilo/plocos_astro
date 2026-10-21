/**
 * T10b — PayPal REST wrapper (`src/lib/paypal.ts`)
 *
 * No network: every HTTP call goes through an injected `fetch`, and the
 * webhook certificate through an injected `fetchCert`.
 *
 * Webhook self-verification (developer.paypal.com/api/rest/webhooks/rest):
 *   signed message = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32}`
 *   - crc32 is computed over the RAW body and written in decimal; the body is
 *     never parsed and re-serialized.
 *   - `paypal-transmission-sig` is base64, SHA256withRSA, verified with the
 *     public key of the certificate at `paypal-cert-url`.
 *   - Simulator (mock) events are signed with the literal webhook id
 *     "WEBHOOK_ID".
 */
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSignedMessage,
  CERT_FETCH_TIMEOUT_MS,
  CertificateUnavailableError,
  getAccessToken,
  getSubscription,
  PAYPAL_API_TIMEOUT_MS,
  SubscriptionNotFoundError,
  getPayPalConfig,
  isAllowedCertUrl,
  paypalRequest,
  resetPayPalCaches,
  verifyWebhookSignature,
} from '../src/lib/paypal';

const WEBHOOK_ID = '8PT597110X687430LKGECATA';
const CERT_URL = 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-ab66f33d';
const TRANSMISSION_ID = '69cd13f0-d67a-11e5-baa3-778b53f4ae55';
const TRANSMISSION_TIME = '2026-10-20T20:00:00Z';
// Raw body with spacing that JSON.stringify would not reproduce.
const RAW_BODY = '{ "id": "WH-1",  "event_type": "BILLING.SUBSCRIPTION.ACTIVATED" }';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PUBLIC_PEM = publicKey.export({ type: 'spki', format: 'pem' }).toString();

const crcDecimal = (body: string) => zlib.crc32(Buffer.from(body, 'utf8')).toString();

function sign(webhookId: string, body = RAW_BODY): string {
  const message = `${TRANSMISSION_ID}|${TRANSMISSION_TIME}|${webhookId}|${crcDecimal(body)}`;
  return crypto.createSign('SHA256').update(message).sign(privateKey, 'base64');
}

function webhookHeaders(overrides: Record<string, string | null> = {}): Headers {
  const values: Record<string, string | null> = {
    'paypal-transmission-id': TRANSMISSION_ID,
    'paypal-transmission-time': TRANSMISSION_TIME,
    'paypal-transmission-sig': sign(WEBHOOK_ID),
    'paypal-cert-url': CERT_URL,
    'paypal-auth-algo': 'SHA256withRSA',
    ...overrides,
  };
  const headers = new Headers();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) headers.set(key, value);
  }
  return headers;
}

beforeEach(() => {
  resetPayPalCaches();
  vi.stubEnv('PAYPAL_API_BASE', 'https://api-m.sandbox.paypal.com');
  vi.stubEnv('PAYPAL_CLIENT_ID', 'client-id');
  vi.stubEnv('PAYPAL_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('PAYPAL_WEBHOOK_ID', WEBHOOK_ID);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('T10b — buildSignedMessage', () => {
  it('joins id, time, webhook id and the decimal CRC32 of the raw body', () => {
    expect(
      buildSignedMessage({
        transmissionId: TRANSMISSION_ID,
        transmissionTime: TRANSMISSION_TIME,
        webhookId: WEBHOOK_ID,
        rawBody: RAW_BODY,
      }),
    ).toBe(`${TRANSMISSION_ID}|${TRANSMISSION_TIME}|${WEBHOOK_ID}|${crcDecimal(RAW_BODY)}`);
  });

  it('hashes the raw body as received, never a re-serialized JSON', () => {
    const reserialized = JSON.stringify(JSON.parse(RAW_BODY));
    expect(crcDecimal(reserialized)).not.toBe(crcDecimal(RAW_BODY));
    const message = buildSignedMessage({
      transmissionId: TRANSMISSION_ID,
      transmissionTime: TRANSMISSION_TIME,
      webhookId: WEBHOOK_ID,
      rawBody: RAW_BODY,
    });
    expect(message.endsWith(`|${crcDecimal(RAW_BODY)}`)).toBe(true);
  });
});

describe('T10b — isAllowedCertUrl', () => {
  it.each([
    'https://api.paypal.com/v1/notifications/certs/CERT-1',
    'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1',
  ])('accepts %s', (url) => {
    expect(isAllowedCertUrl(url)).toBe(true);
  });

  it.each([
    'http://api.paypal.com/v1/notifications/certs/CERT-1',
    'https://api.paypal.com.evil.example/v1/notifications/certs/CERT-1',
    'https://evilpaypal.com/v1/notifications/certs/CERT-1',
    'https://attacker.example/api.paypal.com/cert.pem',
    'https://user@attacker.example/cert.pem',
    'not a url',
  ])('rejects %s', (url) => {
    expect(isAllowedCertUrl(url)).toBe(false);
  });

  it('accepts a PayPal host only under /v1/notifications/certs/', () => {
    expect(isAllowedCertUrl('https://api.paypal.com/v1/notifications/certs/CERT-360caa42')).toBe(true);
  });

  it.each([
    'https://api.paypal.com/cert.pem',
    'https://api.sandbox.paypal.com/v1/notifications/other/CERT-1',
    'https://api.paypal.com/v1/notifications/certs',
    // `..` is normalized by the URL parser to /v1/oauth2/token.
    'https://api.paypal.com/v1/notifications/certs/../../oauth2/token',
  ])('rejects a PayPal host outside the certs path: %s', (url) => {
    expect(isAllowedCertUrl(url)).toBe(false);
  });
});

describe('T10b — verifyWebhookSignature', () => {
  it('returns "valid" for a body signed with PAYPAL_WEBHOOK_ID', async () => {
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders(), fetchCert }),
    ).resolves.toBe('valid');
    expect(fetchCert).toHaveBeenCalledWith(CERT_URL);
  });

  it('returns "invalid" when the body was tampered with', async () => {
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    const tampered = RAW_BODY.replace('ACTIVATED', 'CANCELLED');
    await expect(
      verifyWebhookSignature({ rawBody: tampered, headers: webhookHeaders(), fetchCert }),
    ).resolves.toBe('invalid');
  });

  it('returns "simulated" for a simulator event signed with "WEBHOOK_ID"', async () => {
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    const headers = webhookHeaders({ 'paypal-transmission-sig': sign('WEBHOOK_ID') });
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers, fetchCert }),
    ).resolves.toBe('simulated');
  });

  it('returns "invalid" when signed with any other webhook id', async () => {
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    const headers = webhookHeaders({ 'paypal-transmission-sig': sign('SOME-OTHER-ID') });
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers, fetchCert }),
    ).resolves.toBe('invalid');
  });

  it.each([
    'paypal-transmission-id',
    'paypal-transmission-time',
    'paypal-transmission-sig',
    'paypal-cert-url',
  ])('returns "invalid" without downloading when %s is missing', async (header) => {
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    await expect(
      verifyWebhookSignature({
        rawBody: RAW_BODY,
        headers: webhookHeaders({ [header]: null }),
        fetchCert,
      }),
    ).resolves.toBe('invalid');
    expect(fetchCert).not.toHaveBeenCalled();
  });

  it('rejects a cert URL outside the allow-list without downloading it', async () => {
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    const headers = webhookHeaders({ 'paypal-cert-url': 'https://attacker.example/cert.pem' });
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers, fetchCert }),
    ).resolves.toBe('invalid');
    expect(fetchCert).not.toHaveBeenCalled();
  });

  it('caches the certificate per URL', async () => {
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    await verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders(), fetchCert });
    await verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders(), fetchCert });
    expect(fetchCert).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when PAYPAL_WEBHOOK_ID is not set', async () => {
    vi.stubEnv('PAYPAL_WEBHOOK_ID', '');
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders(), fetchCert }),
    ).rejects.toThrow('PAYPAL_WEBHOOK_ID is not set');
  });

  it('rejects PAYPAL_WEBHOOK_ID set to the simulator id, so mock events never count as valid', async () => {
    vi.stubEnv('PAYPAL_WEBHOOK_ID', 'WEBHOOK_ID');
    const fetchCert = vi.fn(async () => PUBLIC_PEM);
    const headers = webhookHeaders({ 'paypal-transmission-sig': sign('WEBHOOK_ID') });
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers, fetchCert }),
    ).rejects.toThrow('PAYPAL_WEBHOOK_ID must not be the simulator id "WEBHOOK_ID"');
    expect(fetchCert).not.toHaveBeenCalled();
  });
});

function tokenResponse(token: string, expiresIn = 3600): Response {
  return new Response(JSON.stringify({ access_token: token, expires_in: expiresIn }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('T10b — getAccessToken', () => {
  it('requests a client-credentials token with Basic auth from PAYPAL_API_BASE', async () => {
    const fetch = vi.fn(async () => tokenResponse('token-1'));
    await expect(getAccessToken({ fetch, now: () => 0 })).resolves.toBe('token-1');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api-m.sandbox.paypal.com/v1/oauth2/token');
    expect(init.method).toBe('POST');
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe(
      `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
    );
    expect(String(init.body)).toBe('grant_type=client_credentials');
  });

  it('reuses the cached token while it is valid', async () => {
    const fetch = vi.fn(async () => tokenResponse('token-1', 3600));
    await getAccessToken({ fetch, now: () => 0 });
    await expect(getAccessToken({ fetch, now: () => 1_000_000 })).resolves.toBe('token-1');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches a new token shortly before the cached one expires', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse('token-1', 3600))
      .mockResolvedValueOnce(tokenResponse('token-2', 3600));
    await getAccessToken({ fetch, now: () => 0 });
    // 30 s before expiry is inside the refresh margin.
    await expect(getAccessToken({ fetch, now: () => (3600 - 30) * 1000 })).resolves.toBe('token-2');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('T10b — paypalRequest', () => {
  it('invalidates the cached token on a 401 and retries once with a new one', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse('stale-token'))
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(tokenResponse('fresh-token'))
      .mockResolvedValueOnce(new Response('{"id":"I-1"}', { status: 200 }));

    const res = await paypalRequest('/v1/billing/subscriptions/I-1', { method: 'GET' }, { fetch, now: () => 0 });
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(4);

    const [firstUrl, firstInit] = fetch.mock.calls[1] as [string, RequestInit];
    expect(firstUrl).toBe('https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-1');
    expect(new Headers(firstInit.headers).get('authorization')).toBe('Bearer stale-token');
    const [, retryInit] = fetch.mock.calls[3] as [string, RequestInit];
    expect(new Headers(retryInit.headers).get('authorization')).toBe('Bearer fresh-token');

    // The fresh token is now the cached one.
    await expect(getAccessToken({ fetch, now: () => 0 })).resolves.toBe('fresh-token');
    expect(fetch).toHaveBeenCalledTimes(4);
  });
});

describe('T10b — getPayPalConfig', () => {
  it('reads PAYPAL_API_BASE, PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET', () => {
    expect(getPayPalConfig()).toEqual({
      apiBase: 'https://api-m.sandbox.paypal.com',
      clientId: 'client-id',
      clientSecret: 'client-secret',
    });
  });

  it.each(['PAYPAL_API_BASE', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'])(
    'throws a clear error when %s is not set',
    (name) => {
      vi.stubEnv(name, '');
      expect(() => getPayPalConfig()).toThrow(`${name} is not set`);
    },
  );
});

// ----------------------------------------------------------------------------
// T10c — certificate download (default `fetchCert`)
//
// PayPal's docs only say the certificate "should automatically be downloaded
// and cached for future use" and that a non-2xx answer is retried "up to 25
// times over 3 days". They say nothing about timeouts or redirects, so:
//   - the download gives up after CERT_FETCH_TIMEOUT_MS; Netlify's synchronous
//     function limit is 60 s and cannot be configured
//     (https://docs.netlify.com/build/functions/configuration/),
//   - redirects are refused (`redirect: 'error'`): the allow-list checks the
//     URL PayPal sent, and a redirect would bypass it,
//   - every failure surfaces as CertificateUnavailableError, which the webhook
//     answers with 5xx so PayPal retries.
// ----------------------------------------------------------------------------

describe('T10c — certificate download', () => {
  it('downloads the certificate without following redirects and with an abort signal', async () => {
    const fetch = vi.fn(async () => new Response(PUBLIC_PEM, { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders() }),
    ).resolves.toBe('valid');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(CERT_URL);
    expect(init.redirect).toBe('error');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('keeps the worst-case PayPal network time below the 60 s Netlify limit', () => {
    expect(CERT_FETCH_TIMEOUT_MS).toBe(5_000);
    expect(PAYPAL_API_TIMEOUT_MS).toBe(8_000);
    // Certificate + (token + GET) twice when paypalRequest retries after a 401.
    expect(CERT_FETCH_TIMEOUT_MS + 4 * PAYPAL_API_TIMEOUT_MS).toBeLessThan(60_000);
  });

  it('fails with CertificateUnavailableError when the download times out', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    vi.stubGlobal('fetch', fetch);

    const pending = verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders() });
    const outcome = expect(pending).rejects.toBeInstanceOf(CertificateUnavailableError);
    await vi.advanceTimersByTimeAsync(CERT_FETCH_TIMEOUT_MS);
    await outcome;
  });

  it('fails with CertificateUnavailableError on a non-2xx answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders() }),
    ).rejects.toBeInstanceOf(CertificateUnavailableError);
  });

  it('fails with CertificateUnavailableError on a network error or refused redirect', async () => {
    // With `redirect: 'error'`, fetch rejects with a TypeError on any 3xx.
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('fetch failed'))));
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders() }),
    ).rejects.toBeInstanceOf(CertificateUnavailableError);
  });

  it('does not cache a failed download', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response(PUBLIC_PEM, { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders() }),
    ).rejects.toBeInstanceOf(CertificateUnavailableError);
    await expect(
      verifyWebhookSignature({ rawBody: RAW_BODY, headers: webhookHeaders() }),
    ).resolves.toBe('valid');
  });
});

// ----------------------------------------------------------------------------
// T10c — read a subscription (moved from T10d; creating one stays in T10d)
// ----------------------------------------------------------------------------

const SUBSCRIPTION = {
  id: 'I-BW452GLLEP1G',
  status: 'ACTIVE',
  plan_id: 'P-5ML4271244454362WXNWU5NQ',
  custom_id: 'user_123',
  billing_info: { next_billing_time: '2026-11-21T10:00:00Z', failed_payments_count: 0 },
};

describe('T10c — getSubscription', () => {
  it('GETs /v1/billing/subscriptions/{id} with a Bearer token and returns the subscription', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockResolvedValueOnce(new Response(JSON.stringify(SUBSCRIPTION), { status: 200 }));

    await expect(getSubscription('I-BW452GLLEP1G', { fetch, now: () => 0 })).resolves.toEqual(
      SUBSCRIPTION,
    );

    const [url, init] = fetch.mock.calls[1] as [string, RequestInit];
    expect(url).toBe('https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-BW452GLLEP1G');
    expect(init.method).toBe('GET');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer token-1');
  });

  it('encodes the id so it cannot change the request path', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockResolvedValueOnce(new Response(JSON.stringify(SUBSCRIPTION), { status: 200 }));

    await getSubscription('I-1/../../v1/oauth2', { fetch, now: () => 0 });

    const [url] = fetch.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(
      'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-1%2F..%2F..%2Fv1%2Foauth2',
    );
  });

  it('throws SubscriptionNotFoundError when PayPal answers 404', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockResolvedValueOnce(
        new Response('{"name":"RESOURCE_NOT_FOUND"}', { status: 404 }),
      );

    const error = await getSubscription('I-MISSING', { fetch, now: () => 0 }).catch((e) => e);
    expect(error).toBeInstanceOf(SubscriptionNotFoundError);
    expect(error.subscriptionId).toBe('I-MISSING');
  });

  it('throws a plain error (retryable) on any other non-2xx answer', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockResolvedValueOnce(new Response('', { status: 500 }));

    const error = await getSubscription('I-1', { fetch, now: () => 0 }).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(SubscriptionNotFoundError);
    expect(error.message).toBe('PayPal subscription request failed: 500');
  });
});

// ----------------------------------------------------------------------------
// T10c — PayPal API timeout (PAYPAL_API_TIMEOUT_MS)
// ----------------------------------------------------------------------------

/** A fetch that never answers and rejects with the abort reason. */
function hangingFetch() {
  return vi.fn(
    (_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      }),
  );
}

describe('T10c — PayPal API timeout', () => {
  it('the OAuth token request gives up after PAYPAL_API_TIMEOUT_MS', async () => {
    vi.useFakeTimers();
    const fetch = hangingFetch();

    const pending = getAccessToken({ fetch, now: () => 0 });
    const outcome = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(PAYPAL_API_TIMEOUT_MS);
    await outcome;

    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('paypalRequest gives up after PAYPAL_API_TIMEOUT_MS', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn();
    fetch.mockResolvedValueOnce(tokenResponse('token-1'));
    fetch.mockImplementationOnce(hangingFetch());

    const pending = paypalRequest('/v1/billing/subscriptions/I-1', { method: 'GET' }, { fetch, now: () => 0 });
    const outcome = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(PAYPAL_API_TIMEOUT_MS);
    await outcome;

    const [, init] = fetch.mock.calls[1] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('does not time out a request that answers in time', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValueOnce(tokenResponse('token-1'));

    await expect(getAccessToken({ fetch, now: () => 0 })).resolves.toBe('token-1');
    await vi.advanceTimersByTimeAsync(PAYPAL_API_TIMEOUT_MS);
  });
});
