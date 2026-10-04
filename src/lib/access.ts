/**
 * @module access
 * @description Role-based access rules for signed-in users (T26).
 *
 * The role lives in Turso (`users.role`, source of truth) and is mirrored to
 * Clerk `publicMetadata`, which the session token exposes as `metadata.role`
 * (Clerk Dashboard → Sessions → Customize session token:
 * `{"metadata": "{{user.public_metadata}}"}`). Reading it from the token keeps
 * the header and the post-sign-in redirect free of per-request DB queries.
 *
 * This module is framework-free: it returns route keys, and the Astro layer
 * turns them into locale-aware URLs.
 */
import { USER_ROLES, type UserRole } from './db/schema';

/** Route keys (from `translations.paths`) a signed-in user can be sent to. */
export type PostSignInTarget = 'book' | 'suscripcion';

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);

/**
 * Extract the subscriber role from Clerk session claims.
 *
 * Claims are untrusted input: anything that is not a known role (missing
 * metadata, unknown string, wrong type) is treated as "no role".
 */
export function getRoleFromClaims(claims: unknown): UserRole | null {
  if (!claims || typeof claims !== 'object') return null;
  const metadata = (claims as { metadata?: unknown }).metadata;
  if (!metadata || typeof metadata !== 'object') return null;
  const role = (metadata as { role?: unknown }).role;
  return isUserRole(role) ? role : null;
}

/**
 * Decide where a user lands right after signing in.
 */
export function getPostSignInTarget(role: UserRole | null): PostSignInTarget {
  switch (role) {
    // Every paid tier reads the Canon archive (doc maestro: "Acceso al Canon").
    case 'lector':
    case 'colaborador':
    case 'auditor':
      return 'book';
    // No role yet means no active subscription.
    case null:
      return 'suscripcion';
  }
}

/**
 * Whether the user may submit contributions to the Repositorio.
 * Lectores only read; Colaboradores and Auditores interact (doc maestro §Roles).
 */
export function canContribute(role: UserRole | null): boolean {
  return role === 'colaborador' || role === 'auditor';
}
