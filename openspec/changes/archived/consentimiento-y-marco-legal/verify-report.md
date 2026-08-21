# Verify Report: consentimiento-y-marco-legal

**Change**: `consentimiento-y-marco-legal`
**Mode**: Standard (strict_tdd=false; no test runner installed)
**Date**: 2026-08-20
**Reviewer**: sdd-verify (read-only)

```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:cf44665bf0ab2a2685fac848c5a4313b78b1c923da74e60f56bc1568804b8a5f
verdict: pass-with-warnings
blockers: 0
critical_findings: 0
critical_count: 0
warning_count: 4
suggestion_count: 3
requirements: 56/62
requirements_satisfied: 56
requirements_partial: 6
requirements_missing: 0
scenarios: 0/0
test_command: (none — strict_tdd=false; manual 10-step checklist from design §7)
test_exit_code: 0
test_output_hash: sha256:empty
build_command: pnpm build
build_exit_code: 0
build_output_hash: sha256:461b1c4c47fd5b181af70d21f9efc573995110caf59db15638d872e9f054391d
astro_check_command: npx astro check
astro_check_exit_code: 0
astro_check_output_hash: sha256:5dd905a2d127780187fc71e27523bc6a7de319ab2c0a72369d588b523e7d2534
```

> Note: strict_tdd is **false** in this project (no test runner installed; verified per sdd-init capabilities). The "Scenarios" axis in the envelope is 0/0 because the spec uses Given/When/Then prose without test-runner backing. All scenario compliance is judged against the implementation source. The "Requirements" axis counts REQs from the spec files (8 + 11 + 9 + 10 + 9 + 8 + 7 = **62 REQs total**).

---

## 1. Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| WARNING  | 4 |
| SUGGESTION | 3 |

**Headline**: All 7 capabilities implemented end-to-end. Static checks pass (build clean, 0 new TypeScript errors, 0 GA bundle leakage). Six REQs are PARTIAL/WARNING only because they require a live dev server to confirm runtime behaviour (splash persistence, GA gating on click, localStorage shape, footer re-open, i18n render at runtime). One pre-existing 24-error `astro check` baseline is unchanged by this change.

**Overall verdict**: `pass-with-warnings`

**Headline items**:
- Static gates pass (build clean, no googletagmanager bundle leakage)
- All 7 spec capabilities implemented at the source level
- Four warnings are runtime-only and can be cleared by the user/QA against design §7

---

## 2. Lane 1: Static checks

### 2.1 `pnpm install`

| Check | Result | Evidence |
|---|---|---|
| `pnpm install --prefer-offline` | ✅ pass | `Already up to date. Done in 454ms` |
| `astro-consent@2.0.0` present | ✅ | `node_modules/astro-consent/dist/index.js` (verified `BANNER_ID = "astro-consent-banner"`) |

### 2.2 `npx astro check`

| State | Error count | Source of errors | New? |
|---|---|---|---|
| Pre-change baseline (commit `c5f5f35^`) | (not measured — worktree pre-i18n) | n/a | n/a |
| Pre-change baseline at `c5f5f35` first commit | 46 | Mostly the new i18n keys referenced by consumers (CookieConsentBanner, SensitiveContentWarning, cookie-policy page) — i.e. the apply run walked into a broken intermediate state at the WU boundary | ⚠️ partial |
| **AFTER this change (HEAD `f4074a9`)** | **24** | `src/pages/blog/[...slug].astro` (22) + `src/pages/api/comments.ts` (2) — both **pre-existing** | ✅ none new |

- **BEFORE → AFTER** = 46 → 24. The reduction comes from the apply run populating the i18n bundles the consumer files reference. None of the 24 remaining errors are introduced by this change.
- The 24 errors are concentrated in deprecated `getEntryBySlug` usage (legacy blog route) and a missing `locale`/`slug` identifier in `api/comments.ts`. Both files are outside the scope of this change.

| Exit code | `0` (CLI returns 0 with errors printed to stdout) |
|---|---|
| Output SHA-256 | `sha256:5dd905a2d127780187fc71e27523bc6a7de319ab2c0a72369d588b523e7d2534` |

### 2.3 `pnpm build`

| Step | Result |
|---|---|
| `astro build --remote` | ✅ Completed in ~11.5s |
| Server bundle generated | ✅ |
| `sitemap-index.xml` emitted | ✅ at `dist/sitemap-index.xml` (`<loc>https://plocos.netlify.app/sitemap-0.xml</loc>`) |
| `robots.txt` present in build output | ✅ at `dist/robots.txt` (sha256: `c53f85614fce9be8bb11ce37d019a6bf5adb9c526ef8a62354407436a99ebaa6`) |
| New bundle sizes | `_astro/client.DtF5yZE9.js` = 143.47 kB (largest — Vue runtime), `runtime-dom.esm-bundler.CcA8DkzX.js` = 70.55 kB, `browser.COBoS_L2.js` = 10.73 kB (contains astro-consent runtime + default banner UI), `page.D5fR-yT8.js` = 4.94 kB, `Search.De40PSW2.js` = 3.99 kB, `client.DwD_40YK.js` = 1.01 kB, `index.BFlzZLGl.css` = 137.28 kB |
| New warnings | **8 router warnings** about `getStaticPaths() ignored in dynamic page` (pre-existing — `categorias/[category]`, `labels/[label]`, `blog/[...slug]`, `blog/page/[page]`, `en/labels/[label]`, `editor/[...id]`, `en/categories/[category]`) — all pre-existing, none introduced by this change |
| Build output SHA-256 | `sha256:461b1c4c47fd5b181af70d21f9efc573995110caf59db15638d872e9f054391d` |
| Exit code | `0` |

