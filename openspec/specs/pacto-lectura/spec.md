---
status: active
archived_from: pacto-cliente-y-autonomia-contenido
date_archived: 2026-09-05
---

# Spec: pacto-lectura

## Purpose

Define the "PACTO DE LECTURA" (terms-of-use document) that replaces the generic terms text on `/terminos` and `/en/terms`. The pacto is the client's mandated, normative 8-section contract governing editorial use of the Plocos archive under Colombian jurisdiction (no GDPR/LOPD). The Spanish body is a byte-for-byte copy of the client's text dated 2 de septiembre de 2026.

## Requirements

### REQ-pacto-1: Bilingual canonical pages

The system SHALL publish two static pages: `/terminos` (Spanish, primary) and `/en/terms` (English, fallback mirror). Both pages SHALL render under `BaseLayout` with the legal-document `metaTitle`/`metaDescription` from `getTranslations(locale).terms.*`.

**Given** a visitor navigates to `/terminos`
**When** the page renders
**Then** the page SHALL return HTTP 200 with Spanish terms text and meta tags from `terms.metaTitle`/`terms.metaDescription`.

**Given** a visitor navigates to `/en/terms`
**When** the page renders
**Then** the page SHALL return HTTP 200 with English terms text and meta tags from the `en` translation.

### REQ-pacto-2: Eight normative sections

The system SHALL render exactly 8 sections on the pacto page (replacing 11), in document order I–VIII with verbatim Roman-numeral headings and bodies sourced from observation #99 of Engram topic `sdd/pacto-cliente-y-autonomia-contenido/text`. The system MUST keep the page layout (one `<h2>` per section, optional bullets) compatible with the existing `terminos/index.astro` template.

**Given** `sections` is an 8-element array ordered I→VIII
**When** the page renders
**Then** 8 `<section aria-labelledby="terms-<slug>">` blocks SHALL be emitted in document order, each anchored to its Roman-numeral heading.

### REQ-pacto-3: Mandated topic coverage

The 8 sections SHALL cover, in order: I. Pacto cognitivo (manifiesto editorial, taxonomía del contenido, frontera analítica). II. Naturaleza transaccional y capacidad jurídica (ánimo de lucro directo, mayoría de edad 18, acceso de menores bajo responsabilidad del tutor). III. Propiedad intelectual y licenciamiento (Ley 23/1982, Decisión Andina 486, Convenio de Berna, licencia de consumo, cláusula de obras en desarrollo, prohibición de obras derivadas). IV. Protección anti-IA y prohibición de minería de datos. V. Pagos, retracto y reembolsos (Ley 1480/2011). VI. Limitaciones éticas, interacción y expulsión. VII. Soberanía digital y privacidad (Ley 1581/2012, derechos ARCO). VIII. Ley aplicable y jurisdicción (Cartagena de Indias, Distrito Turístico y Cultural).

**Given** any visitor reads the pacto
**When** they scan the section headings
**Then** every mandated topic SHALL appear at least once, in order I→VIII.

### REQ-pacto-4: Section anchors

The system SHALL generate stable `id` attributes on each `<h2>` using a deterministic slug from the heading text (lowercase, ASCII, hyphenated), enabling deep linking and screen-reader navigation.

**Given** a section heading like "PROTECCIÓN ANTI-IA Y PROHIBICIÓN DE MINERÍA DE DATOS"
**When** rendered
**Then** the corresponding `<h2 id="terms-proteccion-anti-ia-y-prohibicion-de-mineria-de-datos">` SHALL exist and SHALL be reachable via `#terms-proteccion-anti-ia-y-prohibicion-de-mineria-de-datos`.

### REQ-pacto-5: Update notice + contact CTA

The page SHALL display "Última actualización: 2 de septiembre de 2026" (es) / "Last updated: September 2, 2026" (en) and a contact-link CTA at the bottom, both sourced from `getTranslations(locale).terms.*`. The CTA SHALL link to the locale-correct contact page (`createLocaleHref`).

**Given** the pacto page renders
**When** the visitor scrolls to the footer of the article
**Then** the "2 de septiembre de 2026" update line SHALL be visible AND a contact CTA SHALL navigate to `/contacto` (es) or `/en/contact` (en).

### REQ-pacto-6: Bilingual parity + sync checklist

