# Apply Progress: consentimiento-y-marco-legal

**Status**: WU 0–7 complete; ready for sdd-verify (verification by separate runner)
**Started**: 2026-08-20
**Mode**: auto-chain, stacked-to-main

---

## Work Unit 0 — pacto section alignment [RESOLVED]

**Task 0.1**: Align pacto §6–§11 with REQ-pacto-3 mandated topics

### Status
- [x] Acquire attempt: `sha256:a7fd3f3056df8276a8a5477135980792e8a280f86cc2e51785233737e4be3d9f` (state=proceed)
- [x] Identify mismatch: design covers 6 of 11 mandated topics
- [x] Surface canonical 11-section mapping to user
- [x] **User confirmed canonical 11-section mapping** (2026-08-20)
- [x] Settle attempt: request-id `wu0-pacto-settle`, outcome `passed`, state `complete`

### Canonical 11-section mapping (CONFIRMED)

1. Naturaleza y propósito editorial
2. Advertencia de contenido sensible
3. Edad mínima y capacidad
4. Suscripciones, pagos y reembolsos
5. Protección anti-IA y anti-scraping
6. Usos expresamente prohibidos
7. Revocación de acceso
8. Propiedad intelectual
9. Contribuciones, comentarios y moderación
10. Privacidad y datos personales (referencia a `/privacy`)
11. Ley aplicable y jurisdicción (Colombia)

### Note on drift vs design
Design §3 Capability 1 listed 6 sections and proposed "Revocación de consentimiento" as §7. User-confirmed mapping replaces "Revocación de consentimiento" with "Revocación de acceso" and reorders. Mapping persisted in Engram obs #67 and applied in WU 1 PR1.1.

---

## Work Units 1–7 — COMPLETE

| PR | Work Units | Tasks | Commit | Status |
|----|-----------|-------|--------|--------|
| PR0 (baseline) | scaffold | install astro-consent dep + cookiebanner styles | `c5f5f35` | ✅ Done |
| PR1.1 | WU 1 part 1 | 1.1 + 1.2 (es) + 1.4 es pacto sections | `47a9de9` | ✅ Done |
| PR1.2 | WU 1 part 2 | 1.3 (en) + 1.4 en pacto sections | `9f8707e` | ✅ Done |
| PR2 | WU 2 | 2.1, 2.2 (es legal pages) | `9a65b75` | ✅ Done |
| PR3 | WU 3 | 3.1, 3.2 (en legal pages) | `a01365f` | ✅ Done |
| PR4 | WU 4 | 4.1, 4.2 (anti-IA) | `30db904` | ✅ Done |
| PR5a | WU 5 | 5.1, 5.2 (splash) | `6be9e88` | ✅ Done |
| PR5b | WU 6 | 6.1–6.7 (cookie banner + GA gating) | `f4074a9` | ✅ Done |
| PR6 | WU 7 | 7.1, 7.2, 7.3 (verification) | pending | 🔵 In progress |

---

## WU 7 Verification Evidence (2026-08-20)

### Static checks
- `npx astro check` → 24 errors, **all pre-existing in `src/pages/blog/[...slug].astro`** (deprecated `getEntryBySlug` API). No new errors introduced by this change.
- `pnpm check:pages` → 24 errors (same set, pre-existing).
- `pnpm build` → build completes in ~11.5s. 8 router warnings, all pre-existing (`getStaticPaths()` ignored in dynamic pages — also `src/pages/blog/[...slug].astro` family). No new warnings.
- Build emits `dist/sitemap-index.xml` as expected; sitemap directive in robots.txt is aligned with `astro.config.mjs` site URL.

### Bundle inspection
- `grep -r "googletagmanager" dist/_astro/*.js` → **0 matches**. GA script is NOT in the initial bundle; only injected client-side when `window.astroConsent.get().categories.analytics === true`. This satisfies REQ-consent-3 / REQ-consent-4 (no GA without consent).

