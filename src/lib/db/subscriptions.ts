/**
 * @module db/subscriptions
 * @description Subscription lifecycle helpers (T11).
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