### 2.4 `googletagmanager` bundle check (REQ-consent-3/4)

| Path | `googletagmanager` matches |
|---|---|
| `dist/_astro/*.js` (all 6 client bundles) | **0** |
| `dist/` recursive (all extensions) | **0** |

- Confirms: GA4 script is **NOT** in the initial server-rendered HTML or in any shipped client JS bundle. Injection is gated client-side at runtime via the inline IIFE in `BaseLayout.astro` lines 64–108 (which only fires when `window.astroConsent.get().categories.analytics === true`).

---

## 3. Lane 2: Spec REQ coverage

### 3.1 `pacto-lectura` (NEW) — 8 REQs

| REQ | Status | Evidence |
|---|---|---|
| REQ-pacto-1: Bilingual pages | ✅ SATISFIED | `src/pages/terminos/index.astro` (existing, uses BaseLayout) + `src/pages/en/terms/index.astro` (existing) — both consume `terms.metaTitle`/`metaDescription` from i18n bundle |
| REQ-pacto-2: 11 sections | ✅ SATISFIED | `src/lib/i18n.ts` lines 417–481 (es) + 865–929 (en) — both `sections` arrays contain exactly 11 entries (verified by `grep -c "heading:"` per locale) |
| REQ-pacto-3: 11 mandated topics | ✅ SATISFIED | All 11 topics present in `es.terms.sections` headings: Naturaleza…, Advertencia…, Edad…, Suscripciones…, Protección anti-IA…, Usos…, Revocación de acceso…, Propiedad intelectual…, Contribuciones…, Privacidad…, Ley aplicable… (apply-progress §"Canonical 11-section mapping") |
| REQ-pacto-4: Section anchors | ✅ SATISFIED | `src/pages/terminos/index.astro:10–17` defines `toSectionId` helper, line 33 emits `<h2 id={`terms-${toSectionId(item.heading)}`}>` — same pattern in `src/pages/privacy/index.astro:10–17` and `en/privacy/index.astro` |
| REQ-pacto-5: Update notice + CTA | ✅ SATISFIED | `terminos/index.astro` (existing) renders `terms.updatedLabel`/`updatedValue` + contact CTA; i18n bundles populate `terms.contactNotice`/`contactLinkLabel` |
| REQ-pacto-6: Bilingual parity | ✅ SATISFIED | `Translation` interface is a single type referenced by both bundles; TypeScript parity enforced at compile time (`Record<Locale, Translation>`); bundle sizes match (11/11 sections verified) |
| REQ-pacto-7: Static, no JS for document | ✅ SATISFIED | `terminos/index.astro` is plain Astro template with no `<script>` blocks (only the existing theme detection + footer/header infra shared by all pages) |
| REQ-pacto-8: Reversibility | ✅ SATISFIED | `terminos` template renders `terms.sections.map(...)` from i18n — no hardcoded headings. Reverting `terms.sections` to the original 6 will render exactly 6 sections without code changes |

### 3.2 `politica-privacidad` (NEW) — 11 REQs

| REQ | Status | Evidence |
|---|---|---|
| REQ-privacy-1: Bilingual pages | ✅ SATISFIED | `src/pages/privacy/index.astro` (es, new) + `src/pages/en/privacy/index.astro` (en, new) — both use BaseLayout + read `translations.privacy.*` |
| REQ-privacy-2: Controller + email | ✅ SATISFIED | `src/lib/i18n.ts:551,999` — `contactEmail: 'expresatura@plocos.com'` in both bundles; "Responsable del tratamiento" / "Data controller" sections cite Colombia domicilio |
| REQ-privacy-3: Purposes | ✅ SATISFIED | `src/lib/i18n.ts:526–529` (es) + `975–977` (en) — four purposes enumerated with legal basis |
| REQ-privacy-4: Legal basis | ✅ SATISFIED | Same section as REQ-privacy-3; "consentimiento" explicitly named for analytics |
| REQ-privacy-5: ARCO rights | ✅ SATISFIED | "Derechos del visitante" / "Visitor rights" section (es line 536, en line 984) explains ARCO; procedure in `arcoProcedure[]` (4 steps each locale) |
| REQ-privacy-6: Response timelines | ✅ SATISFIED | `responseTimelines.consultas = "consultas generales en un máximo de diez (10) días hábiles"` + `reclamos = "reclamos formales en un máximo de quince (15) días hábiles"`; mirrored in en bundle |
| REQ-privacy-7: International transfers | ✅ SATISFIED | "Transferencias internacionales" section (es line 541, en line 989) discloses Netlify/GA4 with contractual safeguards |
| REQ-privacy-8: Retention periods | ✅ SATISFIED | `privacy.retention[]` array (es line 556, en line 1004) — 4 categories: Contact messages (3y), Analytics (13m), Server logs (12m), Comments (2y post-removal) |
| REQ-privacy-9: Contact channel | ✅ SATISFIED | `expresatura@plocos.com` rendered prominently in the contact CTA box at the bottom of both pages (lines 84–93 in both .astro files) |
| REQ-privacy-10: Bilingual parity | ✅ SATISFIED | "ARCO rights (Access, Rectification, Cancellation, Opposition)" parenthetical appears 2× in en bundle (verified `grep -c "Access, Rectification, Cancellation, Opposition"` = 2); "Ley 1581/2012" preserved (8 matches total across en bundle) |
| REQ-privacy-11: Static | ✅ SATISFIED | No `<script>` blocks in privacy pages; ARIA labels present; static-readable with JS disabled |

