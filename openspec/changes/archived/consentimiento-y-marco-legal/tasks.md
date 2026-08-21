# Tasks: consentimiento-y-marco-legal

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1450 (additions + deletions across 7 capabilities, 2 new dirs, 8 new files) |
| 400-line budget risk | High — 5 of 6 proposed PRs sit in the 300-400 range; full single PR would be ~1450 lines |
| Chained PRs recommended | Yes |
| Suggested split | PR1 i18n+pacto → PR2 es legal pages → PR3 en legal pages → PR4 anti-IA → PR5 splash+banner+GA → PR6 verify+archive |
| Delivery strategy | force-chained (treat as auto-chain: chain when needed) |
| Chain strategy | pending (orchestrator gate) |
| Decision needed before apply | Yes (chain strategy selection: stacked-to-main vs feature-branch-chain) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Work Unit 0: pacto section alignment (BLOCKER)

### Task 0.1: Align pacto §6-§11 with REQ-pacto-3 mandated topics
- **Capability**: pacto-lectura (NEW)
- **Spec REQs**: REQ-pacto-2, REQ-pacto-3
- **Files**: (no edits yet — clarification only)
- **Depends on**: none
- **Estimated changed lines**: 0 (planning)
- **Commit shape**: none (blocker; no commit until resolved)
- **Rollback**: N/A
- **Acceptance**:
  - [ ] User confirms the 11 headings chosen for `es.terms.sections` cover all 11 mandated topics in REQ-pacto-3 (or accepts drift to "Revocación" replacing one mandated topic)
  - [ ] User confirms whether "Revocación de consentimiento" replaces or augments "Usos expresamente prohibidos" / "Privacidad y datos"
  - [ ] Decision recorded in design §3 Capability 1 before Task 1.2 begins

## Work Unit 1: i18n foundation + pacto sections

### Task 1.1: Extend `Translation` interface with new sections
- **Capability**: i18n-mensajes (MODIFIED)
- **Spec REQs**: REQ-i18n-1, REQ-i18n-2, REQ-i18n-6, REQ-i18n-7
- **Files**: `src/lib/i18n.ts` (modify interface + `paths` entries)
- **Depends on**: none
- **Estimated changed lines**: ~25 (interface) + ~4 (`paths.privacy`, `paths.cookiePolicy`)
- **Commit shape**: chore(i18n): extend Translation with privacy, cookiePolicy, splash, consent, footer.manageCookies
- **Rollback**: revert single commit; downstream pages/components fail `astro check`, no silent runtime breakage
- **Acceptance**:
  - [ ] `Translation` interface declares `privacy`, `cookiePolicy`, `splash`, `consent`, and `footer.manageCookies`
  - [ ] `paths` interface gains `privacy` and `cookiePolicy` for both es/en
  - [ ] `paths.cookiePolicy` differs per locale: `cookie-policy` (es) / `cookie-policy` (en — same slug allowed; Astro i18n routes by dir not slug)
  - [ ] `pnpm check:pages` fails with a type error (expected — bundles not yet populated)

