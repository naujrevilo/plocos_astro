/**
 * @module db/users
 * @description Helpers to mirror Clerk users into the local `users` table.
 *
 * T08 wires the surface (signatures, return shapes, error handling). The
 * real database operations will be implemented in a follow-up task that
 * owns the subscriptions / paywall flow (T10/T11). For now, the helpers
 * accept the same payload that Clerk sends in `user.created`,
 * `user.updated`, and `user.deleted` webhooks, and they throw an
 * explicit `UNIMPLEMENTED` error if called — production must wire these
 * to the actual `db` (libsql) connection.
 *
 * The webhook handler (`src/pages/api/webhooks/clerk.ts`) imports these
 * helpers and catches the UNIMPLEMENTED error so that signature-verified
 * requests still return 200 OK to Clerk (Clerk retries on non-2xx, which
 * we want to avoid until the DB layer is fully wired).
 */
import type { User as ClerkUser } from '@clerk/backend';

/**
 * Minimum shape we care about from Clerk's webhook payloads. Clerk sends
 * a richer User object; we narrow it here to the fields the local `users`
 * table stores.
 */
export type ClerkUserPayload = Pick<
  ClerkUser,
  'id' | 'email_addresses' | 'first_name' | 'last_name'
>;

/**
 * Upsert a Clerk user into the local `users` table.
 *
 * Called from the Clerk webhook for `user.created` and `user.updated`
 * events. The local `users.clerkUserId` is the PRIMARY KEY so this is a
 * true insert-or-update keyed by Clerk's `user.id`.
 */
export async function upsertUserFromClerk(
  _data: ClerkUserPayload,
): Promise<void> {
  // TODO(plocos): replace with the real drizzle upsert once T07's `users`
  // table is connected to the libsql client (T10/T11 follow-up).
  // Reference:
  //   await db.insert(users).values({...}).onConflictDoUpdate({...});
  throw new Error('upsertUserFromClerk: UNIMPLEMENTED (T08 mockup)');
}

/**
 * Delete a Clerk user from the local `users` table (cascades per schema).
 *
 * Called from the Clerk webhook for `user.deleted` events. ARCO right of
 * Cancellation (Ley 1581/2012) requires this on Clerk-side account
 * deletion; the local row is the source of truth for downstream cascade.
 */
export async function deleteUserFromClerk(
  _data: Pick<ClerkUser, 'id'>,
): Promise<void> {
  // TODO(plocos): replace with the real drizzle delete.
  // Reference:
  //   await db.delete(users).where(eq(users.clerkUserId, _data.id));
  throw new Error('deleteUserFromClerk: UNIMPLEMENTED (T08 mockup)');
}

/**
 * Fetch a local user row by Clerk user id. Returns null when the user
 * has not been mirrored yet (e.g. webhook not processed).
 */
export async function getUser(
  _clerkUserId: string,
): Promise<null> {
  // TODO(plocos): replace with the real drizzle select.
  // Reference:
  //   const rows = await db.select().from(users).where(eq(users.clerkUserId, _clerkUserId)).limit(1);
  //   return rows[0] ?? null;
  throw new Error('getUser: UNIMPLEMENTED (T08 mockup)');
}