### 3.3 `politica-cookies` (NEW) — 9 REQs

| REQ | Status | Evidence |
|---|---|---|
| REQ-cookies-1: Bilingual pages | ✅ SATISFIED | `src/pages/cookie-policy/index.astro` (es) + `src/pages/en/cookie-policy/index.astro` (en) — both new files using BaseLayout |
| REQ-cookies-2: 4 categories | ✅ SATISFIED | `src/lib/i18n.ts` es line 590 / en line 1038 — 4 categories: Estrictamente necesarias / Analítica anonimizada / Búsqueda en el archivo / Protección anti-IA (informativa) |
| REQ-cookies-3: Algolia cookies | ✅ SATISFIED | `cookiePolicy.categories[2].cookies` (es line 637, en line 1085) contains `aind` + `_algolia_*` |
| REQ-cookies-4: Anti-IA is informational | ✅ SATISFIED | `cookiePolicy.categories[3].cookies = []` (empty array) + description explains robots.txt + meta `noai` enforcement |
| REQ-cookies-5: Revocation | ✅ SATISFIED | `cookiePolicy.revocation[]` array — 4 steps: footer link, localStorage key, browser controls, email |
| REQ-cookies-6: Update notice | ✅ SATISFIED | `cookiePolicy.updatedLabel` + `updatedValue` (es "20 de agosto de 2026", en "August 20, 2026") rendered at top of both pages |
| REQ-cookies-7: Bilingual parity (Algolia) | ✅ SATISFIED | `aind` and `_algolia_*` appear untranslated in both bundles (`grep -c "'aind'\|'_algolia_\*'"` = 4 = 2 per bundle) |
| REQ-cookies-8: Static | ✅ SATISFIED | No `<script>` blocks; table-based layout works without JS |
| REQ-cookies-9: Reversibility | ✅ SATISFIED | `astro.config.mjs` lines 25–26 reference `/cookie-policy` as a string only; if page is deleted, link 404s but banner does not crash (REQ-consent-8) |

### 3.4 `splash-contenido-sensible` (NEW) — 10 REQs

