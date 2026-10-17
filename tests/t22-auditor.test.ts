/**
 * T22 - Auditor ascention logic
 *
 * Pure-logic rules for the role ladder. The DB and Clerk are read by
 * the cron job (T23); these helpers just decide what role a user
 * should hold given their contribution history.
 *
 * Rules from the doc maestro:
 *   "Colaborador que alcance cuatro o mas (4+) aportes que alteren el
 *    canon le sera otorgado el estatus de Auditor por el periodo de un
 *    ano. Para mantener la categoria de Auditor, cada ano subsiguiente
 *    debera cumplir con dos o mas (2+) aportes que alteren el canon."
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateAscention,
  evaluateAuditorRenewal,
  type AscentionDecision,
  type RenewalDecision,
} from '../src/lib/auditor';

describe('T22 - evaluateAscention: first-time promotion to Auditor', () => {
  it('promotes a Colaborador with 4+ canon-altering contributions', () => {
    const decision: AscentionDecision = evaluateAscention({
      currentRole: 'colaborador',
      lifetimeCanonAlteringContributions: 4,
    });
    expect(decision).toEqual({ promoted: true, newRole: 'auditor' });
  });

  it('promotes a Colaborador with more than 4 (e.g. 7)', () => {
    expect(
      evaluateAscention({
        currentRole: 'colaborador',
        lifetimeCanonAlteringContributions: 7,
      }),
    ).toEqual({ promoted: true, newRole: 'auditor' });
  });

  it('denies a Colaborador with exactly 3 contributions (one short of the threshold)', () => {
    expect(
      evaluateAscention({
        currentRole: 'colaborador',
        lifetimeCanonAlteringContributions: 3,
      }),
    ).toEqual({ promoted: false, reason: 'insufficient_contributions' });
  });

  it('denies a Colaborador with 0 contributions', () => {
    expect(
      evaluateAscention({
        currentRole: 'colaborador',
        lifetimeCanonAlteringContributions: 0,
      }),
    ).toEqual({ promoted: false, reason: 'insufficient_contributions' });
  });

  it('is a no-op for a Lector (must upgrade to Colaborador via payment first)', () => {
    expect(
      evaluateAscention({
        currentRole: 'lector',
        lifetimeCanonAlteringContributions: 99,
      }),
    ).toEqual({ promoted: false, reason: 'not_eligible' });
  });

  it('is a no-op for an already-Auditor (use evaluateAuditorRenewal for that)', () => {
    expect(
      evaluateAscention({
        currentRole: 'auditor',
        lifetimeCanonAlteringContributions: 99,
      }),
    ).toEqual({ promoted: false, reason: 'not_eligible' });
  });
});

describe('T22 - evaluateAuditorRenewal: annual maintenance', () => {
  it('renews an Auditor with 2+ contributions in the current year', () => {
    const decision: RenewalDecision = evaluateAuditorRenewal({
      currentRole: 'auditor',
      canonAlteringContributionsThisYear: 2,
    });
    expect(decision).toEqual({ renewed: true, newRole: 'auditor' });
  });

  it('renews an Auditor with more than 2 (e.g. 5)', () => {
    expect(
      evaluateAuditorRenewal({
        currentRole: 'auditor',
        canonAlteringContributionsThisYear: 5,
      }),
    ).toEqual({ renewed: true, newRole: 'auditor' });
  });

  it('denies renewal for an Auditor with only 1 contribution this year', () => {
    expect(
      evaluateAuditorRenewal({
        currentRole: 'auditor',
        canonAlteringContributionsThisYear: 1,
      }),
    ).toEqual({ renewed: false, reason: 'insufficient_contributions' });
  });

  it('denies renewal for an Auditor with 0 contributions this year', () => {
    expect(
      evaluateAuditorRenewal({
        currentRole: 'auditor',
        canonAlteringContributionsThisYear: 0,
      }),
    ).toEqual({ renewed: false, reason: 'insufficient_contributions' });
  });

  it('is not eligible for non-Auditor roles (Colaborador)', () => {
    expect(
      evaluateAuditorRenewal({
        currentRole: 'colaborador',
        canonAlteringContributionsThisYear: 5,
      }),
    ).toEqual({ renewed: false, reason: 'not_eligible' });
  });

  it('is not eligible for non-Auditor roles (Lector)', () => {
    expect(
      evaluateAuditorRenewal({
        currentRole: 'lector',
        canonAlteringContributionsThisYear: 5,
      }),
    ).toEqual({ renewed: false, reason: 'not_eligible' });
  });
});
