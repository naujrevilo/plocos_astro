/**
 * T10c — Turso side of the PayPal webhook policy (`src/lib/db/subscriptions.ts`).
 * Runs against an in-memory libsql database with the real migrations.
 *
 * The role belongs to the user, not to one subscription (Log L14). Another
 * subscription "grants access" when its status is `active` or `past_due`, or
 * `canceled` with `currentPeriodEnd` in the future, for PayPal and MercadoPago
 * alike, excluding the subscription being changed. The role kept is the
 * highest plan among them (colaborador > lector).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createDb, type Database } from '../src/lib/db';
import { subscriptions, users, type SubscriptionStatus } from '../src/lib/db/schema';
import {
  activateSubscription,
  updateSubscriptionStatus,
  type UpdateSubscriptionStatusInput,
} from '../src/lib/db/subscriptions';
import { getUser, upsertUserFromClerk } from '../src/lib/db/users';

const PERIOD_END = new Date('2026-11-21T10:00:00Z');
const FUTURE = new Date('2099-01-01T00:00:00Z');
const PAST = new Date('2000-01-01T00:00:00Z');

let db: Database;

async function activate(
  providerSubscriptionId = 'I-1',
  overrides: { plan?: 'lector' | 'colaborador'; currentPeriodEnd?: Date | null } = {},
) {
  return activateSubscription(
    {
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId,
      plan: overrides.plan ?? 'colaborador',
      currentPeriodEnd: 'currentPeriodEnd' in overrides ? overrides.currentPeriodEnd : PERIOD_END,
    },
    db,
  );
}

/** Insert another subscription of the same user directly, in any state. */
async function seedOther(args: {
  provider?: 'paypal' | 'mercadopago';
  id?: string;
  plan?: 'lector' | 'colaborador';
  status: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
}) {
  await db.insert(subscriptions).values({
    userId: 'user_123',
    provider: args.provider ?? 'mercadopago',
    providerSubscriptionId: args.id ?? 'MP-1',
    plan: args.plan ?? 'colaborador',
    status: args.status,
    currentPeriodEnd: args.currentPeriodEnd ?? null,
  });
}

function revoke(overrides: Partial<UpdateSubscriptionStatusInput> = {}) {
  return updateSubscriptionStatus(
    {
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId: 'I-1',
      status: 'suspended',
      revokeRole: true,
      ...overrides,
    },
    db,
  );
}

async function rowFor(providerSubscriptionId: string) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId));
  return rows[0];
}

const roleOf = async () => (await getUser('user_123', db))?.role;

beforeEach(async () => {
  db = createDb(createClient({ url: ':memory:' }));
  await migrate(db, { migrationsFolder: 'drizzle' });
  await upsertUserFromClerk(
    {
      id: 'user_123',
      first_name: 'Ada',
      last_name: 'Lovelace',
      primary_email_address_id: 'idn_1',
      email_addresses: [{ id: 'idn_1', email_address: 'ada@example.com' }],
    },
    db,
  );
});

describe('T10c — activateSubscription', () => {
  it('activating the same PayPal subscription twice keeps one active row', async () => {
    const first = await activate();
    const second = await activate();

    expect(second.id).toBe(first.id);
    const rows = await db.select().from(subscriptions);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('active');
    expect(rows[0]?.currentPeriodEnd).toEqual(PERIOD_END);
    expect(await roleOf()).toBe('colaborador');
  });

  it('returns the role and accessUntil of the subscription it activated', async () => {
    await expect(activate('I-1', { plan: 'lector' })).resolves.toMatchObject({
      role: 'lector',
      accessUntil: PERIOD_END,
    });
  });

  it('a lector activation keeps colaborador from an active MercadoPago subscription', async () => {
    await seedOther({ status: 'active', plan: 'colaborador', currentPeriodEnd: FUTURE });

    const result = await activate('I-1', { plan: 'lector' });

    expect(result).toMatchObject({ role: 'colaborador', accessUntil: FUTURE });
    expect(await roleOf()).toBe('colaborador');
    expect((await rowFor('I-1'))?.plan).toBe('lector');
  });

  it('currentPeriodEnd null clears the stored period end (ACTIVE without next_billing_time)', async () => {
    await activate('I-1');

    const result = await activate('I-1', { currentPeriodEnd: null });

    expect((await rowFor('I-1'))?.currentPeriodEnd).toBeNull();
    expect(result).toMatchObject({ role: 'colaborador', accessUntil: null });
  });

  it('currentPeriodEnd undefined keeps the stored period end (MercadoPago path unchanged)', async () => {
    await activate('I-1');

    await activate('I-1', { currentPeriodEnd: undefined });

    expect((await rowFor('I-1'))?.currentPeriodEnd).toEqual(PERIOD_END);
  });
});