### Task 1.2: Populate `es` bundle with new sections (privacy, cookiePolicy, splash, consent, footer.manageCookies)
- **Capability**: i18n-mensajes (MODIFIED), politica-privacidad (NEW), politica-cookies (NEW), splash-contenido-sensible (NEW), consentimiento-cookies (MODIFIED)
- **Spec REQs**: REQ-i18n-2, REQ-privacy-2/3/4/5/6/7/8/9, REQ-cookies-2/3/4/5/6, REQ-splash-9, REQ-consent-1, REQ-consent-7
- **Files**: `src/lib/i18n.ts` (modify es bundle)
- **Depends on**: Task 1.1, Task 0.1
- **Estimated changed lines**: ~220 (es content only — privacy, cookiePolicy, splash, consent, footer.manageCookies; en bundle stays partial and `astro check` still fails)
- **Commit shape**: feat(i18n): add es translations for privacy, cookie policy, splash, consent
- **Rollback**: revert single commit; en bundle intentionally incomplete is no worse than before
- **Acceptance**:
  - [ ] `es.privacy.{metaTitle,metaDescription,title,sections[],contactEmail,responseTimelines,retention[],arcoProcedure[]}` populated
  - [ ] `es.cookiePolicy.{metaTitle,metaDescription,title,intro,updatedLabel,updatedValue,categories[],revocation[]}` populated with 4 categories (Necesarias, Analítica, Búsqueda, Protección anti-IA)
  - [ ] `es.splash.{title,body,acknowledge,reject}` populated
  - [ ] `es.consent.{headline,description,acceptLabel,rejectLabel,manageLabel,preferencesTitle,saveLabel,cookiePolicyLink,privacyPolicyLink,categories.{essential,analytics}}` populated
  - [ ] `es.footer.manageCookies = "Gestionar cookies"`
  - [ ] Email `expresatura@plocos.com` literal in `privacy.contactEmail`

### Task 1.3: Populate `en` bundle (parity with `es`)
- **Capability**: i18n-mensajes (MODIFIED)
- **Spec REQs**: REQ-i18n-2, REQ-i18n-4, REQ-pacto-6, REQ-privacy-10, REQ-cookies-7
- **Files**: `src/lib/i18n.ts` (modify en bundle)
- **Depends on**: Task 1.2
- **Estimated changed lines**: ~220 (mirror of 1.2 for en)
- **Commit shape**: feat(i18n): add en translations for privacy, cookie policy, splash, consent
- **Rollback**: revert single commit; types fail `astro check`, not silent
- **Acceptance**:
  - [ ] en bundle mirrors all es keys shape-for-shape
  - [ ] `ARCO rights (Access, Rectification, Cancellation, Opposition)` parenthetical present (REQ-i18n-4)
  - [ ] `Ley 1581/2012` preserved verbatim (REQ-i18n-4)
  - [ ] Algolia cookie names (`aind`, `_algolia_*`) preserved untranslated (REQ-cookies-7)
  - [ ] `pnpm check:pages` passes

### Task 1.4: Extend `es.terms.sections` and `en.terms.sections` to 11 entries
- **Capability**: pacto-lectura (NEW)
- **Spec REQs**: REQ-pacto-2, REQ-pacto-3, REQ-pacto-4, REQ-pacto-6
- **Files**: `src/lib/i18n.ts` (modify terms.sections in both bundles)
- **Depends on**: Task 0.1
- **Estimated changed lines**: ~110 (6 new sections × 2 bundles, ~9 lines avg per section object)
- **Commit shape**: feat(terminos): expand pacto sections from 6 to 11 per REQ-pacto-3
- **Rollback**: revert single commit; original 6 sections restored without page template changes
- **Acceptance**:
  - [ ] `es.terms.sections.length === 11` and `en.terms.sections.length === 11`
  - [ ] All 11 mandated topics from REQ-pacto-3 present in es bundle
  - [ ] `id="terms-<slug>"` attributes deterministic via existing `toSectionId` helper (REQ-pacto-4)
  - [ ] `pnpm check:pages` passes

## Work Unit 2: legal pages (es)

### Task 2.1: Create `/privacy` (es)
- **Capability**: politica-privacidad (NEW)
- **Spec REQs**: REQ-privacy-1, REQ-privacy-2, REQ-privacy-11
- **Files**: `src/pages/privacy/index.astro` (create)
- **Depends on**: Task 1.3
- **Estimated changed lines**: ~80
- **Commit shape**: feat(privacy): create Spanish privacy policy page
- **Rollback**: delete single file; no shared state
- **Acceptance**:
  - [ ] Page renders 200, uses BaseLayout
  - [ ] Reads `es.privacy.*` (no fallback to en — REQ-privacy-1)
  - [ ] Meta tags from `privacy.metaTitle`/`metaDescription`
  - [ ] `pnpm check:pages` passes

