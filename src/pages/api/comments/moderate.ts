import type { APIRoute } from 'astro';
import { Comments, db, eq } from 'astro:db';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
} as const;

const COOKIE_NAME = 'plocos-comments-token';

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = import.meta.env.COMMENTS_MODERATION_TOKEN;

  if (!token) {
    return json(500, { error: 'COMMENTS_MODERATION_TOKEN is not configured.' });
  }

  const cookieToken = cookies.get(COOKIE_NAME)?.value;
  const headerToken = request.headers.get('x-comments-token');

  if (cookieToken !== token && headerToken !== token) {
    return json(401, { error: 'Unauthorized.' });
  }

  let payload: { id?: number | string; action?: string } | undefined;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('Failed to parse moderation payload', error);
    return json(400, { error: 'Invalid payload.' });
  }

  if (!payload) {
    return json(400, { error: 'Missing payload.' });
  }

  const id = Number(payload.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json(400, { error: 'Invalid comment id.' });
  }

  const action = payload.action;
  if (action !== 'approve' && action !== 'delete') {
    return json(400, { error: 'Unsupported action.' });
  }

  try {
    if (action === 'approve') {
      const result = await db
        .update(Comments)
        .set({ approved: true })
        .where(eq(Comments.id, id))
        .returning({ id: Comments.id });

      if (!result.length) {
        return json(404, { error: 'Comment not found.' });
      }

      return json(200, { status: 'approved', id });
    }

    const result = await db.delete(Comments).where(eq(Comments.id, id)).returning({ id: Comments.id });
    if (!result.length) {
      return json(404, { error: 'Comment not found.' });
    }
    return json(200, { status: 'deleted', id });
  } catch (error) {
    console.error('Failed to moderate comment', error);
    return json(500, { error: 'Unexpected error.' });
  }
};
