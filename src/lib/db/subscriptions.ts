/**
 * @module db/subscriptions
 * @description Subscription lifecycle helpers (T11, T10c).
 *
 * `activateSubscription` is the single entry point used by the payment
 * webhooks when a subscription becomes active. It:
 *   1. upserts the subscription row keyed by the provider subscription id,
 *   2. sets the mirrored user's role to the highest plan granting access.
 *
 * The role belongs to the user, not to one subscription (Log L14, L16). A
 * subscription grants access when its status is `active` (no date limit),
 * `past_due` with `currentPeriodEnd` null or in the future, or `canceled`
 * with `currentPeriodEnd` in the future (a cancellation without an end date
 * never grants access), whatever the provider. See `remainingAccess` for which one wins.
 *
 * Clerk's publicMetadata is updated by the webhook handler (needs the
 * Clerk backend client); this module only owns the Turso side and returns
 * the role and accessUntil the handler must write there.
 */
import { and, eq } from 'drizzle-orm';
import { db as appDb, type Database } from '../db';
import { PAYMENT_PROVIDERS, SUBSCRIPTION_PLANS, subscriptions, users } from './schema';

type Plan = (typeof SUBSCRIPTION_PLANS)[number];

export type ActivateSubscriptionInput = {
  clerkUserId: string;
  provider: (typeof PAYMENT_PROVIDERS)[number];
  providerSubscriptionId: string;
  plan: Plan;
  currentPeriodStart?: Date;
  /** `null` clears the stored period end; `undefined` keeps it. */
  currentPeriodEnd?: Date | null;
};

export type UpdateSubscriptionStatusInput = {
  clerkUserId: string;
  provider: (typeof PAYMENT_PROVIDERS)[number];
  providerSubscriptionId: string;
  status: 'past_due' | 'canceled' | 'suspended' | 'expired';
  /** Revoke the role unless another subscription still grants access. */
  revokeRole: boolean;
};

/** Role the user keeps, and the period end of the subscription granting it. */
export type RemainingAccess = {
  role: Plan | null;
  accessUntil: Date | null;
};

type SubscriptionKey = { provider: string; providerSubscriptionId: string };

const PLAN_RANK: Record<Plan, number> = { lector: 1, colaborador: 2 };

/**
 * Access the user keeps from their subscriptions that grant access, excluding
 * `exclude` (Log L16). The winner is chosen by, in order:
 *   1. rows whose end is null or in the future before rows whose end passed
 *      (only `active` can grant access with a past end), so a stale row never
 *      beats a freshly paid one;
 *   2. the highest plan (colaborador > lector);
 *   3. the end: null first (access while the role exists), then the latest.
 */
async function remainingAccess(
  database: Database,
  clerkUserId: string,
  now: Date,
  exclude?: SubscriptionKey,
): Promise<RemainingAccess> {
  const rows = await database
    .select({
      provider: subscriptions.provider,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
      plan: subscriptions.plan,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, clerkUserId));

  const granting = rows.filter(
    (row) =>
      !(
        exclude &&
        row.provider === exclude.provider &&
        row.providerSubscriptionId === exclude.providerSubscriptionId
      ) &&
      (row.status === 'active' ||
        (row.status === 'past_due' &&
          (row.currentPeriodEnd === null || row.currentPeriodEnd > now)) ||
        (row.status === 'canceled' &&
          row.currentPeriodEnd !== null &&
          row.currentPeriodEnd > now)),
  );

  const current = (end: Date | null) => (end === null || end > now ? 1 : 0);
  const endRank = (end: Date | null) => (end === null ? Infinity : end.getTime());
  const best = granting.sort(
    (a, b) =>
      current(b.currentPeriodEnd) - current(a.currentPeriodEnd) ||
      PLAN_RANK[b.plan] - PLAN_RANK[a.plan] ||
      endRank(b.currentPeriodEnd) - endRank(a.currentPeriodEnd),
  )[0];

  return best
    ? { role: best.plan, accessUntil: best.currentPeriodEnd }
    : { role: null, accessUntil: null };
}

/**
 * Set the status of an existing subscription row. With `revokeRole`, the
 * user's role becomes whatever their OTHER subscriptions still grant (null
 * when none does), and that access is returned for Clerk; without it the
 * role is untouched and nothing is returned. A missing row is not an error:
 * the role is still recomputed, so SUSPENDED/EXPIRED never leaves paid
 * access behind.
 *
 * `past_due` (failed payment on an ACTIVE subscription) keeps the role;
 * decide access from the role and accessUntil, never from this status
 * (Log L12).
 */
export async function updateSubscriptionStatus(
  input: UpdateSubscriptionStatusInput,
  database: Database = appDb,
): Promise<RemainingAccess | undefined> {
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

  if (!input.revokeRole) return undefined;

  const remaining = await remainingAccess(database, input.clerkUserId, now, input);
  await database
    .update(users)
    .set({ role: remaining.role, updatedAt: now })
    .where(eq(users.clerkUserId, input.clerkUserId));
  return remaining;
}

/**
 * Upsert the subscription and set the mirrored user's role to the highest
 * plan granting access (an active colaborador elsewhere is never downgraded
 * by a lector activation). Idempotent: calling twice with the same
 * providerSubscriptionId updates the existing row instead of duplicating it.
 */
export async function activateSubscription(
  input: ActivateSubscriptionInput,
  database: Database = appDb,
): Promise<{ id: number } & RemainingAccess> {
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

  // This row is active now, so it always counts: the role is never null here.
  const access = await remainingAccess(database, input.clerkUserId, now);
  await database
    .update(users)
    .set({ role: access.role, updatedAt: now })
    .where(eq(users.clerkUserId, input.clerkUserId));

  return { id, ...access };
}