### Task 2.2: Create `/cookie-policy` (es)
- **Capability**: politica-cookies (NEW)
- **Spec REQs**: REQ-cookies-1, REQ-cookies-2, REQ-cookies-3, REQ-cookies-6, REQ-cookies-8
- **Files**: `src/pages/cookie-policy/index.astro` (create)
- **Depends on**: Task 1.3
- **Estimated changed lines**: ~85
- **Commit shape**: feat(cookie-policy): create Spanish cookie policy page
- **Rollback**: delete single file; `astroConsent` config links may 404 but no crash (REQ-cookies-9)
- **Acceptance**:
  - [ ] Renders 4 categories from `es.cookiePolicy.categories[]`
  - [ ] Algolia category included (active integration — REQ-cookies-3)
  - [ ] "Última actualización" line from `updatedLabel`/`updatedValue`
  - [ ] `pnpm check:pages` passes

## Work Unit 3: legal pages (en)

### Task 3.1: Create `/en/privacy`
- **Capability**: politica-privacidad (NEW)
- **Spec REQs**: REQ-privacy-1, REQ-privacy-10, REQ-privacy-11
- **Files**: `src/pages/en/privacy/index.astro` (create)
- **Depends on**: Task 2.1
- **Estimated changed lines**: ~80
- **Commit shape**: feat(privacy): create English privacy policy page
- **Rollback**: delete single file; en→es fallback does NOT rewrite this route (physical file present)
- **Acceptance**:
  - [ ] Page renders 200, uses BaseLayout
  - [ ] Reads `en.privacy.*` (no fallback — REQ-privacy-1)
  - [ ] ARCO acronym spelled out at first mention
  - [ ] `pnpm check:pages` passes

### Task 3.2: Create `/en/cookie-policy`
- **Capability**: politica-cookies (NEW)
- **Spec REQs**: REQ-cookies-1, REQ-cookies-7, REQ-cookies-8
- **Files**: `src/pages/en/cookie-policy/index.astro` (create)
- **Depends on**: Task 2.2
- **Estimated changed lines**: ~85
- **Commit shape**: feat(cookie-policy): create English cookie policy page
- **Rollback**: delete single file
- **Acceptance**:
  - [ ] 4 categories from `en.cookiePolicy.categories[]`
  - [ ] Algolia cookie names untranslated (REQ-cookies-7)
  - [ ] `pnpm check:pages` passes

## Work Unit 4: anti-IA guards

### Task 4.1: Create `public/robots.txt` blocking 8 AI user-agents
- **Capability**: robots-anti-ia (NEW)
- **Spec REQs**: REQ-robots-1, REQ-robots-2, REQ-robots-3, REQ-robots-6
- **Files**: `public/robots.txt` (create)
- **Depends on**: none
- **Estimated changed lines**: ~30
- **Commit shape**: feat(robots): block 8 AI crawlers + allow legitimate search engines
- **Rollback**: delete single file; Astro stops serving it
- **Acceptance**:
  - [ ] 8 named user-agents (GPTBot, ClaudeBot, Claude-Web, CCBot, Google-Extended, anthropic-ai, PerplexityBot, Bytespider) each followed by `Disallow: /`
  - [ ] `User-agent: *` with `Allow: /` precedes the AI blocks
  - [ ] `Sitemap: https://plocos.netlify.app/sitemap-index.xml` present
  - [ ] Comment about hostname drift adjacent to `Sitemap:`

### Task 4.2: Add `<meta name="robots" content="noai, noimageai">` to BaseLayout
- **Capability**: robots-anti-ia (NEW)
- **Spec REQs**: REQ-robots-4, REQ-robots-5, REQ-robots-9
- **Files**: `src/layouts/BaseLayout.astro` (modify — one line)
- **Depends on**: Task 4.1
- **Estimated changed lines**: ~2
- **Commit shape**: feat(base): add noai meta tag to head
- **Rollback**: revert single line; meta tag removed from every page
- **Acceptance**:
  - [ ] Meta tag injected after `<meta name="theme-color">` and before `<script>` tags
  - [ ] Single occurrence per page
  - [ ] `pnpm build` completes without new warnings

