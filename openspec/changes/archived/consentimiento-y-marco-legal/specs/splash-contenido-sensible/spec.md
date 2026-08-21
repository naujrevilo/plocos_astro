# Spec: splash-contenido-sensible

## Purpose

Define a pre-cookie modal that gates the entire site on first visit. The splash warns visitors about sensitive content (philosophy, art, possibly controversial topics) and requires an explicit acknowledgement BEFORE the cookie banner appears and BEFORE any third-party request fires.

## Requirements

### REQ-splash-1: Render order — splash BEFORE cookie banner

The system SHALL mount the splash so it appears before the `astro-consent` banner on every first visit. Once the visitor acknowledges, the cookie banner SHALL appear on the next paint.

**Given** a first-time visitor loads any page
**When** the page renders
**Then** the splash SHALL be visible AND the cookie banner SHALL NOT be visible.

**Given** the visitor acknowledged the splash
**When** the next page load happens
**Then** the splash SHALL NOT appear AND the cookie banner SHALL appear (if no `astro-consent` value exists).

### REQ-splash-2: Exactly two buttons

The splash SHALL contain exactly two action buttons: (a) **"Confirmo que puedo continuar"** (positive, primary), (b) **"No quiero continuar"** (negative, secondary). The system MUST NOT add a third button, "x" close icon, or escape-key dismissal.

**Given** the splash renders
**When** the visitor inspects the controls
**Then** the system SHALL show exactly two `<button>` elements with the labels above (in the active locale).

### REQ-splash-3: Positive button — persist acknowledgement

Clicking "Confirmo que puedo continuar" SHALL set `localStorage["plocos-sensitive-content-acknowledged"] = "true"` and remove the splash from the DOM. The key SHALL persist indefinitely (no TTL).

**Given** the splash is visible
**When** the visitor clicks "Confirmo"
**Then** `localStorage["plocos-sensitive-content-acknowledged"]` SHALL equal `"true"` AND the splash SHALL be removed.

### REQ-splash-4: Negative button — exit the tab

Clicking "No quiero continuar" SHALL navigate to `about:blank`, effectively closing the experience. The system SHALL NOT redirect to an external site or display Plocos content.

**Given** the splash is visible
**When** the visitor clicks "No quiero continuar"
**Then** `window.location.href` SHALL be set to `about:blank`.

### REQ-splash-5: Cross-session persistence

Acknowledgement SHALL persist via `localStorage` (not `sessionStorage`). Closing and reopening the browser MUST NOT re-show the splash.

**Given** `plocos-sensitive-content-acknowledged === "true"` in localStorage
**When** the visitor opens a new browser session
**Then** the splash SHALL NOT render.

### REQ-splash-6: No built-in reset

The system SHALL provide no built-in UI to reset the acknowledgement (intentional friction). Manual reset MAY be done by clearing the key from localStorage (documented in REQ-cookies-5).

**Given** `plocos-sensitive-content-acknowledged === "true"`
**When** no reset action is taken
**Then** the splash SHALL NOT re-appear on any subsequent visit.

### REQ-splash-7: Accessibility

The splash SHALL be `role="dialog"` with `aria-modal="true"`, `aria-labelledby` pointing to the title, and `aria-describedby` pointing to the body. Focus SHALL be trapped inside the dialog. Escape SHALL NOT dismiss (explicit choice required per REQ-splash-2).

**Given** the splash renders
**When** a screen reader announces the page
**Then** the dialog role, title, and body SHALL be announced as a single modal.

**Given** the visitor presses Tab repeatedly
**When** focus cycles
**Then** focus SHALL remain inside the dialog and SHALL NOT reach content behind it.

### REQ-splash-8: No third-party requests while visible

While mounted, the system MUST NOT trigger any third-party request: no analytics, no fonts, no API calls. The GA4 script MUST NOT be injected (see `consentimiento-cookies` REQ-consent-3/4). Splash text SHALL use system fonts only.

**Given** the splash is visible
**When** the browser network panel is inspected
**Then** no third-party domain request SHALL fire.

### REQ-splash-9: i18n-driven labels

The button labels, title, and body SHALL come from `getTranslations(locale).splash.*`. Both `es` and `en` translations SHALL define the keys.

**Given** the active locale is `en`
**When** the splash renders
**Then** the buttons SHALL display the English labels (NOT the Spanish ones).

### REQ-splash-10: Reversibility

Removing the splash component import from `BaseLayout.astro` SHALL restore the previous behaviour (no splash, cookie banner shows on first visit). No other file changes SHALL be required.

**Given** `BaseLayout.astro` does not import the splash
**When** the page renders
**Then** no splash SHALL appear, regardless of localStorage state.
