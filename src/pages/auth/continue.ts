/**
 * Post sign-in landing — `src/pages/auth/continue.ts` (T26)
 *
 * `<SignIn fallbackRedirectUrl>` points here, so it only runs when the user
 * signed in without a `redirect_url` (e.g. from the header). Reads the role
 * from the session token and redirects to the section that role can access.
 * Not in the middleware allow-list: signed-out visitors are sent to sign-in.
 */
import type { APIRoute } from 'astro';
import { getPostSignInTarget, getRoleFromClaims } from '../../lib/access';
import { translations, defaultLocale, type Locale } from '../../lib/i18n';
import { createLocaleHref } from '../../lib/routes';

export const GET: APIRoute = ({ locals, url, redirect }) => {
  const requested = url.searchParams.get('locale');
  const locale: Locale = requested && requested in translations ? (requested as Locale) : defaultLocale;

  const role = getRoleFromClaims(locals.auth().sessionClaims);
  const target = getPostSignInTarget(role);

  return redirect(createLocaleHref(locale, translations[locale].paths[target]), 302);
};