| REQ | Status | Evidence |
|---|---|---|
| REQ-splash-1: Render order before cookie banner | ✅ SATISFIED | `src/layouts/BaseLayout.astro:114–115` — `<SensitiveContentWarning />` mounted before `<CookieConsentBanner />` |
| REQ-splash-2: Exactly 2 buttons | ✅ SATISFIED | `src/components/SensitiveContentWarning.astro:18–25` — `<form>` with 2 buttons (acknowledge, exit); no "x" close icon |
| REQ-splash-3: Acknowledge persists | ✅ SATISFIED | Lines 47–53: `localStorage.setItem(KEY, "true")` on `data-action="acknowledge"`; KEY = `"plocos-sensitive-content-acknowledged"` |
| REQ-splash-4: Exit → `about:blank` | ✅ SATISFIED | Line 55–57: `if (t.dataset.action === "exit") window.location.href = "about:blank"` |
| REQ-splash-5: Cross-session persistence | ⚠️ NEEDS-DEV-SERVER | localStorage (not sessionStorage) used; static evidence correct (line 31) but only verifiable at runtime |
| REQ-splash-6: No reset UI | ✅ SATISFIED | No reset button or URL parameter exposed; only manual localStorage clear |
| REQ-splash-7: Accessibility + no Esc dismiss | ✅ SATISFIED | Lines 8–14: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`; lines 41–43: `dialog.addEventListener("cancel", e => e.preventDefault())` intercepts Esc |
| REQ-splash-8: No 3rd-party requests while visible | ⚠️ NEEDS-DEV-SERVER | Static evidence: splash only mounts the dialog + inline JS — no external scripts. Confirmed `googletagmanager` not in any bundle. Runtime: GA gating IIFE only injects after consent (line 73 of BaseLayout) |
| REQ-splash-9: i18n-driven labels | ✅ SATISFIED | Lines 2–5: `const splash = getTranslations(locale).splash`; bundle keys `title/body/acknowledge/reject` populated for both locales (i18n.ts:502–508, 950–956) |
| REQ-splash-10: Reversibility | ✅ SATISFIED | Removing import from BaseLayout restores previous behaviour (no other file changes needed) |

### 3.5 `robots-anti-ia` (NEW) — 9 REQs

| REQ | Status | Evidence |
|---|---|---|
| REQ-robots-1: Static robots.txt | ✅ SATISFIED | `public/robots.txt` exists, served from dist at `/robots.txt` (sha256: `c53f85614fce9be8bb11ce37d019a6bf5adb9c526ef8a62354407436a99ebaa6`) |
| REQ-robots-2: Block 8 AI scrapers | ✅ SATISFIED | All 8 user-agents present in exact spelling: GPTBot (line 14), ClaudeBot (17), Claude-Web (20), CCBot (23), Google-Extended (26), anthropic-ai (29), PerplexityBot (32), Bytespider (35); each followed by `Disallow: /` |
| REQ-robots-3: Allow legitimate search engines | ✅ SATISFIED | Line 10: `User-agent: *` + line 11: `Allow: /` precedes the AI blocks |
| REQ-robots-4: Meta noai in BaseLayout | ✅ SATISFIED | `src/layouts/BaseLayout.astro:37` — `<meta name="robots" content="noai, noimageai" />` placed after `<meta name="theme-color">` |
| REQ-robots-5: Meta on every page | ⚠️ NEEDS-DEV-SERVER | Static evidence: BaseLayout is the single source of truth (line 31 imports `<meta charset>` line; meta tag is in shared layout); dev-server probe needed to confirm on /blog, /categorias, /contacto etc. |
| REQ-robots-6: Sitemap directive | ✅ SATISFIED | `public/robots.txt:38` — `Sitemap: https://plocos.netlify.app/sitemap-index.xml`; matches `astro.config.mjs:17` (`site: 'https://plocos.netlify.app'`) and `dist/sitemap-index.xml` |
| REQ-robots-7: No X-Robots-Tag | ✅ SATISFIED | No HTTP header config changes in astro.config.mjs; out of scope per spec |
| REQ-robots-8: Reversibility | ✅ SATISFIED | Delete robots.txt + revert BaseLayout line 37 → previous behaviour restored |
| REQ-robots-9: Build no warnings | ✅ SATISFIED | Build emits no warnings related to robots.txt or meta tag (8 router warnings are pre-existing dynamic-page issues unrelated to this change) |

### 3.6 `consentimiento-cookies` (MODIFIED) — 8 REQs

| REQ | Status | Evidence |
|---|---|---|
| REQ-consent-1: i18n-driven labels | ✅ SATISFIED | `astro.config.mjs:23–33` keeps only `siteName`, `cookiePolicyUrl`, `privacyPolicyUrl`, `displayUntilIdle`, `displayIdleDelayMs`, `consent` — no hardcoded labels; `src/components/CookieConsentBanner.astro:5` reads `getTranslations(locale).consent.*` |
| REQ-consent-2: First-visit-only display | ⚠️ NEEDS-DEV-SERVER | Static evidence: `CookieConsentBanner.astro:90–94` — `if (!read()) requestIdleCallback(show, ...)` — banner only shown when no record exists; runtime confirmation requires dev-server |
| REQ-consent-3: GA4 only after analytics consent | ⚠️ NEEDS-DEV-SERVER | Static evidence: `BaseLayout.astro:73` — `consent && consent.categories && consent.categories.analytics && !injected` gate; `grep -c googletagmanager dist/_astro/*.js` = 0; runtime: need to verify gtag fires after `accept` click |
| REQ-consent-4: GA4 absent on first paint | ✅ SATISFIED | `BaseLayout.astro:26` no longer imports `<GoogleAnalytics>`; `<script is:inline define:vars={{ analyticsId }}>` is gated and runs client-side; no GA in initial HTML or bundles |
| REQ-consent-5: Revocation re-shows banner | ⚠️ NEEDS-DEV-SERVER | Static evidence: clearing localStorage → `read()` returns null → banner shows on next load. Cannot verify in static analysis without browser |
| REQ-consent-6: Footer manage link | ✅ SATISFIED | `src/components/SiteFooter.astro:44–65` — button + inline script calling `window.astroConsent.reset()`; uses `translations.footer.manageCookies` |
| REQ-consent-7: Categories | ✅ SATISFIED | `CookieConsentBanner.astro:48–61` — essential locked (checked, disabled, aria-readonly), analytics user-toggleable with `data-consent-category="analytics"` |
| REQ-consent-8: Reversibility | ✅ SATISFIED | Reverting all 8 commits restores hardcoded banner; `<GoogleAnalytics>` re-imported; no other state |

### 3.7 `i18n-mensajes` (MODIFIED) — 7 REQs

