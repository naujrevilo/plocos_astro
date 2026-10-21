/**
 * PayPal webhook handler — `src/pages/api/webhooks/paypal.ts` (T10c).
 *
 * Flow:
 *   1. Verify the signature against the RAW body (src/lib/paypal.ts).
 *      `simulated` (webhook simulator) is acknowledged and never processed.
 *   2. Resolve the subscription id: `resource.id` for BILLING.SUBSCRIPTION.*,
 *      `resource.billing_agreement_id` for PAYMENT.SALE.COMPLETED.
 *   3. Read the subscription from PayPal and act on THAT state, never on the
 *      event type, so out-of-order and repeated deliveries converge.
 *      `custom_id` is the Clerk user id.
 *
 * Policy (Log L6, L7, L11, L12, L14):
 *   ACTIVE                          → active + role + accessUntil
 *   ACTIVE, failed_payments_count>0 → past_due, role kept
 *   CANCELLED                       → canceled, role kept until accessUntil
 *   SUSPENDED                       → suspended, role removed
 *   EXPIRED                         → expired, role removed
 *   APPROVAL_PENDING / APPROVED     → nothing
 * The role is per user: Clerk always gets the role and accessUntil returned
 * by the DB helpers, which account for the user's other subscriptions
 * (PayPal or MercadoPago). "Removed" means unless another one grants access.
 *
 * Responses:
 *   - 401 for a missing or invalid signature.
 *   - 400 for a signed body that is not JSON.
 *   - 503 when the signing certificate cannot be downloaded, 500 for any
 *     other failure (config, PayPal API, DB, Clerk): PayPal retries non-2xx
 *     deliveries up to 25 times over 3 days.
 *   - 200 once handled, and for simulator events, unknown event types and
 *     permanent conditions (404, no custom_id), which retrying never fixes.
 */
import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import {
  CertificateUnavailableError,
  getSubscription,
  SubscriptionNotFoundError,
  verifyWebhookSignature,
  type PayPalSubscription,
  type WebhookVerification,
} from '../../../lib/paypal';
import {
  activateSubscription,
  updateSubscriptionStatus,
  type RemainingAccess,
} from '../../../lib/db/subscriptions';

type PayPalEvent = {
  event_type?: string;
  resource?: { id?: string; billing_agreement_id?: string };
};

type Plan = 'lector' | 'colaborador';

// Plan ids per plan and currency, read the Astro way (see src/lib/paypal.ts).
const PLAN_IDS: Record<Plan, () => (string | undefined)[]> = {
  lector: () => [
    import.meta.env.PAYPAL_PLAN_LECTOR_USD ?? process.env.PAYPAL_PLAN_LECTOR_USD,
    import.meta.env.PAYPAL_PLAN_LECTOR_EUR ?? process.env.PAYPAL_PLAN_LECTOR_EUR,
  ],
  colaborador: () => [
    import.meta.env.PAYPAL_PLAN_COLABORADOR_USD ?? process.env.PAYPAL_PLAN_COLABORADOR_USD,
    import.meta.env.PAYPAL_PLAN_COLABORADOR_EUR ?? process.env.PAYPAL_PLAN_COLABORADOR_EUR,
  ],
};

/** An unknown plan id is a configuration error: 500, so PayPal retries. */
function planFor(planId: string): Plan {
  for (const plan of Object.keys(PLAN_IDS) as Plan[]) {
    if (PLAN_IDS[plan]().some((id) => id && id === planId)) return plan;
  }
  throw new Error(`PayPal plan_id ${planId} is not one of PAYPAL_PLAN_*`);
}

function subscriptionIdOf(evt: PayPalEvent): { id?: string; skip?: string } {
  const type = evt.event_type ?? '';
  if (type.startsWith('BILLING.SUBSCRIPTION.')) {
    return evt.resource?.id ? { id: evt.resource.id } : { skip: `${type} without resource.id` };
  }
  if (type === 'PAYMENT.SALE.COMPLETED') {
    return evt.resource?.billing_agreement_id
      ? { id: evt.resource.billing_agreement_id }
      : { skip: `${type} without billing_agreement_id (not a subscription payment)` };
  }
  return { skip: `unhandled event type ${type || '(none)'}` };
}