## Work Unit 5: sensitive-content splash

### Task 5.1: Create `SensitiveContentWarning.astro` (vanilla `<dialog>` modal)
- **Capability**: splash-contenido-sensible (NEW)
- **Spec REQs**: REQ-splash-1, REQ-splash-2, REQ-splash-3, REQ-splash-4, REQ-splash-5, REQ-splash-6, REQ-splash-7, REQ-splash-8, REQ-splash-9
- **Files**: `src/components/SensitiveContentWarning.astro` (create)
- **Depends on**: Task 1.3
- **Estimated changed lines**: ~75
- **Commit shape**: feat(splash): add sensitive-content warning modal before cookie banner
- **Rollback**: delete single file; BaseLayout import removed separately
- **Acceptance**:
  - [ ] Exactly 2 buttons (`data-action="acknowledge"`, `data-action="exit"`)
  - [ ] Esc intercepted via `dialog.addEventListener("cancel", e => e.preventDefault())`
  - [ ] localStorage key `plocos-sensitive-content-acknowledged = "true"` on acknowledge
  - [ ] Negative button → `window.location.href = "about:blank"`
  - [ ] Locale labels from `splash.{title,body,acknowledge,reject}` via `getTranslations(locale)`
  - [ ] System fonts only (no third-party font loads while modal visible)

### Task 5.2: Import splash in BaseLayout (no other layout changes)
- **Capability**: splash-contenido-sensible (NEW), layout-base (MODIFIED)
- **Spec REQs**: REQ-splash-1, REQ-splash-10
- **Files**: `src/layouts/BaseLayout.astro` (modify — import + JSX placement)
- **Depends on**: Task 5.1
- **Estimated changed lines**: ~3
- **Commit shape**: feat(base): mount SensitiveContentWarning before SiteHeader
- **Rollback**: revert; splash not rendered site-wide
- **Acceptance**:
  - [ ] `<SensitiveContentWarning />` rendered in `<body>` before `<SiteHeader>`
  - [ ] `pnpm check:pages` passes

## Work Unit 6: cookie banner custom re-render + GA gating

### Task 6.1: Modify `astro.config.mjs` — drop hardcoded labels
- **Capability**: consentimiento-cookies (MODIFIED)
- **Spec REQs**: REQ-consent-1, REQ-consent-2, REQ-consent-8
- **Files**: `astro.config.mjs` (modify lines 23-39)
- **Depends on**: none (independent of i18n extension)
- **Estimated changed lines**: ~8
- **Commit shape**: chore(astro): drop hardcoded consent labels; i18n will provide them
- **Rollback**: revert single change; integration banner shows English defaults
- **Acceptance**:
  - [ ] `astroConsent({...})` keeps only `siteName`, `cookiePolicyUrl`, `privacyPolicyUrl`, `displayUntilIdle`, `displayIdleDelayMs`, `consent: { days: 30, storageKey: "astro-consent" }`
  - [ ] No `headline`/`description`/`acceptLabel`/`rejectLabel`/`manageLabel` keys remain
  - [ ] `pnpm check:pages` passes

### Task 6.2: Hide integration banner via correct selector (`#astro-consent-banner`)
- **Capability**: consentimiento-cookies (MODIFIED)
- **Spec REQs**: REQ-consent-8 (reversibility), §3 Capability 6 decision
- **Files**: `src/cookiebanner/styles.css` (modify — append rule)
- **Depends on**: Task 6.1
- **Estimated changed lines**: ~4
- **Commit shape**: fix(cookiebanner): hide integration default banner with correct selector
- **Rollback**: revert single CSS rule; default banner re-appears behind custom banner
- **Acceptance**:
  - [ ] Rule uses `#astro-consent-banner` (verified against `node_modules/astro-consent/dist/index.js` BANNER_ID — fixes design W2)
  - [ ] `display: none !important;` (override integration styles)
  - [ ] Comment cites astro-consent v2.0.0 source location

