---
status: active
archived_from: consentimiento-y-marco-legal
date_archived: 2026-08-20
---

# Spec: politica-cookies

## Purpose

Define the cookie policy published at `/cookie-policy` and `/en/cookie-policy`. The policy MUST list every cookie and similar tracker the site uses, grouped by category, compliant with Decreto 1377/2013 and Ley 1581/2012 consent requirements.

## Requirements

### REQ-cookies-1: Bilingual canonical pages

The system SHALL publish `/cookie-policy` (es) and `/en/cookie-policy` (en). Both pages SHALL use `BaseLayout` with meta tags from `getTranslations(locale).cookiePolicy.*`.

**Given** a visitor opens `/cookie-policy`
**When** the page renders
**Then** the system SHALL return HTTP 200 with the Spanish cookie policy.

### REQ-cookies-2: Categorized cookie inventory

The policy SHALL list cookies in exactly four categories:

| Category | Purpose | Examples |
|---|---|---|
| Necesarias | Funcionamiento del sitio (sesión, idioma, preferencias de tema, consentimiento) | `astro-consent`, `plocos-theme` |
| Analítica | Medición anonimizada de uso | Google Analytics 4 cookies (`_ga`, `_ga_*`) |
| Búsqueda | Búsqueda en el sitio vía Algolia | Algolia `aind`, `_algolia_*` |
| Protección anti-IA | Sin cookies — directiva informativa | (none — see REQ-cookies-4) |

**Given** a visitor reads the cookie inventory
**When** they reach any category
**Then** the policy SHALL list cookies by name, provider, purpose, persistence (duration), and party type (first vs third).

### REQ-cookies-3: Algolia cookies conditional disclosure

The policy SHALL list Algolia search cookies because `src/components/Search.vue` initializes `algoliasearch/lite` with `PUBLIC_ALGOLIA_*` env vars. If the build later removes Algolia, the policy MAY be updated to omit the category.

**Given** Algolia is configured
**When** the policy renders
**Then** the "Búsqueda" category SHALL appear with at least one Algolia cookie entry.

### REQ-cookies-4: Anti-IA is not a cookie

The "Protección anti-IA" category SHALL be informational only: it MUST state that anti-scraping is implemented via `robots.txt` and meta `noai` directives, not cookies. The category exists to make the absence of cookies auditable.

**Given** a visitor reads the anti-IA category
**When** they finish
**Then** the policy SHALL explain that no cookies are involved and SHALL link to `/terminos` for the normative anti-IA clause.

### REQ-cookies-5: Revocation procedure

The policy SHALL explain how to revoke consent: (a) re-open the cookie banner via the "Gestionar cookies" link in the footer, (b) delete `astro-consent` from localStorage, (c) use the browser's site-data controls.

**Given** a visitor wants to revoke analytics consent
**When** they read the revocation section
**Then** the policy SHALL name at least one concrete path (footer link or localStorage key) that the user can act on.

### REQ-cookies-6: Update notice

The page SHALL display a "Última actualización" line sourced from `cookiePolicy.updatedLabel`/`updatedValue`.

**Given** any visitor opens the cookie policy
**When** they scroll past the title
**Then** an update notice SHALL be visible.

### REQ-cookies-7: Bilingual parity

Per REQ-pacto-6, the `cookiePolicy` translation MUST have matching keys in `es` and `en`. Algolia-specific terminology (e.g., `_algolia_*`) MUST be preserved as-is in both languages.

**Given** the Spanish version lists `aind`
**When** the English version is read
**Then** the cookie name `aind` SHALL appear identically.

### REQ-cookies-8: Static, no client JS

The cookie policy page SHALL be static (no runtime JS for the document).

**Given** JS is disabled
**When** the visitor opens `/cookie-policy`
**Then** the entire policy SHALL remain readable.

### REQ-cookies-9: Reversibility

Removing or renaming the `/cookie-policy` and `/en/cookie-policy` routes SHALL be a single-file change; the `astroConsent` integration SHALL NOT depend on the existence of these routes (it links to them; if missing, the link SHALL 404 visibly, not crash the banner).