The system SHALL publish `es` and `en` versions simultaneously. The `Translation` type MUST enforce key parity at compile time.

**Given** the `terms` translation has a key in `es`
**When** the build runs `astro check`
**Then** the `en` translation SHALL fail the build if the same key is missing.

The project SHALL keep a manual sync checklist covering: heading equivalence, bullet-by-bullet translation, legal-accurate terminology, and date stamps. Mismatches SHALL block release.

### REQ-pacto-7: Static, no client JS

The pacto page SHALL be Astro static (no runtime JS for the document itself). The only JS that may execute is shared infrastructure (theme detection, header/footer).

**Given** JavaScript is disabled in the browser
**When** the visitor opens `/terminos`
**Then** the entire pacto text SHALL remain fully readable.

### REQ-pacto-8: Reversibility

The system SHALL make pacto content revertible by replacing `src/content/_data/pacto.es.json` and `pacto.en.json`. The page template MUST NOT hardcode any section text or heading.

**Given** `pacto.es.json` is restored to a 6-section array
**When** the build runs
**Then** the pacto page SHALL render exactly 6 sections without further code changes.

### REQ-pacto-9: Verbatim body preservation (byte-level)

`getTranslations('es').terms.sections[].body` SHALL be a byte-for-byte copy of the corresponding section in Engram observation #99. NO mutation, NO reordering, NO Markdown autolink escaping. Em-dashes, accented characters, smart quotes, Roman numerals (I–VIII), and inner sub-items (1/2/3 in §I; "Licencia de consumo…", "Cláusula de obras en desarrollo…", "Prohibición de obras derivadas…" in §III) MUST be preserved as-is. The body lives in `src/content/_data/pacto.es.json` (not inline in i18n.ts) so it can be edited by future CMS integrations without breaking the byte-level contract.

**Given** `src/lib/i18n.ts` after PR1 of `pacto-cliente-y-autonomia-contenido`
**When** concatenated `body` values are SHA-256 hashed (LF-normalized)
**Then** the hash SHALL equal `46fa23bf049dc7e55205adf8e638ebd530fc12f0afe4c12fe26b8a32bc0774b7` (verified at archive time).

### REQ-pacto-10: English body with TODO markers

`getTranslations('en').terms.sections[]` SHALL hold exactly 8 entries in `src/content/_data/pacto.en.json`. Each `body` MUST begin with the literal marker `[EN: TODO legal review by Colombian attorney]` followed by a space and the translated text.

**Given** PR2 ships
**When** `terms.sections[i].body` is read for any i ∈ [0..7]
**Then** the string SHALL start with `[EN: TODO legal review by Colombian attorney]`.

### REQ-pacto-11: New clauses (lucro, anti-IA, obras en desarrollo, jurisdiction)

| Section | Mandated content |
|---|---|
| II | "ánimo de lucro directo" (suscripciones, libro virtual interactivo, membresías); "mayoría de edad legal (18 años)". MUST NOT retain "sin ánimo de lucro" or age 15. |
| III | "Cláusula de obras en desarrollo" paragraph mentioning "secreto profesional" and "cobro de perjuicios". |
| IV | Independent section (NOT merged into III). Mentions scraping, fine-tuning, evaluation, dataset construction, public/private entities, "contramedidas técnicas", "perseguirá civilmente". |
| VIII | Cites Ley 23/1982, Decisión Andina 486, Convenio de Berna, Ley 1480/2011. Jurisdiction = Cartagena de Indias, Distrito Turístico y Cultural. |

**Given** the pacto page renders after PR1
**When** sections II, III, IV, VIII are inspected
**Then** every cell of this table SHALL be true.

### REQ-pacto-15: Preserve 14 existing EN markers

The 14 pre-existing `[EN: TODO legal review by Colombian attorney]` markers across the site (9 in legacy `en.terms` bodies preserved in `PRESERVED_LEGACY_EN_PACTO_MARKERS` constant + 5 in `en.privacy`) SHALL remain untouched. PR2 of this change only ADDS 8 new markers inside the new pacto's en body.

**Given** PR1 merges
**When** `grep -r "\[EN: TODO legal review" src/` runs
**Then** at least 22 matches SHALL appear (14 pre-existing + 8 new in `pacto.en.json`).
