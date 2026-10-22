/**
 * T10c — real PayPal webhook simulator delivery (closes the X.509 assumption
 * of Log L9, see L17).
 *
 * Fixture captured from the PayPal simulator (BILLING.SUBSCRIPTION.ACTIVATED,
 * PayPal's sample body): the `paypal-*` headers, the exact raw body and the
 * X.509 certificate served at `paypal-cert-url` (api.paypal.com). All public;
 * no secrets. Kept byte-exact by `.gitattributes` (`-text`).
 *
 * No network: `fetchCert` is injected and reads the saved `cert.pem`. Only the
 * signature is checked, never the certificate's validity dates, so the test
 * keeps passing after the certificate expires.
 */
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSignedMessage,
  resetPayPalCaches,
  SIMULATOR_WEBHOOK_ID,
  verifyWebhookSignature,
} from '../src/lib/paypal';

const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'paypal', 'simulator-activated');
const HEADERS = JSON.parse(readFileSync(path.join(FIXTURE_DIR, 'headers.json'), 'utf8')) as Record<
  string,
  string
>;
const RAW_BODY = readFileSync(path.join(FIXTURE_DIR, 'body.raw'), 'utf8');
const CERT_PEM = readFileSync(path.join(FIXTURE_DIR, 'cert.pem'), 'utf8');

/** Any configured webhook id other than the simulator's "WEBHOOK_ID". */
const CONFIGURED_WEBHOOK_ID = '8PT597110X687430LKGECATA';

const fetchCert = vi.fn(async () => CERT_PEM);

function verify(rawBody = RAW_BODY) {
  return verifyWebhookSignature({
    rawBody,
    headers: new Headers(HEADERS),
    webhookId: CONFIGURED_WEBHOOK_ID,
    fetchCert,
  });
}

beforeEach(() => {
  resetPayPalCaches();
  fetchCert.mockClear();
});

describe('T10c — real simulator delivery (fixture)', () => {
  it('the certificate is an X.509 certificate in PEM, not a bare public key', () => {
    expect(CERT_PEM).toContain('-----BEGIN CERTIFICATE-----');
    expect(CERT_PEM).not.toContain('PUBLIC KEY-----');
  });

  it('the signature verifies as "simulated" (signed with "WEBHOOK_ID")', async () => {
    await expect(verify()).resolves.toBe('simulated');
    expect(fetchCert).toHaveBeenCalledWith(HEADERS['paypal-cert-url']);
  });

  it('the signature does not match the configured webhook id', () => {
    const matches = (webhookId: string) =>
      crypto
        .createVerify('SHA256')
        .update(
          buildSignedMessage({
            transmissionId: HEADERS['paypal-transmission-id']!,
            transmissionTime: HEADERS['paypal-transmission-time']!,
            webhookId,
            rawBody: RAW_BODY,
          }),
        )
        .verify(CERT_PEM, HEADERS['paypal-transmission-sig']!, 'base64');

    expect(matches(SIMULATOR_WEBHOOK_ID)).toBe(true);
    expect(matches(CONFIGURED_WEBHOOK_ID)).toBe(false);
  });

  it('one changed byte in the body makes it "invalid"', async () => {
    const index = RAW_BODY.indexOf('ACTIVATED');
    const tampered = `${RAW_BODY.slice(0, index)}B${RAW_BODY.slice(index + 1)}`;

    expect(tampered).toHaveLength(RAW_BODY.length);
    await expect(verify(tampered)).resolves.toBe('invalid');
  });
});
