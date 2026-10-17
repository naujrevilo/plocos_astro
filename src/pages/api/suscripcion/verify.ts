/**
 * Subscription reconciliation endpoint — `POST /api/suscripcion/verify`
 *
 * Belt-and-braces for webhook delivery: after the buyer returns from
 * the MP checkout (?status=success in the back_url), the client calls
 * this endpoint. It searches the payer's MP preapprovals for one bound
 * to the current Clerk user (`external_reference`) in `authorized`
 * status, and activates it the same way the webhook would.
 *
 * This makes role provisioning immune to webhook delivery failures
 * (dead tunnel, server restarts, MP retry exhaustion). The webhook
 * remains the primary path; this endpoint reconciles when it misses.
 *
 * Idempotent: activateSubscription upserts by
 * (provider, providerSubscriptionId).
 */
import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import {
  findAuthorizedPreapproval,
  type Preapproval,
} from '../../../lib/mercadopago';
import { activateSubscription } from '../../../lib/db/subscriptions';

const PAID_PLAN = 'colaborador' as const;

export const POST: APIRoute = async (context) => {
  const auth = context.locals.auth?.();
  if (!auth?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  let preapproval: Preapproval | null = null;
  try {
    preapproval = await findAuthorizedPreapproval(auth.userId);
  } catch (err) {
    console.error('[suscripcion] reconciliation search failed:', err);
    return new Response(JSON.stringify({ activated: false, error: 'mp_search_failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!preapproval) {
    return new Response(JSON.stringify({ activated: false }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    await activateSubscription({
      clerkUserId: auth.userId,
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

    const client = await clerkClient(context);
    await client.users.updateUserMetadata(auth.userId, {
      publicMetadata: { role: PAID_PLAN },
    });
  } catch (err) {
    console.error('[suscripcion] reconciliation activation failed:', err);
    return new Response(JSON.stringify({ activated: false, error: 'activation_failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ activated: true, role: PAID_PLAN }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