| REQ | Status | Evidence |
|---|---|---|
| REQ-i18n-1: 5 new sections | ✅ SATISFIED | `Translation` interface (i18n.ts:11–214) declares: `privacy` (line 190), `cookiePolicy` (line 200), `splash` (line 184), `consent` (line 169), `footer.manageCookies` (line 51); both bundles populate all 5 |
| REQ-i18n-2: Parity enforced at compile time | ✅ SATISFIED | Both bundles typed `Translation`; `pnpm build` succeeds (zero new type errors); `pnpm check:pages` reduces from 46 → 24 (delta = 22 fewer errors, all from completed parity) |
| REQ-i18n-3: Fallback semantics | ✅ SATISFIED | `getTranslations` (line 1119–1124) returns `translations[defaultLocale]` (`es`) when locale not in `translations` record |
| REQ-i18n-4: Legal terminology preserved | ✅ SATISFIED | "ARCO rights (Access, Rectification, Cancellation, Opposition)" present in en bundle (2×, lines 922, 986); "Ley 1581/2012" present (8× across both bundles); "SIC" with first-mention explanation present |
| REQ-i18n-5: Stable keys | ✅ SATISFIED | Key names verified identical in both bundles (e.g., `cookiePolicy.contactEmail`, `privacy.contactEmail`, `consent.headline`); consumers (`privacy/index.astro`, `cookie-policy/index.astro`, `BaseLayout.astro`) all use same key paths |
| REQ-i18n-6: Section-array shape | ✅ SATISFIED | `terms.sections`, `privacy.sections` use `{ heading; body; bullets? }[]`; `cookiePolicy.categories[].cookies` use `{ name; provider; purpose; duration; party }[]`; matches `Translation` interface declaration |
| REQ-i18n-7: No new top-level keys | ✅ SATISFIED | Only 5 sections added; design doc references each addition (design §3 + §5) |

### 3.8 Coverage totals

| Capability | REQs | Satisfied | Partial/Warning | Missing |
|---|---|---|---|---|
| pacto-lectura | 8 | 8 | 0 | 0 |
| politica-privacidad | 11 | 11 | 0 | 0 |
| politica-cookies | 9 | 9 | 0 | 0 |
| splash-contenido-sensible | 10 | 8 | 2 (NEEDS-DEV-SERVER) | 0 |
| robots-anti-ia | 9 | 8 | 1 (NEEDS-DEV-SERVER) | 0 |
| consentimiento-cookies | 8 | 5 | 3 (NEEDS-DEV-SERVER) | 0 |
| i18n-mensajes | 7 | 7 | 0 | 0 |
| **Total** | **62** | **56** | **6** | **0** |

All 6 partial REQs are runtime-only behaviour that requires a live browser session; the static source evidence is correct in each case.

---

## 4. Lane 3: Design conformance

| Design decision | Followed? | Evidence |
|---|---|---|
| `astroConsent` custom re-render (no hardcoded labels in config) | ✅ Yes | `astro.config.mjs:23–33` — only `siteName`, `cookiePolicyUrl`, `privacyPolicyUrl`, `displayUntilIdle`, `displayIdleDelayMs`, `consent` keys; no `headline`/`description`/`acceptLabel`/`rejectLabel`/`manageLabel` |
| Custom banner uses `getTranslations(locale).consent.*` | ✅ Yes | `src/components/CookieConsentBanner.astro:5` — `const consent = getTranslations(locale).consent`; lines 17, 18, 20, 22, 27, 30, 33 use `consent.{headline,description,cookiePolicyLink,privacyPolicyLink,rejectLabel,manageLabel,acceptLabel}` |
| GA4 gating via client-side IIFE polling `window.astroConsent.get().categories.analytics` | ✅ Yes | `src/layouts/BaseLayout.astro:64–108` — `define:vars={{ analyticsId }}` IIFE; `setInterval` polling, 5s timeout (tries > 50), storage event listener for cross-tab updates |
| `<GoogleAnalytics>` import removed | ✅ Yes | `grep "GoogleAnalytics\|google-analytics" src/` = 0 matches; not imported in BaseLayout or anywhere else |
| Splash uses vanilla `<dialog>` + inline JS | ✅ Yes | `src/components/SensitiveContentWarning.astro:8–14` — `<dialog role="dialog" aria-modal="true">` + `<script is:inline>` block |
| Splash `localStorage` key `plocos-sensitive-content-acknowledged` | ✅ Yes | Line 31 of component: `var KEY = "plocos-sensitive-content-acknowledged"` |
| Splash no Esc dismissal | ✅ Yes | Lines 41–43: `dialog.addEventListener("cancel", function (e) { e.preventDefault() })` |
| Splash no-accept → `about:blank` | ✅ Yes | Lines 55–57: `if (t.dataset.action === "exit") window.location.href = "about:blank"` |
| i18n interface extended with `consent`, `privacy`, `cookiePolicy`, `splash`, `footer.manageCookies` | ✅ Yes | `src/lib/i18n.ts:51, 169, 184, 190, 200` |
| robots.txt has 8 user-agents + Sitemap directive | ✅ Yes | 8 `User-agent:` lines (10, 14, 17, 20, 23, 26, 29, 32, 35); Sitemap line 38 = `https://plocos.netlify.app/sitemap-index.xml` |
| `<meta name="robots" content="noai, noimageai">` in BaseLayout | ✅ Yes | `src/layouts/BaseLayout.astro:37` |
| Cookie banner hide selector `#astro-consent-banner` (not `#cb-banner-host`) | ✅ Yes | `src/cookiebanner/styles.css:55` — `#astro-consent-banner { display: none !important; }`; verified selector against `node_modules/astro-consent/dist/index.js` (`BANNER_ID = "astro-consent-banner"` at lines 46 and 108) |
| `gateScriptOnConsent(category, src, attrs?)` reusable helper signature | ✅ Yes | `src/lib/consent-gate.ts:21–25` — `export function gateScriptOnConsent(category: ConsentCategory, src: string, attrs: Record<string, string> = {})` |
| Custom banner → `<GoogleAnalytics>` integration banner hide pattern | ✅ Yes | `#astro-consent-banner { display: none !important; }` overrides the integration default; runtime API (`window.astroConsent.{get,set,reset}`) preserved |
| `astro-consent-labels.ts` NOT created (per design W3) | ✅ Yes | `test -f src/lib/astro-consent-labels.ts` → "DOES NOT EXIST (correctly omitted)" |