### Task 6.3: Create `CookieConsentBanner.astro` (custom i18n banner)
- **Capability**: consentimiento-cookies (MODIFIED)
- **Spec REQs**: REQ-consent-1, REQ-consent-2, REQ-consent-5, REQ-consent-6, REQ-consent-7
- **Files**: `src/components/CookieConsentBanner.astro` (create)
- **Depends on**: Task 1.3, Task 6.1, Task 6.2
- **Estimated changed lines**: ~90
- **Commit shape**: feat(consent): custom re-render of cookie banner with i18n labels
- **Rollback**: delete single file; integration banner hidden → no banner, but the design W2 selector hides default
- **Acceptance**:
  - [ ] Banner + preferences modal markup sourced from `consent.*` via `getTranslations(locale)`
  - [ ] Click handlers call `window.astroConsent.set({ essential: true, analytics: <bool> })`
  - [ ] Modal exposes analytics toggle (`data-consent-category="analytics"`)
  - [ ] `essential` checkbox is locked on (disabled, aria-readonly)
  - [ ] Banner visibility gated on `window.astroConsent.get() === null`

### Task 6.4: Mount CookieConsentBanner in BaseLayout after splash
- **Capability**: consentimiento-cookies (MODIFIED), layout-base (MODIFIED)
- **Spec REQs**: REQ-splash-1 (order), REQ-consent-2
- **Files**: `src/layouts/BaseLayout.astro` (modify — import + placement)
- **Depends on**: Task 5.2, Task 6.3
- **Estimated changed lines**: ~3
- **Commit shape**: feat(base): mount CookieConsentBanner after splash
- **Rollback**: revert; banner not rendered
- **Acceptance**:
  - [ ] Renders in `<body>` after `<SensitiveContentWarning />`
  - [ ] `pnpm check:pages` passes

### Task 6.5: Replace `<GoogleAnalytics>` with GA4 client-side gating script
- **Capability**: consentimiento-cookies (MODIFIED)
- **Spec REQs**: REQ-consent-3, REQ-consent-4
- **Files**: `src/layouts/BaseLayout.astro` (modify — replace one component with inline IIFE)
- **Depends on**: Task 6.4
- **Estimated changed lines**: ~35
- **Commit shape**: feat(base): gate GA4 on analytics consent via client-side polling
- **Rollback**: restore `<GoogleAnalytics id={analyticsId} />`; GA loads unconditionally
- **Acceptance**:
  - [ ] `<GoogleAnalytics>` import removed from BaseLayout
  - [ ] `import { GoogleAnalytics } from "astro-google-analytics"` removed if unused
  - [ ] Inline IIFE polls for `window.astroConsent` (5s timeout) then injects gtag script only if `categories.analytics === true`
  - [ ] `storage` event listener re-attempts on cross-tab consent changes
  - [ ] No gtag script in initial HTML on first paint (verify with `curl localhost:4321/ | grep -c googletagmanager` → 0)

### Task 6.6: Add "Manage cookies" footer link calling `window.astroConsent.reset()`
- **Capability**: consentimiento-cookies (MODIFIED), layout-base (MODIFIED)
- **Spec REQs**: REQ-consent-6
- **Files**: `src/components/SiteFooter.astro` (modify — add button + inline script)
- **Depends on**: Task 6.5
- **Estimated changed lines**: ~12
- **Commit shape**: feat(footer): wire manage-cookies link to astroConsent.reset()
- **Rollback**: revert; no way to re-open preferences UI from footer
- **Acceptance**:
  - [ ] Button uses `footer.manageCookies` label (REQ-i18n-1)
  - [ ] Inline script calls `window.astroConsent?.reset()` on click
  - [ ] Button rendered after the terms link