describe('T10c — updateSubscriptionStatus', () => {
  it('stores SUSPENDED as "suspended"', async () => {
    await activate();

    await revoke({ status: 'suspended' });

    expect((await rowFor('I-1'))?.status).toBe('suspended');
  });

  it('sets the status and keeps the role when revokeRole is false', async () => {
    await activate();

    await revoke({ status: 'canceled', revokeRole: false });

    const row = await rowFor('I-1');
    expect(row?.status).toBe('canceled');
    expect(row?.currentPeriodEnd).toEqual(PERIOD_END);
    expect(await roleOf()).toBe('colaborador');
  });

  it('EXPIRED with no other subscription clears the role and returns no access', async () => {
    await activate();

    const remaining = await revoke({ status: 'canceled' });

    expect(remaining).toEqual({ role: null, accessUntil: null });
    expect(await roleOf()).toBeNull();
  });

  it('SUSPENDED of A keeps the role while subscription B (MercadoPago) is active', async () => {
    await activate('I-1');
    await seedOther({ status: 'active', plan: 'colaborador', currentPeriodEnd: FUTURE });

    const remaining = await revoke();

    expect(remaining).toEqual({ role: 'colaborador', accessUntil: FUTURE });
    expect(await roleOf()).toBe('colaborador');
    expect((await rowFor('I-1'))?.status).toBe('suspended');
  });

  it('keeps the highest remaining plan: colaborador A suspended, lector B active → lector', async () => {
    await activate('I-1', { plan: 'colaborador' });
    await seedOther({ provider: 'paypal', id: 'I-2', status: 'active', plan: 'lector', currentPeriodEnd: FUTURE });

    const remaining = await revoke();

    expect(remaining).toEqual({ role: 'lector', accessUntil: FUTURE });
    expect(await roleOf()).toBe('lector');
  });

  it.each<[string, SubscriptionStatus, Date | null, 'colaborador' | null]>([
    ['past_due', 'past_due', FUTURE, 'colaborador'],
    ['canceled with a future period end', 'canceled', FUTURE, 'colaborador'],
    ['canceled with a past period end', 'canceled', PAST, null],
    ['canceled without a period end', 'canceled', null, null],
    ['suspended', 'suspended', FUTURE, null],
    ['pending', 'pending', FUTURE, null],
  ])('another subscription that is %s: role kept only while it grants access', async (_, status, end, expectedRole) => {
    await activate('I-1');
    await seedOther({ status, plan: 'colaborador', currentPeriodEnd: end });

    const remaining = await revoke();

    expect(remaining?.role).toBe(expectedRole);
    expect(await roleOf()).toBe(expectedRole);
  });

  it('only changes the matching provider subscription', async () => {
    await activate('I-1');
    await activate('I-2');

    await revoke({ status: 'canceled', revokeRole: false });

    expect((await rowFor('I-1'))?.status).toBe('canceled');
    expect((await rowFor('I-2'))?.status).toBe('active');
  });

  it('revokes the role even when the subscription row was never created', async () => {
    await db.update(users).set({ role: 'colaborador' });

    await revoke({ providerSubscriptionId: 'I-NEVER-SEEN', status: 'canceled' });

    expect(await db.select().from(subscriptions)).toHaveLength(0);
    expect(await roleOf()).toBeNull();
  });
});
