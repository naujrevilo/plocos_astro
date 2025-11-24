import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { Comments } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'plocos-comments-token';

export const POST: APIRoute = async ({ request, cookies }) => {
  const moderationToken = process.env.COMMENTS_MODERATION_TOKEN;
  const providedToken = cookies.get(COOKIE_NAME)?.value ?? null;

  if (!moderationToken || providedToken !== moderationToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return new Response(JSON.stringify({ error: 'Missing id or action' }), { status: 400 });
    }

    if (action === 'approve') {
      await db.update(Comments).set({ approved: 1 }).where(eq(Comments.id, id));
    } else if (action === 'delete') {
      await db.delete(Comments).where(eq(Comments.id, id));
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Failed to moderate comment', error);
    return new Response(JSON.stringify({ error: 'Failed to moderate comment' }), { status: 500 });
  }
};
