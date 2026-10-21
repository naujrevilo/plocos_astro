/**
 * T27 — Real libsql database + Clerk user mirror
 *
 * Runs `src/lib/db/users.ts` against an in-memory libsql database with the
 * generated drizzle migrations applied, so the tests exercise the exact SQL
 * that production runs (including FK cascades).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createDb, type Database } from '../src/lib/db';
import { subscriptions, users } from '../src/lib/db/schema';
import {
  deleteUserFromClerk,
  getUser,
  upsertUserFromClerk,
  type ClerkUserPayload,
} from '../src/lib/db/users';

function clerkPayload(
  overrides: Partial<ClerkUserPayload> = {},
): ClerkUserPayload {
  return {
    id: 'user_123',
    first_name: 'Ada',
    last_name: 'Lovelace',
    primary_email_address_id: 'idn_primary',
    email_addresses: [
      { id: 'idn_secondary', email_address: 'old@example.com' },
      { id: 'idn_primary', email_address: 'ada@example.com' },
    ],
    ...overrides,
  };
}

describe('T27 — libsql database + Clerk user mirror', () => {
  let client: Client;
  let db: Database;

  beforeEach(async () => {
    client = createClient({ url: ':memory:' });
    db = createDb(client);
    await migrate(db, { migrationsFolder: 'drizzle' });
  });

  it('enforces foreign keys on the connection', async () => {
    const result = await client.execute('PRAGMA foreign_keys');
    expect(Number(result.rows[0]?.foreign_keys)).toBe(1);
  });

  it('inserts a new user with role NULL and the primary email', async () => {
    await upsertUserFromClerk(clerkPayload(), db);

    const row = await getUser('user_123', db);
    expect(row).not.toBeNull();
    expect(row?.email).toBe('ada@example.com');
    expect(row?.displayName).toBe('Ada Lovelace');
    expect(row?.role).toBeNull();
    expect(row?.habeasScriptumAcceptedAt).toBeNull();
  });

  it('falls back to the first email when no primary id matches', async () => {
    await upsertUserFromClerk(
      clerkPayload({ primary_email_address_id: null }),
      db,
    );

    const row = await getUser('user_123', db);
    expect(row?.email).toBe('old@example.com');
  });

  it('stores displayName as null when first and last names are empty', async () => {
    await upsertUserFromClerk(
      clerkPayload({ first_name: null, last_name: '  ' }),
      db,
    );

    const row = await getUser('user_123', db);
    expect(row?.displayName).toBeNull();
  });

  it('updates email/name on re-upsert but preserves role and consent', async () => {
    await upsertUserFromClerk(clerkPayload(), db);
    const acceptedAt = new Date('2026-01-01T00:00:00Z');
    await db
      .update(users)
      .set({ role: 'colaborador', habeasScriptumAcceptedAt: acceptedAt })
      .where(eq(users.clerkUserId, 'user_123'));

    await upsertUserFromClerk(
      clerkPayload({
        first_name: 'Augusta',
        last_name: 'King',
        email_addresses: [
          { id: 'idn_primary', email_address: 'augusta@example.com' },
        ],
      }),
      db,
    );

    const row = await getUser('user_123', db);
    expect(row?.email).toBe('augusta@example.com');
    expect(row?.displayName).toBe('Augusta King');
    expect(row?.role).toBe('colaborador');
    expect(row?.habeasScriptumAcceptedAt?.getTime()).toBe(acceptedAt.getTime());
  });

  it('rejects a payload without any email address', async () => {
    await expect(
      upsertUserFromClerk(clerkPayload({ email_addresses: [] }), db),
    ).rejects.toThrow(/email/i);
  });

  it('deletes the user and cascades to their subscriptions', async () => {
    await upsertUserFromClerk(clerkPayload(), db);
    await db.insert(subscriptions).values({
      userId: 'user_123',
      provider: 'mercadopago',
      providerSubscriptionId: 'sub_1',
      plan: 'lector',
    });

    await deleteUserFromClerk({ id: 'user_123' }, db);

    expect(await getUser('user_123', db)).toBeNull();
    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, 'user_123'));
    expect(subs).toHaveLength(0);
  });

  it('treats deleting an unknown user as a no-op', async () => {
    await expect(
      deleteUserFromClerk({ id: 'user_missing' }, db),
    ).resolves.toBeUndefined();
  });
});
