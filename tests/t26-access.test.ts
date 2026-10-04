/**
 * T26 — Role-based access after sign-in
 *
 * Pure-logic tests for `src/lib/access.ts`. The role travels in the Clerk
 * session token as `metadata.role` (mirrored from `publicMetadata`); these
 * tests pin how that untrusted claim is parsed and where each role lands.
 */
import { describe, expect, it } from 'vitest';
import {
  canContribute,
  getPostSignInTarget,
  getRoleFromClaims,
} from '../src/lib/access';

describe('T26 — getRoleFromClaims', () => {
  it.each(['lector', 'colaborador', 'auditor'] as const)(
    'accepts the known role %s',
    (role) => {
      expect(getRoleFromClaims({ metadata: { role } })).toBe(role);
    },
  );

  it('returns null when there are no claims', () => {
    expect(getRoleFromClaims(null)).toBeNull();
    expect(getRoleFromClaims(undefined)).toBeNull();
  });

  it('returns null when metadata or role is missing', () => {
    expect(getRoleFromClaims({})).toBeNull();
    expect(getRoleFromClaims({ metadata: {} })).toBeNull();
  });

  it('returns null for unknown or malformed roles', () => {
    expect(getRoleFromClaims({ metadata: { role: 'admin' } })).toBeNull();
    expect(getRoleFromClaims({ metadata: { role: 42 } })).toBeNull();
    expect(getRoleFromClaims({ metadata: 'colaborador' })).toBeNull();
  });
});

describe('T26 — getPostSignInTarget', () => {
  it.each(['lector', 'colaborador', 'auditor'] as const)(
    'sends %s to the book archive',
    (role) => {
      expect(getPostSignInTarget(role)).toBe('book');
    },
  );

  it('sends users without a role to the subscription page', () => {
    expect(getPostSignInTarget(null)).toBe('suscripcion');
  });
});

describe('T26 — canContribute', () => {
  it('allows colaborador and auditor', () => {
    expect(canContribute('colaborador')).toBe(true);
    expect(canContribute('auditor')).toBe(true);
  });

  it('denies lector and users without a role', () => {
    expect(canContribute('lector')).toBe(false);
    expect(canContribute(null)).toBe(false);
  });
});