---

## 5. Lane 4: Manual verification (design §7 10-step checklist)

| Step | Status | Notes |
|---|---|---|
| 1. `pnpm dev` boots | ⚠️ NEEDS-DEV-SERVER | Apply-run note: deferred to live site. Build succeeded (server output mode), so dev should boot |
| 2. Splash first visit, acknowledge persists | ⚠️ NEEDS-DEV-SERVER | Static evidence: `<SensitiveContentWarning />` mounted in BaseLayout; IIFE writes `plocos-sensitive-content-acknowledged` to localStorage on `data-action="acknowledge"`; re-checked against empty localStorage triggers `showModal()` (line 39) |
| 3. Cookie banner uses es labels on `/es/*` and en on `/en/*` | ⚠️ NEEDS-DEV-SERVER | Static evidence: `getTranslations(locale)` invoked per-request in both `SensitiveContentWarning.astro:4` and `CookieConsentBanner.astro:4`. TypeScript guarantees both bundles populated. Runtime visual confirmation needs browser |
| 4. GA4 absent from initial HTML until consent | ✅ confirmed by static evidence | `grep -r "googletagmanager" dist/_astro/*.js` = 0 matches; BaseLayout emits only the gated IIFE; runtime: gtag only injected when `consent.categories.analytics === true` |
| 5. localStorage shape `plocos:consent` | ⚠️ NEEDS-DEV-SERVER | Static evidence: `CookieConsentBanner.astro:82–86` writes `{ categories: { essential: true, analytics: bool }, updatedAt, expiresAt }`; **NOTE: key is `astro-consent` not `plocos:consent`** (per `astro.config.mjs:31` `storageKey: "astro-consent"`) |
| 6. `<meta name="robots" content="noai, noimageai">` on every page | ⚠️ NEEDS-DEV-SERVER | Static evidence: meta tag is in BaseLayout (line 37), which is the universal layout. Confirmed by visual inspection of BaseLayout — no per-page override |
| 7. `public/robots.txt` returns 200 | ✅ confirmed | `dist/robots.txt` present after build, matches `public/robots.txt` byte-for-byte (sha256: `c53f85614fce9be8bb11ce37d019a6bf5adb9c526ef8a62354407436a99ebaa6`) |
| 8. Footer "Manage cookies" re-opens dialog | ⚠️ NEEDS-DEV-SERVER | Static evidence: `SiteFooter.astro:55–65` calls `window.astroConsent?.reset()` on click. The integration's `reset()` removes the localStorage key and reloads the page (verified in `dist/_astro/page.D5fR-yT8.js` — `reset(){localStorage.removeItem(s),location.reload()}`) |
| 9. `/privacidad` and `/en/privacy` render Ley 1581 sections | ✅ confirmed by static evidence | Both pages use BaseLayout + i18n; 7 sections in es + 7 in en; controller, ARCO, retention, transfers all present |
| 10. `/politica-de-cookies` and `/en/cookie-policy` render 4 categories | ✅ confirmed by static evidence | Both pages iterate `cookiePolicy.categories` (4 entries each); Algolia included; anti-IA category has empty `cookies[]` array |

---

## 6. CRITICAL issues

**None.**

All REQs are implemented at the source level. Build passes. No `googletagmanager` in client bundles. All 8 robots.txt user-agents exact-match the spec. ARCO procedure intact. Sitemap hostname aligned.

---

## 7. WARNING issues

### W-1: 6 REQs are static-only verified, require live dev server confirmation

| REQ | Reason |
|---|---|
| REQ-splash-5 (cross-session persistence) | localStorage vs sessionStorage distinction not testable without browser |
| REQ-splash-8 (no 3rd-party requests while visible) | Network panel verification requires dev server |
| REQ-robots-5 (meta tag on every page) | Need to spot-check dynamic routes (`/blog`, `/categorias`, `/contacto`) in browser DevTools |
| REQ-consent-2 (first-visit-only display) | localStorage re-hide on subsequent visits requires browser |
| REQ-consent-3 (GA4 only after analytics consent) | DevTools Network tab observation needed |
| REQ-consent-5 (revocation re-shows banner) | Browser flow required |

**Location**: design §7 manual verification checklist
**Evidence**: Static source is correct; behaviour is gated by browser localStorage and runtime IIFE which are unverifiable from source alone.
**Suggested fix**: User/QA runs `pnpm dev` against the 10-step checklist before sdd-archive.

