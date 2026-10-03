/**
 * Clerk middleware — gate every request through clerkMiddleware so that
 * `Astro.locals.auth()` is populated before any page renders.
 *
 * Public routes (anyone may load):
 *   - /                  : landing
 *   - /terminos(.*)      : legal hub + sections
 *   - /privacidad        : privacy policy
 *   - /politica-de-cookies : cookie policy
 *   - /en/terms(.*)      : legal hub EN + sections
 *   - /en/privacy        : privacy policy EN
 *   - /en/cookie-policy  : cookie policy EN
 *   - /api/webhooks(.*)  : inbound webhooks (signed by providers)
 *   - /sign-in(.*)       : Clerk sign-in UI
 *   - /sign-up(.*)       : Clerk sign-up UI
 *
 * Everything else (account, book, auditors, repository, contacto, suscriptor,
 * and any future /api/* endpoint) requires an authenticated user.
 */
import { clerkMiddleware } from '@clerk/astro/server';
import { createRouteMatcher } from './lib/routeMatcher';

const isPublicRoute = createRouteMatcher([
  '/',
  '/terminos(.*)',
  '/privacidad',
  '/politica-de-cookies',
  '/en/terms(.*)',
  '/en/privacy',
  '/en/cookie-policy',
  '/api/webhooks(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export const onRequest = clerkMiddleware((auth, context) => {
  if (!isPublicRoute(new URL(context.request.url).pathname) && !auth().userId) {
    const referer = context.request.headers.get('Referer');
    const fallback = referer && referer !== '' ? referer : '/sign-in';
    return context.redirect(fallback);
  }
});