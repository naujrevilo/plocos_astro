# Spec: consentimiento-cookies

## Purpose

Define the behaviour of the cookie consent system and the consent-driven gating of Google Analytics 4. Migrates the existing `astroConsent()` integration from hardcoded Spanish labels to i18n-driven labels, and ensures GA4 only loads after the visitor explicitly grants `analytics` consent.

## Requirements

### REQ-consent-1: i18n-driven banner labels

The cookie banner SHALL display labels sourced from `getTranslations(locale).consent.*`. The keys SHALL include: `headline`, `description`, `acceptLabel`, `rejectLabel`, `manageLabel`, `categories.analytics`, `categories.essential`. The system MUST NOT keep hardcoded English/Spanish literals inside `astro.config.mjs`.

**Given** the active locale is `en`
**When** the banner renders
**Then** the labels SHALL come from the `en` translation.

**Given** the active locale is `es`
**When** the banner renders
**Then** the labels SHALL come from the `es` translation.

### REQ-consent-2: First-visit-only display

The banner SHALL appear only when no valid consent record exists in `localStorage["astro-consent"]` (per `astroConsent({ consent: { days: 30, storageKey: "astro-consent" } })`). After consent is given or rejected, the banner SHALL NOT re-appear for 30 days.

**Given** `localStorage["astro-consent"]` is missing or expired
**When** any page renders
**Then** the banner SHALL appear.

**Given** a valid consent record exists in localStorage
**When** the visitor loads a page
**Then** the banner SHALL NOT appear.

### REQ-consent-3: GA4 loads ONLY after analytics consent

The Google Analytics 4 script (`<GoogleAnalytics id={ANALYTICS_ID} />`) SHALL only be injected when `window.astroConsent.get()?.categories?.analytics === true`. The injection SHALL happen client-side (after consent is granted), not server-side.

**Given** the visitor clicks "Accept all" (granting analytics)
**When** the next paint occurs
**Then** the GA4 script tag SHALL be present in the DOM.

**Given** the visitor clicks "Reject all" or has not consented
**When** any page renders
**Then** the GA4 script tag SHALL NOT be present in the DOM.

### REQ-consent-4: GA4 absent on first paint (no consent yet)

`BaseLayout.astro` SHALL NOT emit `<GoogleAnalytics>` on the server when no consent exists. The component SHALL be replaced by a client-side gating script that waits for `window.astroConsent.get()` before deciding.

**Given** a first-time visitor (no localStorage record)
**When** the initial HTML is served
**Then** no GA-related script tag SHALL be in the HTML.

### REQ-consent-5: Consent revocation re-shows banner

When the visitor clears `localStorage["astro-consent"]` or its record expires, the banner SHALL re-appear on the next page load.

**Given** `localStorage["astro-consent"]` is removed via the browser dev tools
**When** the visitor reloads the page
**Then** the banner SHALL appear.

### REQ-consent-6: Footer "Manage cookies" link

The footer SHALL include a "Gestionar cookies" / "Manage cookies" link (locale-correct label from `footer.manageCookies`) that, when clicked, calls `window.astroConsent.openPreferences()` (or the equivalent astro-consent API to re-open the modal) so the visitor can change their mind.

**Given** the visitor wants to revoke analytics
**When** they click the footer link
**Then** the consent modal SHALL re-open.

### REQ-consent-7: Categories

The system SHALL treat consent as two categories: `essential` (always granted, no UI toggle) and `analytics` (user toggleable). The system MAY add a `marketing` category in the future; for now, no marketing cookies exist.

**Given** the consent modal opens
**When** the visitor inspects the toggles
**Then** at minimum `analytics` SHALL be user-toggleable and `essential` SHALL be locked on.

### REQ-consent-8: Reversibility

Removing the i18n-driven labels and re-introducing hardcoded literals in `astro.config.mjs` SHALL restore the original behaviour. Removing the GA gating script SHALL restore the unconditional `<GoogleAnalytics>` component.

**Given** all changes are reverted
**When** the build runs
**Then** the original hardcoded banner SHALL re-appear and GA SHALL load unconditionally.
