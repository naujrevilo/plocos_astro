/**
 * @module auditor
 * @description Pure-logic rules for Auditor ascention and renewal (T22).
 *
 * The cron job (T23) reads the DB, calls these helpers, and writes the
 * resulting role back to Clerk's publicMetadata. This module is
 * framework-free and stateless.
 *
 * Rules from the doc maestro:
 *   "Colaborador que alcance cuatro o mas (4+) aportes que alteren el
 *    canon le sera otorgado el estatus de Auditor por el periodo de un
 *    ano. Para mantener la categoria de Auditor, cada ano subsiguiente
 *    debera cumplir con dos o mas (2+) aportes que alteren el canon."
 */
import type { UserRole } from './db/schema';

/** Number of lifetime canon-altering contributions required for first ascention. */
export const ASCENTION_THRESHOLD = 4;
/** Number of per-year canon-altering contributions required to renew Auditor status. */
export const RENEWAL_THRESHOLD = 2;

export type AscentionDecision =
  | { promoted: true; newRole: 'auditor' }
  | { promoted: false; reason: 'not_eligible' | 'insufficient_contributions' };

export type RenewalDecision =
  | { renewed: true; newRole: 'auditor' }
  | { renewed: false; reason: 'not_eligible' | 'insufficient_contributions' };

/**
 * Decide whether a user should be promoted to Auditor for the first time.
 *
 * - Lector: never eligible here (must upgrade to Colaborador via payment).
 * - Auditor: out of scope here (use evaluateAuditorRenewal for status checks).
 * - Colaborador: promoted when lifetime canon-altering contributions reach
 *   ASCENTION_THRESHOLD (4+).
 */
export function evaluateAscention(input: {
  currentRole: UserRole;
  lifetimeCanonAlteringContributions: number;
}): AscentionDecision {
  if (input.currentRole !== 'colaborador') {
    return { promoted: false, reason: 'not_eligible' };
  }
  if (input.lifetimeCanonAlteringContributions < ASCENTION_THRESHOLD) {
    return { promoted: false, reason: 'insufficient_contributions' };
  }
  return { promoted: true, newRole: 'auditor' };
}

/**
 * Decide whether an existing Auditor keeps their status for the current year.
 *
 * Renewal requires RENEWAL_THRESHOLD (2+) canon-altering contributions
 * within the current year. Non-Auditors are not eligible for renewal.
 */
export function evaluateAuditorRenewal(input: {
  currentRole: UserRole;
  canonAlteringContributionsThisYear: number;
}): RenewalDecision {
  if (input.currentRole !== 'auditor') {
    return { renewed: false, reason: 'not_eligible' };
  }
  if (input.canonAlteringContributionsThisYear < RENEWAL_THRESHOLD) {
    return { renewed: false, reason: 'insufficient_contributions' };
  }
  return { renewed: true, newRole: 'auditor' };
}
