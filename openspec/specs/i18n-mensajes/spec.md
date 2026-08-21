---
status: active
archived_from: consentimiento-y-marco-legal
date_archived: 2026-08-20
---

# Spec: i18n-mensajes

## Purpose

Define the externally observable contract of the i18n module (`src/lib/i18n.ts`) for the new legal-and-consent content. This is the single source of truth that the pacto, privacy, cookie policy, splash, and consent banner consume. The spec covers the shape of new translation sections and the parity rules that guarantee the `en` and `es` bundles stay in sync.

## Requirements

### REQ-i18n-1: New translation sections

The `Translation` interface SHALL add the following top-level sections, each populated for `es` and `en`:

| Section | Used by |
|---|---|
| `privacy` | `/privacy`, `/en/privacy` page |
| `cookiePolicy` | `/cookie-policy`, `/en/cookie-policy` page |
| `splash` | sensitive-content modal in `BaseLayout` |
| `consent` | cookie banner labels |
| `footer.manageCookies` | footer link to re-open consent |

**Given** the i18n module is imported
**When** TypeScript checks the `Translation` type
**Then** the new sections SHALL be declared and both `es` and `en` SHALL provide matching keys.

### REQ-i18n-2: Parity enforced at compile time

Because both `es` and `en` are typed as `Translation`, a missing key in either locale SHALL fail `astro check` and the build.

**Given** the `es` bundle defines `privacy.metaTitle`
**When** the `en` bundle omits `privacy.metaTitle`
**Then** `npm run check:pages` (and the build) SHALL fail with a type error.

### REQ-i18n-3: fallback semantics preserved

The `getTranslations(locale)` function SHALL keep the existing fallback semantics: when the requested locale is not `es` or `en`, return `es` (default). When the requested locale IS `en` but a key is missing inside the `en` bundle, TypeScript SHALL prevent the gap; runtime fallback SHALL NOT be required (the type system enforces completeness).

**Given** an unknown locale is passed (e.g., `"pt"`)
**When** `getTranslations("pt")` is called
**Then** the function SHALL return the Spanish bundle.

### REQ-i18n-4: Legal terminology preserved

For legal terms that are normatively Colombian, the system SHALL preserve the original Spanish term in the `en` bundle with a clarifying parenthetical:

- "ARCO rights (Access, Rectification, Cancellation, Opposition)" — never "GDPR rights".
- "Ley 1581/2012" — never "GDPR" or "LOPD".
- "SIC" — kept as acronym with first-mention explanation.

**Given** the English bundle is read
**When** it mentions Colombian law
**Then** it SHALL reference Ley 1581/2012 and SHALL NOT substitute a non-Colombian law.

### REQ-i18n-5: Stable keys for legal documents

The translation keys for legal documents (`privacy`, `cookiePolicy`, `pacto`, `splash`, `consent`) SHALL NOT be renamed without a coordinated migration: every consumer page/component MUST be updated in the same change. A naming convention note SHALL appear in the design-phase doc.

**Given** a key like `privacy.contactEmail` is in use
**When** the key is renamed
**Then** every page and component that reads it SHALL be updated in the same change. Stale references SHALL fail `astro check`.

### REQ-i18n-6: Section-array shape for pacto and cookie policy

The `terms.sections`, `privacy.sections`, and `cookiePolicy.categories[].cookies` arrays SHALL follow a documented shape so the corresponding `.astro` pages can render uniformly:

- `terms.sections[]` and `privacy.sections[]`: `{ heading: string; body: string; bullets?: string[] }`.
- `cookiePolicy.categories[]`: `{ heading: string; description: string; cookies: { name: string; provider: string; purpose: string; duration: string; party: "first" | "third" }[] }[]`.

**Given** a translation bundle conforms to the shape above
**When** the legal pages render
**Then** the templates SHALL render headings, bodies, bullets, and cookie rows without runtime guards for missing fields.

### REQ-i18n-7: No new top-level keys without design review

Adding a new top-level section to the `Translation` interface (beyond the five listed in REQ-i18n-1) SHALL require a design-phase decision documented in `openspec/changes/<change>/design.md`. This prevents silent drift of the i18n contract.

**Given** a developer adds a new section (e.g., `newsletter`)
**When** they commit
**Then** the PR SHALL reference a design doc that justifies the addition.
