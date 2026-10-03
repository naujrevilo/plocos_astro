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
 * Any unhandled event returns 200 OK so Clerk does not retry. Database
 * errors (UNIMPLEMENTED in T08 mockups) are also swallowed with a 200
 * response + a console.error so we don't burn retry budget while the DB
 * layer lands in T10/T11.
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
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as { type: string; data: any };
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
    // Mockups throw UNIMPLEMENTED. Log and return 200 so Clerk doesn't
    // retry; real DB errors will be wired once T10/T11 land.
    console.error('[clerk webhook] handler error:', err);
  }

  return new Response('OK', { status: 200 });
};