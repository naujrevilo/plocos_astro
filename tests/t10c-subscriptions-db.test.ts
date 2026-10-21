/**
 * T10c — Turso side of the PayPal webhook policy (`src/lib/db/subscriptions.ts`).
 * Runs against an in-memory libsql database with the real migrations.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createDb, type Database } from '../src/lib/db';
import { subscriptions, users } from '../src/lib/db/schema';
import { activateSubscription, updateSubscriptionStatus } from '../src/lib/db/subscriptions';
import { getUser, upsertUserFromClerk } from '../src/lib/db/users';

const PERIOD_END = new Date('2026-11-21T10:00:00Z');

let db: Database;

async function activate(providerSubscriptionId = 'I-1') {
  return activateSubscription(
    {
      clerkUserId: 'user_123',
      provider: 'paypal',
      providerSubscriptionId,
      plan: 'colaborador',
      currentPeriodEnd: PERIOD_END,
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

describe('T10c — activateSubscription is idempotent', () => {
  it('activating the same PayPal subscription twice keeps one active row', async () => {
    const first = await activate();
    const second = await activate();

    expect(second.id).toBe(first.id);
    const rows = await db.select().from(subscriptions);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('active');
    expect(rows[0]?.currentPeriodEnd).toEqual(PERIOD_END);
    expect((await getUser('user_123', db))?.role).toBe('colaborador');
  });
});

describe('T10c — updateSubscriptionStatus', () => {
  it('sets the status and keeps the role when revokeRole is false', async () => {
    await activate();

    await updateSubscriptionStatus(
      {
        clerkUserId: 'user_123',
        provider: 'paypal',
        providerSubscriptionId: 'I-1',
        status: 'canceled',
        revokeRole: false,
      },
      db,
    );

    const row = await rowFor('I-1');
    expect(row?.status).toBe('canceled');
    expect(row?.currentPeriodEnd).toEqual(PERIOD_END);
    expect((await getUser('user_123', db))?.role).toBe('colaborador');
  });

  it('clears the role when revokeRole is true', async () => {
    await activate();

    await updateSubscriptionStatus(
      {
        clerkUserId: 'user_123',
        provider: 'paypal',
        providerSubscriptionId: 'I-1',
        status: 'past_due',
        revokeRole: true,
      },
      db,
    );

    expect((await rowFor('I-1'))?.status).toBe('past_due');
    expect((await getUser('user_123', db))?.role).toBeNull();
  });

  it('only changes the matching provider subscription', async () => {
    await activate('I-1');
    await activate('I-2');

    await updateSubscriptionStatus(
      {
        clerkUserId: 'user_123',
        provider: 'paypal',
        providerSubscriptionId: 'I-1',
        status: 'canceled',
        revokeRole: false,
      },
      db,
    );

    expect((await rowFor('I-1'))?.status).toBe('canceled');
    expect((await rowFor('I-2'))?.status).toBe('active');
  });

  it('revokes the role even when the subscription row was never created', async () => {
    await db.update(users).set({ role: 'colaborador' });

    await updateSubscriptionStatus(
      {
        clerkUserId: 'user_123',
        provider: 'paypal',
        providerSubscriptionId: 'I-NEVER-SEEN',
        status: 'canceled',
        revokeRole: true,
      },
      db,
    );

    expect(await db.select().from(subscriptions)).toHaveLength(0);
    expect((await getUser('user_123', db))?.role).toBeNull();
  });
});
