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
import { describe, expect, it } from 'vitest';
import { verifyMPSignature } from '../src/lib/mercadopago';

const SECRET = 'test-webhook-secret-12345';
const MAX_AGE_SECONDS = 5 * 60;

function computeExpectedSignature(args: {
  dataId: string;
  xRequestId: string;
  ts: number;
  secret: string;
}): string {
  const manifest = `id=${args.dataId};request-id=${args.xRequestId};ts=${args.ts};`;
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
