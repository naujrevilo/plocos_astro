import type { APIRoute } from 'astro';
import { Comments, and, db, eq, isDbError, desc } from 'astro:db';
import { locales, type Locale } from '../../lib/i18n';


export const prerender = false;

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
} as const;

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SLUG_LENGTH = 256;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: HEADERS,
  });
}

function isSupportedLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function sanitize(input: string, max: number) {
  return input.trim().replace(/\s+/g, ' ').slice(0, max);
}



export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug')?.trim();
  const locale = url.searchParams.get('locale')?.trim();

  if (!slug || !locale) {
    return jsonResponse(400, { error: 'Missing slug or locale.' });
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return jsonResponse(400, { error: 'Invalid slug.' });
  }

  if (!isSupportedLocale(locale)) {
    return jsonResponse(400, { error: 'Unsupported locale.' });
  }

  const rows = await db
    .select({
      id: Comments.id,
      name: Comments.name,
      message: Comments.message,
      createdAt: Comments.createdAt,
      approved: Comments.approved,
    })
    .from(Comments)
    .where(
      and(
        eq(Comments.postSlug, slug),
        eq(Comments.locale, locale),
        eq(Comments.approved, true)
      )
    )
    .orderBy(desc(Comments.createdAt));

  return jsonResponse(200, {
    comments: rows.map(({ id, name, message, createdAt }) => ({
      id,
      name,
      message,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : new Date(createdAt).toISOString(),
    })),
    count: rows.length,
  });
};

interface CommentPayload {
  slug?: string;
  locale?: string;
  name?: string;
  email?: string | null;
  message?: string;
  website?: string | null;
}

function parsePayload(data: unknown): CommentPayload | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const { slug, locale, name, email, message, website } = data as CommentPayload;
  return { slug, locale, name, email: email ?? null, message, website: website ?? null };
}

function validateEmail(input: string) {
  if (!input) return false;
  if (input.length > MAX_EMAIL_LENGTH) return false;
  const email = input.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';
  let body: CommentPayload | null = null;

  try {
    if (contentType.includes('application/json')) {
      body = parsePayload(await request.json());
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = {
        slug: formData.get('slug')?.toString(),
        locale: formData.get('locale')?.toString(),
        name: formData.get('name')?.toString(),
        email: formData.get('email')?.toString() ?? null,
        message: formData.get('message')?.toString(),
        website: formData.get('website')?.toString() ?? null,
      };
    }
  } catch (error) {
    console.error('Failed to parse comment payload', error);
    return jsonResponse(400, { error: 'Invalid payload.' });
  }

  if (!body) {
    return jsonResponse(415, { error: 'Unsupported content type.' });
  }

  const slug = body.slug?.trim();
  const locale = body.locale?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim() ?? null;
  const message = body.message?.trim();

    if (!slug || slug.length > MAX_SLUG_LENGTH) {
      return jsonResponse(400, { error: 'Invalid slug.' });
  }

    if (!locale || !isSupportedLocale(locale)) {
      return jsonResponse(400, { error: 'Unsupported locale.' });
  }

  const supportedLocale = locale as Locale;

  if (!name) {
    return jsonResponse(400, { error: 'Name is required.' });
  }

  if (name.length > MAX_NAME_LENGTH) {
    return jsonResponse(400, { error: 'Name is too long.' });
  }

  if (message === undefined || message === null || message.trim().length === 0) {
    return jsonResponse(400, { error: 'Message is required.' });
  }

  const normalizedMessage = message.trim();
  if (normalizedMessage.length < 6) {
    return jsonResponse(400, { error: 'Message is too short.' });
  }

  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse(400, { error: 'Message is too long.' });
  }

  if (email && !validateEmail(email)) {
    return jsonResponse(400, { error: 'Invalid email address.' });
  }

  try {
    await db.insert(Comments).values({
      postSlug: slug,
      locale: supportedLocale,
      name: sanitize(name, MAX_NAME_LENGTH),
      email: email ? email.trim().slice(0, MAX_EMAIL_LENGTH) : null,
      message: normalizedMessage,
      approved: false,
    });
  } catch (error) {
    if (isDbError(error)) {
      console.error('Database error while creating comment', error);
      return jsonResponse(500, { error: 'Failed to store comment.' });
    }
    console.error('Unexpected error while creating comment', error);
    return jsonResponse(500, { error: 'Unexpected error.' });
  }

  return jsonResponse(201, { status: 'pending' });
};