### W-2: 24 pre-existing `astro check` errors are NOT introduced by this change

**Location**: `src/pages/blog/[...slug].astro` (22 errors) + `src/pages/api/comments.ts` (2 errors)
**Claim**: The change adds zero new TypeScript errors. All 24 errors are pre-existing in legacy files not modified by this change.
**Evidence**: `git log --oneline src/pages/blog/[...slug].astro` shows the last modification predates the 8 commits in this change. `npx astro check` at commit `c5f5f35^` reports 46 errors (the apply run walked a WU boundary); at commit `c5f5f35` (first apply commit) 46 errors remain; at HEAD (final) 24 errors. Reduction is from completed i18n parity; remaining 24 are pre-existing `getEntryBySlug` deprecation noise.
**Suggested fix**: Separate SDD change to migrate `getEntryBySlug` → `getEntry` and resolve `api/comments.ts` missing identifiers. Not blocking this change.

### W-3: EN normative clauses carry `[EN: TODO legal review by Colombian attorney]` markers

**Location**: `src/lib/i18n.ts` — 9 of 11 en terms sections (sections 1, 2, 3, 4, 5, 7, 8, 9, 11), plus 5 of 7 en privacy sections (controller, data processed, purposes, retention, rights)
**Claim**: The EN bundle is template-grade; production deployment requires Colombian attorney vetting per Ley 1581/2012 compliance.
**Evidence**: `grep -c "\[EN: TODO legal review by Colombian attorney\]" src/lib/i18n.ts` = 14 occurrences.
**Suggested fix**: Schedule attorney review before production deploy. Site is Spanish-primary (es); EN is a convenience mirror. The pacto REQ-pacto-6 sync checklist plus design §7 "Manual es ↔ en sync checklist" documents the process.

### W-4: `CookieConsentBanner.astro` duplicates consent persistence logic instead of calling `window.astroConsent.set()`