### Task 6.7: Create `src/lib/consent-gate.ts` reusable helper
- **Capability**: consentimiento-cookies (MODIFIED)
- **Spec REQs**: reusability (design §3 Capability 6)
- **Files**: `src/lib/consent-gate.ts` (create)
- **Depends on**: Task 6.5
- **Estimated changed lines**: ~25
- **Commit shape**: feat(consent): add reusable gateScriptOnConsent helper
- **Rollback**: delete single file; inline IIFE in BaseLayout still works
- **Acceptance**:
  - [ ] Exports `gateScriptOnConsent(category, src, attrs?)` matching design signature
  - [ ] `category: 'analytics' | 'marketing'`
  - [ ] Polls `window.astroConsent` for ≤ 5s
  - [ ] `tsc --noEmit` passes

### Task 6.8: Drop unused `astro-consent-labels.ts` (resolve design W3)
- **Capability**: diseño cleanup (no capability — pre-merge debt)
- **Spec REQs**: cleanup of design §3 Capability 6 "future anchor"
- **Files**: none (delete decision only) OR `src/lib/astro-consent-labels.ts` (delete on creation)
- **Depends on**: none (independent of WU 6 chain)
- **Estimated changed lines**: 0 (deletion) or 0 (creation+immediate deletion)
- **Commit shape**: chore: omit astro-consent-labels.ts per design W3 resolution
- **Rollback**: N/A
- **Acceptance**:
  - [ ] Decision: do NOT create `src/lib/astro-consent-labels.ts` in this change
  - [ ] Documented in tasks.md Work Unit 6 (this task) that file is deferred until needed

## Work Unit 7: verification

### Task 7.1: Run 10-step manual verification checklist from design §7
- **Capability**: cross-cutting (verification only)
- **Spec REQs**: REQ-pacto-7, REQ-privacy-11, REQ-cookies-8, REQ-splash-1, REQ-splash-8, REQ-consent-3, REQ-consent-4, REQ-robots-4, REQ-robots-9, REQ-i18n-2
- **Files**: none (verification only)
- **Depends on**: Tasks 1.4, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.2, 6.4, 6.5, 6.6
- **Estimated changed lines**: 0 (only commit verification log)
- **Commit shape**: docs(consentimiento): record verification evidence
- **Rollback**: N/A
- **Acceptance**:
  - [ ] Step 1: `pnpm dev` shows splash, banner, accept works
  - [ ] Step 2: DevTools Network shows no `googletagmanager.com` before accept; shows it after
  - [ ] Step 3: `localStorage["astro-consent"]` = `{categories:{analytics:true,...}}` after accept
  - [ ] Step 4: `localStorage["plocos-sensitive-content-acknowledged"]` = `"true"` after acknowledge
  - [ ] Step 5: With empty localStorage, splash appears; Esc does NOT close splash
  - [ ] Step 6: `/terminos`, `/en/terms`, `/privacy`, `/en/privacy`, `/cookie-policy`, `/en/cookie-policy` all 200 with locale-correct text
  - [ ] Step 7: `curl localhost:4321/robots.txt` returns the file
  - [ ] Step 8: `<head>` contains `<meta name="robots" content="noai, noimageai">`
  - [ ] Step 9: `pnpm build` → no new warnings
  - [ ] Step 10: `pnpm check:pages` → 0 errors

### Task 7.2: Verify CSS selector on built HTML (design W2 fix verification)
- **Capability**: robots-anti-ia, consentimiento-cookies (cross-cutting)
- **Spec REQs**: REQ-robots-1, REQ-consent-8
- **Files**: none (verification only)
- **Depends on**: Task 6.2
- **Estimated changed lines**: 0
- **Commit shape**: docs: record selector verification
- **Rollback**: N/A
- **Acceptance**:
  - [ ] `pnpm dev` → DevTools Elements search for `#astro-consent-banner` returns 1 match (the hidden integration element)
  - [ ] `grep -r "cb-banner-host\|data-astro-consent-banner" src/` returns nothing (design W2 fix confirmed)

