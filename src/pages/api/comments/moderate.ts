import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { Comments } from '../../../lib/db/schema';
import { inArray } from 'drizzle-orm';

const COOKIE_NAME = 'plocos-comments-token';

type ModerateAction = 'approve' | 'reject' | 'spam' | 'delete';

interface ModeratePayload {
  ids?: unknown;
  id?: unknown;
  action?: unknown;
  reason?: unknown;
  notifyAuthor?: unknown;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function parseIds(payload: ModeratePayload): number[] {
  if (Array.isArray(payload.ids)) {
    return payload.ids
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .map((value) => Math.trunc(value));
  }
  if (typeof payload.id === 'number' && Number.isFinite(payload.id)) {
    return [Math.trunc(payload.id)];
  }
  if (typeof payload.id === 'string' && payload.id.trim() !== '') {
    const parsed = Number(payload.id);
    if (Number.isFinite(parsed)) return [Math.trunc(parsed)];
  }
  return [];
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const moderationToken = import.meta.env.COMMENTS_MODERATION_TOKEN;
  const providedToken = cookies.get(COOKIE_NAME)?.value ?? null;

  if (!moderationToken || providedToken !== moderationToken) {
    return json(401, { error: 'Unauthorized' });
  }

  let payload: ModeratePayload;
  try {
    payload = (await request.json()) as ModeratePayload;
  } catch (error) {
    console.warn('Failed to parse moderate payload', error);
    return json(400, { error: 'Invalid JSON body.' });
  }

  const ids = parseIds(payload);
  const actionRaw = typeof payload.action === 'string' ? payload.action : '';
  const reason = typeof payload.reason === 'string' ? payload.reason.trim().slice(0, 200) : null;
  const notifyAuthor = payload.notifyAuthor === true ? 1 : 0;

  if (ids.length === 0) {
    return json(400, { error: 'Missing or invalid ids.' });
  }

  const validActions: ModerateAction[] = ['approve', 'reject', 'spam', 'delete'];
  if (!(validActions as readonly string[]).includes(actionRaw)) {
    return json(400, { error: 'Invalid action.' });
  }

  const action = actionRaw as ModerateAction;

  try {
    if (action === 'delete') {
      await db.delete(Comments).where(inArray(Comments.id, ids));
      return json(200, { success: true, action, affected: ids.length });
    }

    if (action === 'approve') {
      await db
        .update(Comments)
        .set({ status: 'approved', rejectionReason: null, notifyAuthor: 0 })
        .where(inArray(Comments.id, ids));
      return json(200, { success: true, action, affected: ids.length });
    }

    // reject or spam — record reason + notify flag
    const nextStatus: 'rejected' | 'spam' = action === 'reject' ? 'rejected' : 'spam';
    await db
      .update(Comments)
      .set({ status: nextStatus, rejectionReason: reason, notifyAuthor })
      .where(inArray(Comments.id, ids));

    return json(200, { success: true, action, affected: ids.length });
  } catch (error) {
    console.error('Failed to moderate comment(s)', error);
    return json(500, { error: 'Failed to moderate comment(s).' });
  }
};
