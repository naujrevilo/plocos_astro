/**
 * @module db/subscriptions
 * @description Subscription lifecycle helpers (T11, T10c).
 *
 * `activateSubscription` is the single entry point used by the
 * MercadoPago webhook when a preapproval reaches `authorized`. It:
 *   1. upserts the subscription row keyed by the provider subscription id,
 *   2. flips the mirrored user's role to the paid plan.
 *
 * Clerk's publicMetadata is updated by the webhook handler (needs the
 * Clerk backend client); this module only owns the Turso side.
 */
import { and, eq } from 'drizzle-orm';
import { db as appDb, type Database } from '../db';
import { PAYMENT_PROVIDERS, subscriptions, users } from './schema';

export type ActivateSubscriptionInput = {
  clerkUserId: string;
  provider: (typeof PAYMENT_PROVIDERS)[number];
  providerSubscriptionId: string;
  plan: 'lector' | 'colaborador';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
};

export type UpdateSubscriptionStatusInput = {
  clerkUserId: string;
  provider: (typeof PAYMENT_PROVIDERS)[number];
  providerSubscriptionId: string;
  status: 'past_due' | 'canceled';
  /** Clear the mirrored user's role (SUSPENDED / EXPIRED, Log L6-L7). */
  revokeRole: boolean;
};

/**
 * Set the status of an existing subscription row and, when asked, clear the
 * mirrored user's role. A missing row is not an error: the role is still
 * revoked, so a SUSPENDED/EXPIRED event never leaves paid access behind.
 *
 * `past_due` covers two cases with different access (Log L12): a failed
 * payment on an ACTIVE subscription keeps the role, SUSPENDED revokes it.
 * Decide access from the role, never from this status.
 */
export async function updateSubscriptionStatus(
  input: UpdateSubscriptionStatusInput,
  database: Database = appDb,
): Promise<void> {
  const now = new Date();
  await database
    .update(subscriptions)
    .set({ status: input.status, updatedAt: now })
    .where(
      and(
        eq(subscriptions.provider, input.provider),
        eq(subscriptions.providerSubscriptionId, input.providerSubscriptionId),
      ),
    );

  if (input.revokeRole) {
    await database
      .update(users)
      .set({ role: null, updatedAt: now })
      .where(eq(users.clerkUserId, input.clerkUserId));
  }
}

/**
 * Upsert the subscription and promote the mirrored user's role.
 * Idempotent: calling twice with the same providerSubscriptionId
 * updates the existing row instead of duplicating it.
 */
export async function activateSubscription(
  input: ActivateSubscriptionInput,
  database: Database = appDb,
): Promise<{ id: number }> {
  const existing = await database
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.provider, input.provider),
        eq(subscriptions.providerSubscriptionId, input.providerSubscriptionId),
      ),
    )
    .limit(1);

  const now = new Date();
  const values = {
    userId: input.clerkUserId,
    provider: input.provider,
    providerSubscriptionId: input.providerSubscriptionId,
    plan: input.plan,
    status: 'active' as const,
    currentPeriodStart: input.currentPeriodStart ?? now,
    currentPeriodEnd: input.currentPeriodEnd,
    updatedAt: now,
  };

  let id: number;
  if (existing[0]) {
    await database
      .update(subscriptions)
      .set(values)
      .where(eq(subscriptions.id, existing[0].id));
    id = existing[0].id;
  } else {
    const inserted = await database
      .insert(subscriptions)
      .values({ ...values, createdAt: now })
      .returning({ id: subscriptions.id });
    id = inserted[0]!.id;
  }

  await database
    .update(users)
    .set({ role: input.plan, updatedAt: now })
    .where(eq(users.clerkUserId, input.clerkUserId));

  return { id };
}
