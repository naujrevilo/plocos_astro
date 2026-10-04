/**
 * @module db/users
 * @description Mirror of Clerk users into the local `users` table.
 *
 * Called from the Clerk webhook (`src/pages/api/webhooks/clerk.ts`):
 *   - `user.created` / `user.updated` → `upsertUserFromClerk`
 *   - `user.deleted`                  → `deleteUserFromClerk`
 *
 * The mirror only owns identity fields (email, displayName). `role` is set by
 * the payment webhooks (T10/T11) and `habeasScriptumAcceptedAt` by the
 * consent flow, so an update never touches them; a new row starts with
 * `role = NULL` (no subscription).
 *
 * Deleting a user cascades (FK `ON DELETE cascade`) to every user-owned row,
 * which implements the ARCO right of cancellation (Ley 1581/2012).
 *
 * Errors propagate: the webhook turns them into a 500 so Clerk retries.
 * Every helper takes an optional `Database` so tests can pass an in-memory one.
 */
import { eq, sql } from 'drizzle-orm';
import { db as appDb, type Database } from '../db';
import { users, type User } from './schema';

/**
 * Fields we read from Clerk's `UserJSON` webhook payload (snake_case, as sent
 * over the wire). Declared locally so we do not depend on `@clerk/backend`
 * types, which are not a direct dependency.
 */
export interface ClerkUserPayload {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses: Array<{ id: string; email_address: string }>;
}

/** Clerk's `user.deleted` payload (`DeletedObjectJSON`): `id` may be absent. */
export interface ClerkDeletedPayload {
  id?: string | null;
}

/** Primary email if Clerk flags one, else the first address. */
function pickEmail(data: ClerkUserPayload): string {
  const addresses = data.email_addresses ?? [];
  const primary = addresses.find((e) => e.id === data.primary_email_address_id);
  const email = (primary ?? addresses[0])?.email_address;
  if (!email) {
    throw new Error(`Clerk user ${data.id} has no email address`);
  }
  return email;
}

/** "First Last", trimmed; null when both names are empty. */
function buildDisplayName(data: ClerkUserPayload): string | null {
  const name = [data.first_name, data.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return name || null;
}

/**
 * Insert or update a Clerk user keyed by `clerkUserId`. On conflict only
 * email, displayName and updatedAt change; role and consent are preserved.
 */
export async function upsertUserFromClerk(
  data: ClerkUserPayload,
  database: Database = appDb,
): Promise<void> {
  const email = pickEmail(data);
  const displayName = buildDisplayName(data);

  await database
    .insert(users)
    .values({ clerkUserId: data.id, email, displayName })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { email, displayName, updatedAt: sql`(unixepoch())` },
    });
}

/**
 * Delete a Clerk user; FK cascades remove their subscriptions, annotations,
 * auditor profile and queued notifications. Unknown ids are a no-op.
 */
export async function deleteUserFromClerk(
  data: ClerkDeletedPayload,
  database: Database = appDb,
): Promise<void> {
  if (!data.id) {
    console.warn('[db/users] user.deleted payload without id; nothing to delete');
    return;
  }
  await database.delete(users).where(eq(users.clerkUserId, data.id));
}

/** Fetch a mirrored user, or null if the webhook has not been processed. */
export async function getUser(
  clerkUserId: string,
  database: Database = appDb,
): Promise<User | null> {
  const rows = await database
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0] ?? null;
}
