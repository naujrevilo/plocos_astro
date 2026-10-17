/**
 * Subscription checkout endpoint — `src/pages/api/suscripcion/mercadopago.ts`
 *
 * POST { plan: 'lector' | 'colaborador' } -> { init_point }
 *
 * Creates an MP preapproval (Suscripciones) bound to the signed-in
 * Clerk user via `external_reference`, so the webhook can map the
 * approval back and upgrade the role. The user is then redirected to
 * `init_point` (MP-hosted checkout).
 *
 * Requires a session (the middleware already gates /api/* except
 * webhooks). Guards:
 *   - 401 without session (defence in depth).
 *   - 400 unknown plan.
 *   - 409 downgrade attempt (colaborador/auditor -> lector plan).
 */
import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import { createPreapprovalSubscription } from '../../../lib/mercadopago';
import { getRoleFromClaims } from '../../../lib/access';
import type { UserRole } from '../../../lib/db/schema';

const PLAN_IDS = {
  lector: () => import.meta.env.MERCADOPAGO_PLAN_LECTOR,
  colaborador: () => import.meta.env.MERCADOPAGO_PLAN_COLABORADOR,
} as const;

type PlanName = keyof typeof PLAN_IDS;

function isPlanName(value: unknown): value is PlanName {
  return value === 'lector' || value === 'colaborador';
}

/** Roles that must not subscribe to the (cheaper) lector plan. */
const PAID_ROLES: readonly UserRole[] = ['colaborador', 'auditor'];

export const POST: APIRoute = async (context) => {
  const { request, locals, url } = context;
  const auth = locals.auth?.();
  if (!auth?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: { plan?: unknown };
  try {
    body = (await request.json()) as { plan?: unknown };
  } catch {
    return new Response('Invalid body', { status: 400 });
  }
  if (!isPlanName(body.plan)) {
    return new Response('Unknown plan', { status: 400 });
  }

  const currentRole = getRoleFromClaims(auth.sessionClaims);
  if (body.plan === 'lector' && currentRole && PAID_ROLES.includes(currentRole)) {
    return new Response('Downgrade not allowed via checkout; manage it from your account', {
      status: 409,
    });
  }

  const planId = PLAN_IDS[body.plan]();
  if (!planId) {
    return new Response(
      `Plan id not configured for ${body.plan} (MERCADOPAGO_PLAN_${body.plan.toUpperCase()})`,
      { status: 500 },
    );
  }

  const client = await clerkClient(context);
  const user = await client.users.getUser(auth.userId);
  const payerEmail = user.primaryEmailAddress?.emailAddress;
  if (!payerEmail) {
    return new Response('User has no primary email', { status: 400 });
  }

  const isEN = url.pathname.startsWith('/en');
  const backUrl = new URL(isEN ? '/en/subscription?status=success' : '/suscripcion?status=success', url.origin).toString();

  try {
    const creation = await createPreapprovalSubscription({
      planId,
      payerEmail,
      externalReference: auth.userId,
      backUrl,
      reason: isEN ? `Plocos ${body.plan} subscription` : `Suscripción ${body.plan} Plocos`,
    });
    return new Response(JSON.stringify({ init_point: creation.init_point }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    // Surface the MP error body to the client alert: a 400 here carries
    // the actionable reason (e.g. payer_email must be a test user).
    console.error('[suscripcion] preapproval creation failed:', err);
    return new Response(err instanceof Error ? err.message : 'Checkout error', {
      status: 502,
      headers: { 'content-type': 'text/plain' },
    });
  }
};
