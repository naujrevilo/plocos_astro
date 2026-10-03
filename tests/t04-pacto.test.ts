/**
 * T04 — Pacto lectura 11 secciones + 3 sub-páginas (NQLV plataforma)
 *
 * Strict TDD invariant tests:
 *
 *   1. pacto.es.json and pacto.en.json must each carry 11 sections:
 *      the 8 originals (already legally reviewed) PLUS
 *      3 new sections extracted from the client master file:
 *        IX. Habeas Scriptum
 *        X.  Términos y Condiciones de Auditoría
 *        XI. Declaración de Simbiosis Algorítmica (Transparencia Radical)
 *
 *   2. Six standalone JSON files (3 ES + 3 EN mirrors) under
 *      src/content/_data/ expose each new section as its own document,
 *      reachable from the navigation. EN mirrors carry the
 *      "[EN: TODO legal review by Colombian attorney]" marker.
 *
 *   3. Six new Astro pages (3 ES + 3 EN) render the standalone JSONs.
 *
 *   4. The byte-level SHA-256 invariant of the pacto body must match the
 *      canonical fixture. The pacto body's hash is a merge-blocking gate
 *      (pnpm verify:pacto is wired to prebuild).
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..');

function repoPath(rel: string): string {
  return resolve(repoRoot, rel);
}

function lf(s: string): string {
  return s.replace(/\r\n/g, '\n');
}

function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

const ORIGINAL_HEADINGS_ES = [
  'I. EL PACTO COGNITIVO (MANIFIESTO Y NATURALEZA EDITORIAL)',
  'II. NATURALEZA TRANSACCIONAL Y CAPACIDAD JURÍDICA',
  'III. ARQUITECTURA DE LA PROPIEDAD INTELECTUAL Y LICENCIAMIENTO',
  'IV. PROTECCIÓN ANTI-IA Y PROHIBICIÓN DE MINERÍA DE DATOS',
  'V. POLÍTICA DE PAGOS, RETRACTO Y REEMBOLSOS',
  'VI. LIMITACIONES ÉTICAS, INTERACCIÓN Y EXPULSIÓN',
  'VII. SOBERANÍA DIGITAL Y PRIVACIDAD',
  'VIII. LEY APLICABLE Y JURISDICCIÓN',
];

const ORIGINAL_HEADINGS_EN = [
  'I. THE COGNITIVE PACT (MANIFESTO AND EDITORIAL NATURE)',
  'II. TRANSACTIONAL NATURE AND LEGAL CAPACITY',
  'III. INTELLECTUAL PROPERTY ARCHITECTURE AND LICENSING',
  'IV. ANTI-AI PROTECTION AND DATA MINING PROHIBITION',
  'V. PAYMENT, RETRACTION AND REFUND POLICY',
  'VI. ETHICAL LIMITATIONS, INTERACTION AND EXPULSION',
  'VII. DIGITAL SOVEREIGNTY AND PRIVACY',
  'VIII. APPLICABLE LAW AND JURISDICTION',
];

const NEW_HEADINGS_ES = [
  'IX. HABEAS SCRIPTUM: PACTO DE CESIÓN Y DELIMITACIÓN DE AUTORÍA',
  'X. TÉRMINOS Y CONDICIONES DE AUDITORÍA',
  'XI. DECLARACIÓN DE SIMBIOSIS ALGORÍTMICA (TRANSPARENCIA RADICAL)',
];

const NEW_HEADINGS_EN = [
  'IX. HABEAS SCRIPTUM: PACT OF AUTHORSHIP ASSIGNMENT AND DELIMITATION',
  'X. AUDIT TERMS AND CONDITIONS',
  'XI. DECLARATION OF ALGORITHMIC SYMBIOSIS (RADICAL TRANSPARENCY)',
];

const STANDALONE_JSON_FILES = [
  'pacto.habeas-scriptum.es.json',
  'pacto.habeas-scriptum.en.json',
  'pacto.terminos-auditoria.es.json',
  'pacto.terminos-auditoria.en.json',
  'pacto.simbiosis-algoritmica.es.json',
  'pacto.simbiosis-algoritmica.en.json',
];

const ASTRO_PAGES = [
  'src/pages/terminos/habeas-scriptum.astro',
  'src/pages/terminos/auditoria.astro',
  'src/pages/terminos/simbiosis-algoritmica.astro',
  'src/pages/en/terms/habeas-scriptum.astro',
  'src/pages/en/terms/auditoria.astro',
  'src/pages/en/terms/simbiosis-algoritmica.astro',
];

describe('T04 — Pacto lectura 11 secciones + 3 sub-páginas', () => {
  describe('pacto.es.json: 11 secciones en orden', () => {
    let pacto: { sections?: Array<{ heading?: string; body?: string }> };
    beforeAll(() => {
      pacto = JSON.parse(
        readFileSync(repoPath('src/content/_data/pacto.es.json'), 'utf8'),
      );
    });

    it('carga y tiene exactamente 11 secciones', () => {
      expect(Array.isArray(pacto.sections)).toBe(true);
      expect(pacto.sections?.length).toBe(11);
    });

    it.each(ORIGINAL_HEADINGS_ES)(
      'preserva la sección original: %s',
      (heading) => {
        const found = pacto.sections?.some((s) => s.heading === heading);
        expect(found, `falta heading original: ${heading}`).toBe(true);
      },
    );

    it.each(NEW_HEADINGS_ES)('incluye la nueva sección: %s', (heading) => {
      const found = pacto.sections?.some((s) => s.heading === heading);
      expect(found, `falta nueva sección: ${heading}`).toBe(true);
    });

    it('preserva el orden: I-VIII primero, IX-XI al final', () => {
      const headings = pacto.sections?.map((s) => s.heading) ?? [];
      expect(headings.slice(0, 8)).toEqual(ORIGINAL_HEADINGS_ES);
      expect(headings.slice(8)).toEqual(NEW_HEADINGS_ES);
    });
  });

  describe('pacto.en.json: 11 secciones en orden', () => {
    let pacto: { sections?: Array<{ heading?: string; body?: string }> };
    beforeAll(() => {
      pacto = JSON.parse(
        readFileSync(repoPath('src/content/_data/pacto.en.json'), 'utf8'),
      );
    });

    it('carga y tiene exactamente 11 secciones', () => {
      expect(Array.isArray(pacto.sections)).toBe(true);
      expect(pacto.sections?.length).toBe(11);
    });

    it.each(ORIGINAL_HEADINGS_EN)(
      'preserva la sección original: %s',
      (heading) => {
        const found = pacto.sections?.some((s) => s.heading === heading);
        expect(found, `falta heading original EN: ${heading}`).toBe(true);
      },
    );

    it.each(NEW_HEADINGS_EN)('incluye la nueva sección: %s', (heading) => {
      const found = pacto.sections?.some((s) => s.heading === heading);
      expect(found, `falta nueva sección EN: ${heading}`).toBe(true);
    });

    it('preserva el orden: I-VIII primero, IX-XI al final', () => {
      const headings = pacto.sections?.map((s) => s.heading) ?? [];
      expect(headings.slice(0, 8)).toEqual(ORIGINAL_HEADINGS_EN);
      expect(headings.slice(8)).toEqual(NEW_HEADINGS_EN);
    });
  });

  describe('standalone JSON files (3 ES + 3 EN)', () => {
    it.each(STANDALONE_JSON_FILES)(
      'existe: src/content/_data/%s',
      (file) => {
        expect(existsSync(repoPath(`src/content/_data/${file}`))).toBe(true);
      },
    );

    it.each(STANDALONE_JSON_FILES)(
      'tiene shape válido (title, updatedLabel, updatedValue, sections[heading+body]): src/content/_data/%s',
      (file) => {
        const data = JSON.parse(
          readFileSync(repoPath(`src/content/_data/${file}`), 'utf8'),
        );
        expect(typeof data.title).toBe('string');
        expect(data.title.length).toBeGreaterThan(0);
        expect(typeof data.updatedLabel).toBe('string');
        expect(typeof data.updatedValue).toBe('string');
        expect(data.updatedValue.length).toBeGreaterThan(0);
        expect(Array.isArray(data.sections)).toBe(true);
        expect(data.sections.length).toBeGreaterThan(0);
        for (const s of data.sections) {
          expect(typeof s.heading).toBe('string');
          expect(s.heading.length).toBeGreaterThan(0);
          expect(typeof s.body).toBe('string');
          expect(s.body.length).toBeGreaterThan(0);
        }
      },
    );

    it.each(
      STANDALONE_JSON_FILES.filter((f) => f.endsWith('.en.json')),
    )(
      'cada body empieza con marcador TODO legal: src/content/_data/%s',
      (file) => {
        const data = JSON.parse(
          readFileSync(repoPath(`src/content/_data/${file}`), 'utf8'),
        );
        for (const s of data.sections) {
          expect(s.body).toMatch(
            /\[EN: TODO legal review by Colombian attorney\]/,
          );
        }
      },
    );
  });

  describe('Astro pages (3 ES + 3 EN)', () => {
    it.each(ASTRO_PAGES)('existe: %s', (file) => {
      expect(existsSync(repoPath(file))).toBe(true);
    });
  });

  describe('SHA-256 invariant (merge gate)', () => {
    let fixture: {
      expected?: { sha256?: string };
      bodies?: string[];
    };

    beforeAll(() => {
      fixture = JSON.parse(
        readFileSync(
          repoPath('scripts/__fixtures__/pacto-canonical.json'),
          'utf8',
        ),
      );
    });

    it('el fixture declara 11 sections en su bloque expected', () => {
      const sectionsDeclared = JSON.parse(
        readFileSync(
          repoPath('scripts/__fixtures__/pacto-canonical.json'),
          'utf8',
        ),
      );
      // expected.sections debe ser 11 (o el fixture provee 11 bodies)
      expect(sectionsDeclared.bodies.length).toBe(11);
      expect(sectionsDeclared.expected.sections).toBe(11);
    });

    it('el SHA-256 del cuerpo del pacto.es.json coincide con el fixture', () => {
      const pacto = JSON.parse(
        readFileSync(repoPath('src/content/_data/pacto.es.json'), 'utf8'),
      );
      const joined = (pacto.sections ?? [])
        .map((s: { body?: string }) => lf(s.body ?? ''))
        .join('');
      const hash = sha256(joined);
      expect(hash).toBe(fixture.expected?.sha256);
    });

    it('el fixture es internamente consistente (bodies[] joined hash)', () => {
      const joined = (fixture.bodies ?? []).map(lf).join('');
      const hash = sha256(joined);
      expect(hash).toBe(fixture.expected?.sha256);
    });
  });
});