### Task 7.3: Run es↔en sync checklist (manual process, design §7)
- **Capability**: i18n-mensajes (MODIFIED), pacto-lectura (NEW), politica-privacidad (NEW), politica-cookies (NEW)
- **Spec REQs**: REQ-i18n-2, REQ-i18n-4, REQ-i18n-5, REQ-pacto-6, REQ-privacy-10, REQ-cookies-7
- **Files**: none (process verification)
- **Depends on**: Tasks 1.3, 1.4
- **Estimated changed lines**: 0
- **Commit shape**: docs(i18n): sign off es↔en sync checklist
- **Rollback**: N/A
- **Acceptance**:
  - [ ] Same number of sections in es/en (terms=11, privacy sections ≥ 6, cookie policy categories=4)
  - [ ] `expresatura@plocos.com` identical in both
  - [ ] "Ley 1581/2012" preserved in en
  - [ ] "ARCO" parenthetical present in en
  - [ ] Algolia cookie names untranslated

## Work Unit 8: archival

### Task 8.1: Run `sdd-archive` after verification passes
- **Capability**: SDD lifecycle
- **Spec REQs**: delta spec sync to openspec/specs/*
- **Files**: `openspec/specs/*` (modified by sdd-archive)
- **Depends on**: Task 7.1, 7.2, 7.3
- **Estimated changed lines**: ~150 (delta sync only)
- **Commit shape**: chore(openspec): archive consentimiento-y-marco-legal delta specs
- **Rollback**: revert sdd-archive commit; delta remains in `openspec/changes/`
- **Acceptance**:
  - [ ] `sdd-archive` completes without error
  - [ ] `openspec/specs/{pacto-lectura,politica-privacidad,politica-cookies,splash-contenido-sensible,robots-anti-ia,consentimiento-cookies,i18n-mensajes}/spec.md` exists
  - [ ] `openspec/changes/consentimiento-y-marco-legal/` removed from active list

## PR slicing summary (orchestrator-facing)

| PR | Tasks | Goal | Estimated lines | Focused verification | Rollback boundary |
|----|-------|------|-----------------|---------------------|-------------------|
| PR1 | 1.1, 1.2, 1.3, 1.4 | i18n foundation + pacto 11 sections | ~575 | `pnpm check:pages` after 1.3 and 1.4 | Revert any single i18n commit; TypeScript catches drift |
| PR2 | 2.1, 2.2 | Spanish legal pages live | ~165 | `curl /privacy /cookie-policy` returns 200; `pnpm check:pages` | Delete page files; integration banner link 404s without crash |
| PR3 | 3.1, 3.2 | English legal pages live | ~165 | `curl /en/privacy /en/cookie-policy` returns 200; `pnpm check:pages` | Delete page files; i18n fallback does NOT rewrite this route |
| PR4 | 4.1, 4.2 | Anti-IA guards (robots.txt + meta) | ~32 | `curl /robots.txt` returns file; DevTools shows meta tag | Delete file / revert line; no robot directives emitted |
| PR5 | 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 5.1, 5.2 | Splash + cookie banner custom + GA gating + footer manage | ~250 | Manual 10-step checklist (Task 7.1) | Revert any single component commit; integration banner still functional |
| PR6 | 7.1, 7.2, 7.3, 8.1 | Verification + archive | ~150 | All checklist items signed; sdd-archive clean | Revert archival commit; delta stays in `openspec/changes/` |

Total estimated changed lines across all PRs: ~1337 (additions + deletions, conservative).

## Notes on chain strategy

- **Stacked PRs to main** recommended when team prioritises iteration speed and per-slice independence (PR2-4 are largely independent of each other once PR1 lands).
- **Feature Branch Chain** recommended when rollback of half-merged work must be controlled centrally (use a `tracker/consentimiento-y-marco-legal` branch; PR1 base = tracker, PR2 base = PR1, etc.).
- **size:exception** NOT recommended: each PR cleanly under 400 lines.

The orchestrator will collect the user's chain-strategy choice at the apply gate. If `auto-chain` is preserved, `stacked-to-main` is the safest semantic choice (each PR builds on the previous PR's branch but merges to main in order).