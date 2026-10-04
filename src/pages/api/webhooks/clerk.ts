/**
 * Clerk webhook handler — `src/pages/api/webhooks/clerk.ts`
 *
 * Verifies the inbound request signature with svix (per the svix spec that
 * Clerk uses), parses the event payload, and dispatches to the local
 * `users` mirror helpers in `src/lib/db/users.ts`.
 *
 * Handled event types:
 *   - user.created   → upsertUserFromClerk
 *   - user.updated   → upsertUserFromClerk
 *   - user.deleted   → deleteUserFromClerk
 *
 * Responses:
 *   - 400 for missing svix headers or an invalid signature / body.
 *   - 500 when the signing secret is missing or the database write fails;
 *     the error is logged and Clerk retries the delivery.
 *   - 200 once the event is handled, and for unhandled event types (so
 *     Clerk does not retry them).
 */
import type { APIRoute } from 'astro';
import { Webhook } from 'svix';
import {
  deleteUserFromClerk,
  upsertUserFromClerk,
} from '../../../lib/db/users';

export const POST: APIRoute = async ({ request }) => {
  const CLERK_WEBHOOK_SIGNING_SECRET =
    import.meta.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!CLERK_WEBHOOK_SIGNING_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const svix_id = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const body = await request.text();

  const wh = new Webhook(CLERK_WEBHOOK_SIGNING_SECRET);

  let evt: { type: string; data: any };
  try {
    // svix >= 2.x `verify` returns void, so parse the verified body ourselves.
    wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
    evt = JSON.parse(body) as { type: string; data: any };
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await upsertUserFromClerk(evt.data);
        break;
      case 'user.deleted':
        await deleteUserFromClerk(evt.data);
        break;
      default:
        // Unhandled event type — accept silently.
        break;
    }
  } catch (err) {
    // Non-2xx makes Clerk retry with backoff, so a transient DB failure does
    // not silently lose the mirror update.
    console.error(`[clerk webhook] ${evt.type} failed:`, err);
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
};
