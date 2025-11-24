/**
 * @file src/pages/api/comments.ts
 * @description API endpoint for managing comments.
 *
 * @method GET
 * @description Fetches approved comments for a given post slug and locale.
 * @param {string} slug - The slug of the post.
 * @param {string} locale - The locale of the post.
 * @returns {Response} - A JSON response with the comments or an error message.
 *
 * @method POST
 * @description Creates a new comment for a given post slug.
 * @param {Request} request - The request object, containing the comment data in the body.
 * @returns {Response} - A JSON response with a success or error message.
 *
 * @see {@link /src/pages/admin/comments.astro} - The page that uses this endpoint to display and moderate comments.
 */
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { Comments } from '../../lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { locales, type Locale, getTranslations } from '../../lib/i18n';
import { createLocaleHref } from '../../lib/routes';

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

function wantsJson(request: Request) {
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return true;
  }
  if (accept.includes('text/html')) {
    return false;
  }
  const contentType = request.headers.get('content-type') ?? '';
  return contentType.includes('application/json');
}

function buildCommentPath(locale: Locale, slug: string, status: 'pending' | 'error') {
  const translations = getTranslations(locale);
  const basePath = createLocaleHref(locale, `${translations.paths.posts}/${slug}`);
  const url = new URL(basePath, 'http://localhost');
  url.searchParams.set('comment', status);
  url.hash = 'comments';
  return `${url.pathname}${url.search}${url.hash}`;
}

function respond(
  request: Request,
  status: number,
  body: Record<string, unknown>,
  fallback?: { locale?: Locale; slug?: string; status: 'pending' | 'error' }
) {
  if (!wantsJson(request)) {
    if (fallback?.locale && fallback.slug) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: buildCommentPath(fallback.locale, fallback.slug, fallback.status),
        },
      });
    }
    const referer = request.headers.get('referer');
    if (referer) {
      console.log(`Fetching comments for slug: ${slug}, locale: ${locale}`);

  try {
        const redirect = new URL(referer);
        if (fallback?.status) {
          redirect.searchParams.set('comment', fallback.status);
          redirect.hash = 'comments';
        }
        return new Response(null, {
          status: 303,
          headers: { Location: redirect.toString() },
        });
      } catch (error) {
        console.warn('Failed to build referer fallback', error);
      }
    }
  }
  return jsonResponse(status, body);
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

  try {
    const rows = await db
      .select({
        name: Comments.name,
        message: Comments.message,
        createdAt: Comments.createdAt,
      })
      .from(Comments)
      .where(
        and(
          eq(Comments.postSlug, slug),
          eq(Comments.locale, locale),
          eq(Comments.approved, 1)
        )
      )
      .orderBy(desc(Comments.createdAt));

    console.log(`Found ${rows.length} approved comments for slug: ${slug}`);

    return jsonResponse(200, {
      comments: rows.map(({ name, message, createdAt }) => ({
        name,
        message,
        createdAt: createdAt.toISOString(),
      })),
      count: rows.length,
    });
  } catch (error) {
    console.error('Failed to fetch comments', error);
    return jsonResponse(500, { error: 'Failed to fetch comments.' });
  }
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
  const errorFallback = { locale: supportedLocale, slug, status: 'error' as const };

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
  if (normalizedMessage.length < 8) {
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
      approved: 0,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating comment', error);
    return respond(request, 500, { error: 'Failed to store comment.' }, errorFallback);
  }

  return respond(request, 201, { status: 'pending' }, { locale: supportedLocale, slug, status: 'pending' });
};