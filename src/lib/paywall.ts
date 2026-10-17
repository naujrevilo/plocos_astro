/**
 * @module paywall
 * @description Content-tier gate for paid routes (T12).
 *
 * Pure logic: takes a pathname and the visitor's role, returns a decision
 * the middleware can act on. No Clerk, no Astro, no DB.
 *
 * Per the doc maestro:
 *   "Las iteraciones del libro operan bajo este muro de pago (paywall),
 *    accesible para los tres tipos de suscriptores (Lector, Colaborador,
 *    Auditor)."
 *
 * Routing policy:
 * - `/libro/[year]/[cycle]/[chapter]` (and EN mirror) is the only tier
 *   currently gated here. T14 will create the chapter pages; this
 *   function is ready before them so the gate ships with the page work.
 * - The PDF download API (`/api/books/[year]/[cycle].pdf`) is gated
 *   separately in T14a.
 */
import type { UserRole } from './db/schema';

export type PaywallReason = 'unauthenticated' | 'tier_insufficient';

export type PaywallDecision =
  | { allowed: true }
  | { allowed: false; reason: PaywallReason };

/**
 * Routes that require a paid tier. Today this is the chapter path
 * `/libro/[year]/[cycle]/[chapter]` (ES + EN). The cycle and year
 * indexes stay public so visitors can browse the archive before paying.
 */
const PAYWALLED_PATTERN = /^\/(en\/)?libro\/\d{4}\/\d{1,2}\/[a-z0-9-]+\/?$/i;

export function isPaywalledRoute(pathname: string): boolean {
  return PAYWALLED_PATTERN.test(pathname);
}

const PAID_TIER: readonly UserRole[] = ['lector', 'colaborador', 'auditor'] as const;

function isPaidTier(role: unknown): role is UserRole {
  return typeof role === 'string' && (PAID_TIER as readonly string[]).includes(role);
}

/**
 * Evaluate access for a request to `pathname` given the visitor's auth
 * state and role. Returns `{ allowed: true }` for routes that are not
 * paywalled; for paywalled routes, requires both auth and a paid role.
 */
export function evaluatePaywall(input: {
  pathname: string;
  role: UserRole | null;
  isAuthenticated: boolean;
}): PaywallDecision {
  if (!isPaywalledRoute(input.pathname)) {
    return { allowed: true };
  }
  if (!input.isAuthenticated) {
    return { allowed: false, reason: 'unauthenticated' };
  }
  if (!isPaidTier(input.role)) {
    return { allowed: false, reason: 'tier_insufficient' };
  }
  return { allowed: true };
}
