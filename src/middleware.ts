/**
 * Clerk middleware — gate every request through clerkMiddleware so that
 * `Astro.locals.auth()` is populated before any page renders.
 *
 * Public routes (anyone may load, no auth required):
 *   - /                      : landing (Sec Inicio)
 *   - /libro(.*)             : Sec Nomás que la Vida (intro pública; el PDF
 *                              itera bajo paywall — protección real en T12/T14)
 *   - /auditores(.*)         : Sec Auditores (hall de la fama público)
 *   - /repositorio(.*)       : Sec Repositorio (lectura pública; interacción
 *                              requiere sesión de Colaborador/Auditor)
 *   - /contacto(.*)          : Sec Contacto (ARCO + consultas)
 *   - /suscripcion(.*)       : flujo de suscripción
 *   - /terminos(.*)          : legal hub + sub-documentos
 *   - /privacidad            : privacy policy
 *   - /politica-de-cookies   : cookie policy
 *   - /en/(book|auditors|repository|contact|subscription|terms|privacy|cookie-policy)(.*)
 *                            : EN mirrors of the public sections
 *   - /api/webhooks(.*)      : inbound webhooks (signed by providers)
 *   - /sign-in(.*), /en/sign-in(.*) : Clerk sign-in UI (ES / EN)
 *   - /sign-up(.*), /en/sign-up(.*) : Clerk sign-up UI (ES / EN)
 *
 * Protected routes (require an authenticated user; unauthenticated requests
 * are redirected to /en/sign-in for /en/* and to /sign-in otherwise):
 *   - /cuenta(.*) and /en/account(.*) : subscriber account dashboard
 *   - /api/(?!webhooks)      : any other API endpoint
 *
 * The paywall for individual book chapters will be enforced by the paywall
 * middleware (T12), NOT by this auth gate. This middleware only decides
 * whether the visitor must be *logged in*; it does not decide subscription
 * tier or chapter access.
 */
import { clerkMiddleware } from '@clerk/astro/server';
import { createRouteMatcher, getSignInPath } from './lib/routeMatcher';
import { getRoleFromClaims } from './lib/access';
import { evaluatePaywall } from './lib/paywall';

const isPublicRoute = createRouteMatcher([
  '/',
  // Public product sections (ES)
  '/libro(.*)',
  '/auditores(.*)',
  '/repositorio(.*)',
  '/contacto(.*)',
  '/suscripcion(.*)',
  // Legal
  '/terminos(.*)',
  '/privacidad',
  '/politica-de-cookies',
  // EN mirrors
  '/en',
  '/en/book(.*)',
  '/en/auditors(.*)',
  '/en/repository(.*)',
  '/en/contact(.*)',
  '/en/subscription(.*)',
  '/en/terms(.*)',
  '/en/privacy',
  '/en/cookie-policy',
  // Public API surfaces
  '/api/webhooks(.*)',
  // Auth UI
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/en/sign-in(.*)',
  '/en/sign-up(.*)',
]);

/**
 * Map a pathname to the matching subscription path in the same locale.
 * Used as the redirect target when the paywall denies access for a signed-
 * in visitor without a paid role.
 */
function getSubscriptionPath(pathname: string): string {
  return pathname === '/en' || pathname.startsWith('/en/') ? '/en/subscription' : '/suscripcion';
}

export const onRequest = clerkMiddleware((auth, context) => {
  const { pathname } = new URL(context.request.url);
  // Public routes bypass both auth and paywall (marketing, legal, auth UI).
  if (isPublicRoute(pathname)) return;

  // Auth gate (T08): a signed-in visitor is required for everything that
  // is not public. The exact redirect target is locale-aware.
  if (!auth().userId) {
    return context.redirect(getSignInPath(pathname));
  }

  // Paywall gate (T12): a paid role is required for chapter routes
  // (`/libro/[year]/[cycle]/[chapter]` and the EN mirror). Other
  // non-public routes (e.g. /cuenta) only need auth.
  const role = getRoleFromClaims(auth().sessionClaims);
  const decision = evaluatePaywall({
    pathname,
    role,
    isAuthenticated: true,
  });

  if (decision.allowed) return;

  // tier_insufficient: signed in but no paid role. Send to the
  // subscription page in the same locale, with `?next=` so we can come
  // back to the original chapter after the role is provisioned.
  const subscriptionPath = getSubscriptionPath(pathname);
  const next = encodeURIComponent(pathname);
  return context.redirect(`${subscriptionPath}?next=${next}`);
});
