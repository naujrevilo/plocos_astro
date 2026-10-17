/**
 * MercadoPago webhook handler — `src/pages/api/webhooks/mercadopago.ts`
 *
 * Receives MercadoPago notifications (Suscripciones / preapprovals).
 * Flow:
 *   1. Verify the HMAC-SHA256 signature (x-signature + x-request-id)
 *      against MERCADOPAGO_WEBHOOK_SECRET — see src/lib/mercadopago.ts.
 *   2. For `subscription_preapproval` events, fetch the full preapproval
 *      from the MP API (the notification only carries the id).
 *   3. When status === 'authorized', activate the subscription: upsert
 *      the Turso row and upgrade the Clerk user's publicMetadata.role
 *      to 'colaborador'.
 *
 * Responses:
 *   - 400 for missing headers / invalid signature / bad body.
 *   - 500 when the secret is missing or the DB/Clerk write fails; MP
 *     retries the delivery with backoff.
 *   - 200 once handled, and for unhandled event types (no retry loop).
 */
import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import {
  fetchPreapproval,
  signatureFailureReason,
  verifyMPSignature,
} from '../../../lib/mercadopago';
import { activateSubscription } from '../../../lib/db/subscriptions';

type MPNotification = {
  action?: string;
  type?: string;
  data?: { id?: string | number };
};

/** Paid plan granted by every active MP subscription (doc maestro §Roles). */
const PAID_PLAN = 'colaborador' as const;

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  if (!xSignature || !xRequestId) {
    // MP's panel "URL test" button sends the sample payload WITHOUT the
    // signature headers; only real notifications come signed. Acknowledge
    // with 200 so the panel test passes, but never process an unsigned
    // payload — an unsigned request is never allowed to touch the DB.
    return new Response('OK (unsigned, not processed)', { status: 200 });
  }

  const rawBody = await request.text();
  let evt: MPNotification;
  try {
    evt = JSON.parse(rawBody) as MPNotification;
  } catch {
    return new Response('Invalid body', { status: 400 });
  }

  const dataId = String(evt?.data?.id ?? '');
  if (!dataId) {
    return new Response('Missing data.id', { status: 400 });
  }

  const valid = verifyMPSignature({ dataId, xRequestId, xSignature, secret });
  if (!valid) {
    const reason = signatureFailureReason({ dataId, xRequestId, xSignature, secret });
    console.error(`[mp webhook] signature rejected: ${reason}`);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    if (evt.type === 'subscription_preapproval') {
      const preapproval = await fetchPreapproval(dataId);

      if (preapproval.status === 'authorized' && preapproval.external_reference) {
        await activateSubscription({
          clerkUserId: preapproval.external_reference,
          provider: 'mercadopago',
          providerSubscriptionId: preapproval.id,
          plan: PAID_PLAN,
          currentPeriodStart: preapproval.start_date
            ? new Date(preapproval.start_date)
            : undefined,
          currentPeriodEnd: preapproval.next_payment_date
            ? new Date(preapproval.next_payment_date)
            : undefined,
        });

        const client = await clerkClient();
        await client.users.updateUserMetadata(preapproval.external_reference, {
          publicMetadata: { role: PAID_PLAN },
        });
      }
      // pending / paused / cancelled: no role change yet.
    }
    // Unhandled event types are accepted silently so MP does not retry.
  } catch (err) {
    // Non-2xx makes MP retry with backoff, so a transient failure does
    // not silently lose the activation.
    console.error('[mp webhook] handler error:', err);
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
};
