/**
 * Protected Canon PDF — `src/pages/api/books/[year]/[cycle].pdf.ts` (T14a)
 *
 * Signed-out visitors never get here: this route is not in the middleware
 * allow-list, so Clerk sends them to sign-in. Signed-in users without a role
 * (no subscription) are redirected to the subscription page; any role reads
 * the Canon.
 *
 * The PDF is streamed from Netlify Blobs, never buffered: Netlify functions
 * cap buffered responses at 6 MB and streamed ones at 20 MB.
 */
import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import { getRoleFromClaims } from '../../../../lib/access';
import { BOOKS_STORE, getIteration } from '../../../../lib/books';
import { translations, defaultLocale, type Locale } from '../../../../lib/i18n';
import { createLocaleHref } from '../../../../lib/routes';

const notFound = () => new Response('Not found', { status: 404 });

/** Strictly positive integer from a route param, else null. */
function toPositiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export const GET: APIRoute = async ({ params, locals, url, redirect }) => {
  const role = getRoleFromClaims(locals.auth().sessionClaims);
  if (!role) {
    const requested = url.searchParams.get('locale');
    const locale: Locale =
      requested && requested in translations ? (requested as Locale) : defaultLocale;
    return redirect(createLocaleHref(locale, translations[locale].paths.suscripcion), 302);
  }

  const year = toPositiveInt(params.year);
  const cycle = toPositiveInt(params.cycle);
  if (year === null || cycle === null) return notFound();

  const iteration = await getIteration(year, cycle);
  if (!iteration?.pdfUrl) return notFound();

  const stream = await getStore(BOOKS_STORE).get(iteration.pdfUrl, { type: 'stream' });
  if (!stream) return notFound();

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="nomas-que-la-vida-${year}-${cycle}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