const ok = (body = 'OK') => new Response(body, { status: 200 });

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const rawBody = await request.text();

  let verification: WebhookVerification;
  try {
    verification = await verifyWebhookSignature({ rawBody, headers: request.headers });
  } catch (err) {
    console.error('[paypal webhook] signature check failed:', err);
    return err instanceof CertificateUnavailableError
      ? new Response('Certificate unavailable', { status: 503 })
      : new Response('Webhook handler error', { status: 500 });
  }
  if (verification === 'invalid') {
    return new Response('Invalid signature', { status: 401 });
  }
  if (verification === 'simulated') {
    console.info('[paypal webhook] simulator event acknowledged without processing');
    return ok('OK (simulated, not processed)');
  }

  let evt: PayPalEvent;
  try {
    evt = JSON.parse(rawBody) as PayPalEvent;
  } catch {
    return new Response('Invalid body', { status: 400 });
  }

  const target = subscriptionIdOf(evt);
  if (!target.id) {
    console.info(`[paypal webhook] ${target.skip} — acknowledged without processing`);
    return ok();
  }

  try {
    let sub: PayPalSubscription;
    try {
      sub = await getSubscription(target.id);
    } catch (err) {
      if (err instanceof SubscriptionNotFoundError) {
        console.warn(`[paypal webhook] ${err.message} — acknowledged without processing`);
        return ok('OK (resource not found)');
      }
      throw err; // transient: 500 so PayPal retries
    }

    const clerkUserId = sub.custom_id;
    if (!clerkUserId) {
      console.warn(`[paypal webhook] subscription ${sub.id} has no custom_id — not processed`);
      return ok();
    }
    await applyState(context, sub, clerkUserId);
  } catch (err) {
    console.error('[paypal webhook] handler error:', err);
    return new Response('Webhook handler error', { status: 500 });
  }

  return ok();
};

async function applyState(
  context: Parameters<APIRoute>[0],
  sub: PayPalSubscription,
  clerkUserId: string,
): Promise<void> {
  const base = { clerkUserId, provider: 'paypal' as const, providerSubscriptionId: sub.id };

  switch (sub.status) {
    case 'ACTIVE': {
      if ((sub.billing_info?.failed_payments_count ?? 0) > 0) {
        await updateSubscriptionStatus({ ...base, status: 'past_due', revokeRole: false });
        return;
      }
      const plan = planFor(sub.plan_id);
      const next = sub.billing_info?.next_billing_time;
      // null, not undefined: clears a previous (possibly expired) period end.
      const periodEnd = next ? new Date(next) : null;
      const access = await activateSubscription({ ...base, plan, currentPeriodEnd: periodEnd });
      await writeAccess(context, clerkUserId, access);
      return;
    }
    case 'CANCELLED':
      // Role and accessUntil stay: access ends when accessUntil passes.
      await updateSubscriptionStatus({ ...base, status: 'canceled', revokeRole: false });
      return;
    case 'SUSPENDED':
    case 'EXPIRED': {
      const status = sub.status === 'SUSPENDED' ? 'suspended' : 'expired';
      const remaining = await updateSubscriptionStatus({ ...base, status, revokeRole: true });
      await writeAccess(context, clerkUserId, remaining ?? { role: null, accessUntil: null });
      return;
    }
    default:
      // APPROVAL_PENDING / APPROVED: not paid yet, nothing to grant.
      console.info(`[paypal webhook] subscription ${sub.id} is ${sub.status} — no change`);
  }
}

/**
 * Mirror the user's access in Clerk. `null` (never `undefined`) removes a
 * key: Clerk deep-merges publicMetadata and JSON drops undefined values.
 */
async function writeAccess(
  context: Parameters<APIRoute>[0],
  clerkUserId: string,
  access: RemainingAccess,
): Promise<void> {
  const client = await clerkClient(context);
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      role: access.role,
      accessUntil: access.accessUntil ? access.accessUntil.toISOString() : null,
    },
  });
}
