/**
 * T12 — Paywall middleware
 *
 * The paywall gates content that requires a paid subscription tier, on top
 * of the Clerk auth gate. Per the doc maestro:
 *
 *   "Las iteraciones del libro operan bajo este muro de pago (paywall),
 *    accesible para los tres tipos de suscriptores (Lector, Colaborador,
 *    Auditor)."
 *
 * Pure logic in `src/lib/paywall.ts`. The middleware translates the
 * decision into a redirect (sign-in for unauthenticated, /suscripcion
 * for tier_insufficient).
 */
import { describe, expect, it } from 'vitest';
import { evaluatePaywall, isPaywalledRoute } from '../src/lib/paywall';
import type { UserRole } from '../src/lib/db/schema';

describe('T12 — isPaywalledRoute', () => {
  it.each([
    '/libro/2026/01/cap-1',
    '/libro/2026/01/cap-1/',
    '/libro/2025/06/cap-final',
    '/en/libro/2026/01/chapter-1',
    '/en/libro/2026/01/chapter-1/',
  ])('gates the paywalled chapter route %s', (pathname) => {
    expect(isPaywalledRoute(pathname)).toBe(true);
  });

  it.each([
    '/',
    '/libro',
    '/libro/',
    '/libro/2026',
    '/libro/2026/',
    '/libro/2026/01',
    '/libro/2026/01/',
    '/auditores',
    '/repositorio',
    '/contacto',
    '/suscripcion',
    '/cuenta',
    '/sign-in',
    '/en',
    '/en/book',
    '/en/book/2026/01',
  ])('does not gate the public route %s', (pathname) => {
    expect(isPaywalledRoute(pathname)).toBe(false);
  });
});

describe('T12 — evaluatePaywall: public routes are always allowed', () => {
  it.each(['/', '/libro', '/libro/2026/01', '/auditores', '/contacto', '/cuenta'])(
    'allows %s regardless of auth/role',
    (pathname) => {
      expect(evaluatePaywall({ pathname, role: null, isAuthenticated: false })).toEqual({
        allowed: true,
      });
      expect(evaluatePaywall({ pathname, role: 'colaborador', isAuthenticated: true })).toEqual({
        allowed: true,
      });
    },
  );
});

describe('T12 — evaluatePaywall: chapter routes require a paid tier', () => {
  const chapter = '/libro/2026/01/cap-1';

  it('denies an unauthenticated visitor (reason: unauthenticated)', () => {
    expect(evaluatePaywall({ pathname: chapter, role: null, isAuthenticated: false })).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    });
  });

  it('denies a signed-in visitor without a role (reason: tier_insufficient)', () => {
    expect(evaluatePaywall({ pathname: chapter, role: null, isAuthenticated: true })).toEqual({
      allowed: false,
      reason: 'tier_insufficient',
    });
  });

  it.each(['lector', 'colaborador', 'auditor'] as UserRole[])(
    'allows a %s to read a chapter',
    (role) => {
      expect(evaluatePaywall({ pathname: chapter, role, isAuthenticated: true })).toEqual({
        allowed: true,
      });
    },
  );

  it('denies an unknown role (defence in depth — getRoleFromClaims already filters)', () => {
    expect(
      evaluatePaywall({ pathname: chapter, role: 'admin' as UserRole, isAuthenticated: true }),
    ).toEqual({ allowed: false, reason: 'tier_insufficient' });
  });
});

describe('T12 — evaluatePaywall: EN mirror is gated the same way', () => {
  const chapterEn = '/en/libro/2026/01/chapter-1';

  it('denies an unauthenticated EN visitor', () => {
    expect(evaluatePaywall({ pathname: chapterEn, role: null, isAuthenticated: false })).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    });
  });

  it('allows a lector on the EN chapter', () => {
    expect(evaluatePaywall({ pathname: chapterEn, role: 'lector', isAuthenticated: true })).toEqual({
      allowed: true,
    });
  });
});
