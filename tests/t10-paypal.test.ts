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
  getAccessToken,
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
