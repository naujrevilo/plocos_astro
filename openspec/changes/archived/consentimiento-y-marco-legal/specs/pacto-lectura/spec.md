# Spec: pacto-lectura

## Purpose

Define the "PACTO DE LECTURA" (terms-of-use document) that replaces the generic terms text on `/terminos` and `/en/terms`. The pacto is the client's mandated, normative 11-section contract governing editorial use of the Plocos archive under Colombian jurisdiction (no GDPR/LOPD).

## Requirements

### REQ-pacto-1: Bilingual canonical pages

The system SHALL publish two static pages: `/terminos` (Spanish, primary) and `/en/terms` (English, fallback mirror). Both pages SHALL render under `BaseLayout` with the legal-document `metaTitle`/`metaDescription` from `getTranslations(locale).terms.*`.

**Given** a visitor navigates to `/terminos`
**When** the page renders
**Then** the page SHALL return HTTP 200 with Spanish terms text and meta tags from `terms.metaTitle`/`terms.metaDescription`.

**Given** a visitor navigates to `/en/terms`
**When** the page renders
**Then** the page SHALL return HTTP 200 with English terms text and meta tags from the `en` translation.

### REQ-pacto-2: Eleven normative sections

The system SHALL render exactly 11 sections on the pacto page (replacing the current 6). The system MUST keep the page layout (one `<h2>` per section, optional bullets) compatible with the existing `terminos/index.astro` template.

**Given** the terms translation defines `sections` as an 11-element array
**When** the page renders
**Then** the system SHALL emit 11 `<section aria-labelledby="terms-<slug>">` blocks in document order.

### REQ-pacto-3: Mandated topic coverage

The 11 sections SHALL collectively cover, in any order, the following mandated topics from the client's normative text:
1. Naturaleza y propósito editorial del archivo.
2. Contenido sensible — advertencia sobre temas filosóficos, artísticos o polémicos.
3. Edad mínima y responsabilidad del visitante.
4. Suscripción y comunicaciones.
5. Protección anti-IA — uso prohibido para entrenamiento de modelos.
6. Propiedad intelectual y derechos de autor.
7. Usos expresamente prohibidos (lista no exhaustiva).
8. Contribuciones, comentarios y moderación editorial.
9. Privacidad y datos personales (resumen; el detalle vive en `/privacy`).
10. Limitación de responsabilidad del editor.
11. Ley aplicable y jurisdicción (Colombia).

**Given** any visitor reads the pacto
**When** they scan the section headings
**Then** every mandated topic SHALL appear at least once.

### REQ-pacto-4: Section anchors

The system SHALL generate stable `id` attributes on each `<h2>` using a deterministic slug from the heading text (lowercase, ASCII, hyphenated), enabling deep linking and screen-reader navigation.

**Given** a section heading like "Protección anti-IA"
**When** rendered
**Then** the corresponding `<h2 id="terms-proteccion-anti-ia">` SHALL exist and SHALL be reachable via `#terms-proteccion-anti-ia`.

### REQ-pacto-5: Update notice + contact CTA

The page SHALL display a "Última actualización" line and a contact-link CTA at the bottom, both sourced from `getTranslations(locale).terms.*`. The CTA SHALL link to the locale-correct contact page (`createLocaleHref`).

**Given** the pacto page is rendered
**When** the visitor scrolls to the footer of the article
**Then** a contact CTA SHALL be visible and SHALL navigate to `/contacto` (es) or `/en/contact` (en).

### REQ-pacto-6: Bilingual parity + sync checklist

The system SHALL publish `es` and `en` versions simultaneously. The `Translation` type MUST enforce key parity at compile time.

**Given** the `terms` translation has a key in `es`
**When** the build runs `astro check`
**Then** the `en` translation SHALL fail the build if the same key is missing.

The project SHALL keep a manual sync checklist (in the design phase doc) covering: heading equivalence, bullet-by-bullet translation, legal-accurate terminology, and date stamps. Mismatches SHALL block release.

### REQ-pacto-7: Static, no client JS

The pacto page SHALL be Astro static (no runtime JS for the document itself). The only JS that may execute is shared infrastructure (theme detection, header/footer).

**Given** JavaScript is disabled in the browser
**When** the visitor opens `/terminos`
**Then** the entire pacto text SHALL remain fully readable.

### REQ-pacto-8: Reversibility

The system SHALL make pacto content revertible by replacing `terms.sections` in `src/lib/i18n.ts`. The page template MUST NOT hardcode any section text or heading.

**Given** `terms.sections` is restored to the original 6-section array
**When** the build runs
**Then** the pacto page SHALL render exactly the original 6 sections without further code changes.