### i18n sync (es ↔ en) — Task 7.3
| Property | es | en | Match |
|----------|----|----|-------|
| `terms.sections.length` | 11 | 11 | ✅ |
| `privacy.sections.length` | 7 | 7 | ✅ |
| `cookiePolicy.categories.length` | 4 | 4 | ✅ |
| `privacy.contactEmail` | `expresatura@plocos.com` | `expresatura@plocos.com` | ✅ |
| `terms.sections[10].body` contains `Ley 1581/2012` | ✓ | ✓ | ✅ |
| `terms.sections[10].body` contains ARCO parenthetical `Access, Rectification, Cancellation, Opposition` | (es original) | ✓ | ✅ |
| `cookiePolicy.categories[2].cookies[*].name` includes `aind` and `_algolia_*` untranslated | ✓ | ✓ | ✅ |

### Manual 10-step checklist (Task 7.1) — Deferred to live site
Steps that require a running dev server are documented in `design.md §7`. The user (or QA) must:
1. `pnpm dev` → confirm splash, banner, accept works.
2. DevTools Network → verify no `googletagmanager.com` request before consent.
3. DevTools Application → confirm `localStorage["astro-consent"]` shape.
4. DevTools Application → confirm `localStorage["plocos-sensitive-content-acknowledged"] === "true"`.
5. With empty localStorage, confirm Esc does NOT close the splash.
6. Visit `/terminos`, `/en/terms`, `/privacidad`, `/en/privacy`, `/politica-de-cookies`, `/en/cookie-policy` → expect 200, locale-correct text.
7. `curl /robots.txt` → expect the file (already verified in `dist/robots.txt` after build).
8. Inspect `<head>` → expect `<meta name="robots" content="noai, noimageai">`.
9. `pnpm build` → no new warnings (verified).
10. `pnpm check:pages` → 0 errors (24 pre-existing remain; none introduced by this change).

### Selector verification (Task 7.2)
- `grep -r "BANNER_ID = \"astro-consent-banner\"" node_modules/astro-consent/dist/index.js` → matches at lines 46 and 108. Confirms the selector used in `src/cookiebanner/styles.css` (`#astro-consent-banner { display: none !important; }`) hides the integration's default banner.

### Known pre-existing errors (out of scope for this change)
All 24 errors are concentrated in `src/pages/blog/[...slug].astro` and stem from use of `getEntryBySlug`, which is deprecated in current Astro. They are unrelated to this change and should be addressed in a separate SDD change.

---

## Work Unit 8 — sdd-archive [STOPPED per orchestrator instruction]

Per orchestrator instruction ("WU 8 — STOP. Do NOT run sdd-archive. Just close the apply-progress with `next_recommended: sdd-verify`"), this work unit is intentionally NOT acquired and NOT executed in this apply session.

- **next_recommended: sdd-verify**
- **Do NOT run sdd-archive from this session.**
- Archive (delta spec sync to `openspec/specs/*`) must be handled by a separate sdd-archive worker after sdd-verify passes.

---

## Slicing decision (WU 1 split into PR1.1 + PR1.2)

Per orchestrator instruction: WU 1 alone is ~575 lines, exceeds 400-line budget. Split into:

- **PR1.1** (Tasks 1.1 + 1.2 + 1.4 es): extend `Translation` interface, populate `es` bundle with new sections (privacy, cookiePolicy, splash, consent, footer.manageCookies), expand `es.terms.sections` to 11 entries. Final: +272/-14 (286 net).
- **PR1.2** (Tasks 1.3 + 1.4 en): mirror all new sections in `en` bundle, expand `en.terms.sections` to 11 entries. Final: +226/-16 (242 net).

`pnpm check:pages` failed between PR1.1 and PR1.2 by design (en bundle intentionally incomplete). PR1.2 closes the type contract.

---

## Legal review status

Each non-trivial normative clause in the **en** bundle is marked with `[EN: TODO legal review by Colombian attorney]` so a future PR can replace template language with attorney-vetted copy before production deploy. This applies to sections 1, 2, 3, 4, 5, 7, 8, 9, and 11 of `en.terms.sections`. Section 6 (expressly prohibited uses) keeps the existing bullet list; section 10 (privacy pointer) preserves Ley 1581/2012 + ARCO parenthetical verbatim.