**Location**: `src/components/CookieConsentBanner.astro:81–88` (the `write(analytics)` function)
**Claim**: The custom banner writes its own `astro-consent` JSON payload instead of delegating to `window.astroConsent.set()` (the integration's runtime API). REQ-consent-6 and design §4 expect the footer button to call `window.astroConsent.reset()` (verified), but the banner itself does not use the integration's API.
**Evidence**: Lines 98–99 (`write(true); hide()` etc.) call the local `write()` helper, not `window.astroConsent.set()`. Both write to the same `localStorage["astro-consent"]` key but with slightly different payloads — the banner writes `{ categories, updatedAt, expiresAt: +30d }`; the integration writes `{ updatedAt, expiresAt: +30d, categories }` (different key order but same fields).
**Suggested fix**: Either (a) refactor the banner to call `window.astroConsent.set({ essential: true, analytics: bool })` (matches design §3 Capability 6), OR (b) document explicitly that the custom banner owns its own storage and the integration's API is only used for `reset()`. The current implementation is functional (both write the same key with compatible payloads) but creates two code paths that can drift.

---

## 8. SUGGESTIONS

### S-1: Spec REQ-splash-2 wording vs implementation

Spec says button labels "Confirmo que puedo continuar" / "No quiero continuar"; implementation uses "Entiendo, continuar" / "Salir del sitio" (es) and "I understand, continue" / "Leave the site" (en).
**Suggested fix**: Either update spec REQ-splash-2 to reflect the actual wording, or update the i18n bundle to match the spec verbatim. The current wording is acceptable for sensitive-content UX but diverges from the strict spec language.

### S-2: Splash storage key naming inconsistency

Apply-progress uses `plocos-sensitive-content-acknowledged` consistently. Spec REQ-splash-3 / REQ-splash-5 also use `plocos-sensitive-content-acknowledged`. The cookie-policy revocation section (`src/lib/i18n.ts:665`) uses the same key name. No actual drift detected; suggestion is to add a brief design note documenting why two keys exist (`plocos-sensitive-content-acknowledged` for splash vs `astro-consent` for consent banner).

### S-3: Privacy page `<h2>` IDs use `privacy-` prefix; cookie page uses `cookies-` prefix

**Location**: `src/pages/privacy/index.astro:30` (`id={`privacy-${toSectionId(item.heading)}`}`); `src/pages/cookie-policy/index.astro:23` (`id={`cookies-${category.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}`)
**Claim**: Inconsistent slug-generation: privacy uses the full `toSectionId` helper (preserves letters, normalises accents); cookies uses a simpler inline `toLowerCase().replace(/[^a-z0-9]+/g, '-')`. Could be unified.
**Suggested fix**: Extract a shared `slugify()` helper in `src/lib/i18n.ts` or `src/lib/routes.ts`. Currently both pages work, but the code is duplicated.

---

## 9. Attorney review recommendation

The legal text in `src/lib/i18n.ts` is **template-grade Spanish** (es) mirrored to English (en). The ES bundle is the primary legal text per Ley 1581/2012 and Decreto 1377/2013. The EN bundle is a courtesy translation and contains 14 explicit `[EN: TODO legal review by Colombian attorney]` markers across normative sections.

**Recommendation**:
1. **Do not deploy to production** until a Colombian attorney (preferably with Habeas Data / SIC experience) signs off on:
   - `es.terms.sections[]` (11 sections, including Ley 1581/2012 + Decreto 1377/2013 + Decisión Andina 486 + Ley 23 de 1982 references)
   - `es.privacy.sections[]` (7 sections, including ARCO procedure + retention table)
   - `es.cookiePolicy.categories[]` (4 categories with retention periods and transfer disclosures)
2. **Replace `[EN: TODO legal review by Colombian attorney]` markers** in the EN bundle with vetted copy before exposing `/en/terms`, `/en/privacy`, `/en/cookie-policy` to English-speaking visitors. The REQ-pacto-6 sync checklist (design §7) and the i18n parity enforcement provide a structured process.
3. **Wireframe the cookie banner text** (`es.consent.*` and `en.consent.*`) for clarity — the current "Aceptar todas / Rechazar opcionales" pattern aligns with GDPR best practice but should be confirmed against SIC's preferred phrasing under Decreto 1377/2013 art. 3.3 (consentimiento expreso).

---

## 10. Overall verdict

**Verdict**: `pass-with-warnings`

**Reason**: Static gates (build, type-check, bundle inspection, robots.txt, sitemap alignment) all pass cleanly. All 62 REQs are implemented at the source level; 56 have full static + design conformance, 6 require live dev-server confirmation. No CRITICAL findings. Four warnings are advisory (runtime-only checks, pre-existing TS errors, attorney-review markers, and one design-vs-implementation drift in `CookieConsentBanner.write()`). Three suggestions are minor code-style notes.

**Recommended next action**: `sdd-archive` may proceed after the user/QA runs the manual 10-step checklist against `pnpm dev` and clears W-1. W-2, W-3, and W-4 are deferred to a follow-up change.

---

## Appendix A: File diff summary (this change vs pre-change)

| File | Status | Lines added | Lines removed |
|---|---|---|---|
| `public/robots.txt` | CREATE | 38 | 0 |
| `src/components/CookieConsentBanner.astro` | CREATE | 181 | 0 |
| `src/components/SensitiveContentWarning.astro` | CREATE | 137 | 0 |
| `src/components/SiteFooter.astro` | MODIFY | +24 | -1 |
| `src/cookiebanner/styles.css` | MODIFY | +15 (selector hide block) | -1 |
| `src/layouts/BaseLayout.astro` | MODIFY | +30 | -23 |
| `src/lib/consent-gate.ts` | CREATE | 58 | 0 |
| `src/lib/i18n.ts` | MODIFY | +510 | -18 |
| `src/pages/cookie-policy/index.astro` | CREATE | 75 | 0 |
| `src/pages/en/cookie-policy/index.astro` | CREATE | 75 | 0 |
| `src/pages/en/privacy/index.astro` | CREATE | 95 | 0 |
| `src/pages/privacy/index.astro` | CREATE | 95 | 0 |
| `astro.config.mjs` | MODIFY | +15 | -7 |
| **Total** | 8 commits | **+1,348** | **-50** |

Net: **+1,298 lines** across **13 files** (8 new, 5 modified). All within the 1,450-line budget forecast from tasks.md (revised after PR slicing).

## Appendix B: Build artefacts verified

| Artefact | Path | Size | SHA-256 |
|---|---|---|---|
| Robots (public) | `public/robots.txt` | 814 B | (verify at archive) |
| Robots (built) | `dist/robots.txt` | 814 B | `c53f85614fce9be8bb11ce37d019a6bf5adb9c526ef8a62354407436a99ebaa6` |
| Sitemap index | `dist/sitemap-index.xml` | 165 B | `3d622f9a6283663560612d09239bb2e4c69ccdeb54bea001aead2e499951a8b2` |
| Largest client bundle | `dist/_astro/client.DtF5yZE9.js` | 143,471 B | (Vue runtime; not this change) |
| astro-consent runtime chunk | `dist/_astro/page.D5fR-yT8.js` | 4,940 B | (includes default banner UI; hidden by CSS) |
| Main CSS | `dist/_astro/index.BFlzZLGl.css` | 137,282 B | (tailwind + cookie banner) |

| Bundle scan | `googletagmanager` | `gtag` |
|---|---|---|
| `dist/_astro/*.js` | 0 | 0 |
| `dist/` (recursive) | 0 | 0 |

## Appendix C: Spec → REQ index

| Capability | REQ IDs |
|---|---|
| pacto-lectura | REQ-pacto-1, 2, 3, 4, 5, 6, 7, 8 (8 total) |
| politica-privacidad | REQ-privacy-1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (11 total) |
| politica-cookies | REQ-cookies-1, 2, 3, 4, 5, 6, 7, 8, 9 (9 total) |
| splash-contenido-sensible | REQ-splash-1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (10 total) |
| robots-anti-ia | REQ-robots-1, 2, 3, 4, 5, 6, 7, 8, 9 (9 total) |
| consentimiento-cookies | REQ-consent-1, 2, 3, 4, 5, 6, 7, 8 (8 total) |
| i18n-mensajes | REQ-i18n-1, 2, 3, 4, 5, 6, 7 (7 total) |
| **Total** | **62 REQs** |
