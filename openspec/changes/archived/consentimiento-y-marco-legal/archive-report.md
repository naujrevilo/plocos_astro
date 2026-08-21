---
change: consentimiento-y-marco-legal
date_archived: 2026-08-20
executor: sdd-archive
mode: auto
artifact_store: both
status: closed-ok-with-warnings
verdict_source: openspec/changes/archived/consentimiento-y-marco-legal/verify-report.md
git_head: f4074a9
---

# Archive Report: consentimiento-y-marco-legal

## Summary

| Field | Value |
|---|---|
| Change | `consentimiento-y-marco-legal` |
| Mode | auto-chain, stacked-to-main |
| Project | `plocos_astro` |
| Workspace | `F:\projects\plocos_astro` |
| Repository | `https://github.com/naujrevilo/plocos_astro.git` (origin, unpushed as of close) |
| Branch | `main` |
| Git HEAD | `f4074a9` |
| Date opened | 2026-08-20 |
| Date archived | 2026-08-20 |
| Locale | es-CO (primary), en (fallback) |
| Jurisdiction | Colombia — Ley 1581/2012, Decreto 1377/2013, SIC |
| Executor | sdd-archive sub-agent (manual launch) |
| Status | **closed-ok-with-warnings** (intentional) |
| Final verdict | pass-with-warnings — 0 critical / 4 warnings / 3 suggestions (per verify-report.md obs #70, written 2026-08-20) |

The change is closed. No CRITICAL findings block archive. Four warnings are advisory and deferred to follow-up changes; the user has explicit, recorded intent to ship as-is.

## Capabilities added or modified

Seven capabilities (5 NEW + 2 MODIFIED). Source-of-truth specs now live at `openspec/specs/<capability>/spec.md`.

| # | Capability | Type | One-line purpose |
|---|---|---|---|
| 1 | `pacto-lectura` | NEW | 11-section pacto de lectura on `/terminos` + `/en/terms` (Colombian jurisdiction, replaces generic terms). |
| 2 | `politica-privacidad` | NEW | `/privacy` + `/en/privacy` policy under Ley 1581/2012 — controller, ARCO rights, transfers, retention. |
| 3 | `politica-cookies` | NEW | `/cookie-policy` + `/en/cookie-policy` inventory by category (necesarias, analítica, búsqueda, anti-IA info). |
| 4 | `splash-contenido-sensible` | NEW | Pre-cookie modal gating first visit (two buttons, localStorage `plocos-sensitive-content-acknowledged`). |
| 5 | `robots-anti-ia` | NEW | `public/robots.txt` blocking 8 AI crawlers + `<meta name="robots" content="noai, noimageai">` site-wide. |
| 6 | `consentimiento-cookies` | MODIFIED | `astroConsent()` labels sourced from i18n bundle; GA4 gated client-side on `analytics` consent. |
| 7 | `i18n-mensajes` | MODIFIED | `Translation` interface gains `privacy`, `cookiePolicy`, `splash`, `consent`, `footer.manageCookies`. |

**Source-of-truth specs now in `openspec/specs/`:**

```
openspec/specs/index.md
openspec/specs/pacto-lectura/spec.md
openspec/specs/politica-privacidad/spec.md
openspec/specs/politica-cookies/spec.md
openspec/specs/splash-contenido-sensible/spec.md
openspec/specs/robots-anti-ia/spec.md
openspec/specs/consentimiento-cookies/spec.md
openspec/specs/i18n-mensajes/spec.md
```

Each `spec.md` carries YAML frontmatter (`status: active`, `archived_from: consentimiento-y-marco-legal`, `date_archived: 2026-08-20`). Delta content is byte-identical to the source spec (verified via SHA-256 strip-and-compare; 7/7 OK).

## Commits produced

8 commits on `main`, range `c5f5f35..f4074a9`:

| # | Commit | Conventional subject |
|---|---|---|
| PR0 | `c5f5f35` | chore(deps): install astro-consent integration and cookie banner styles |
| PR1.1 | `47a9de9` | feat(i18n): add es translations for privacy, cookies, splash, consent and expand pacto to 11 sections |
| PR1.2 | `9f8707e` | feat(i18n): mirror en translations for privacy, cookies, splash, consent and expand pacto to 11 sections |
| PR2 | `9a65b75` | feat(legal-pages): create Spanish `/privacidad` and `/politica-de-cookies` pages |
| PR3 | `a01365f` | feat(legal-pages): create English `/en/privacy` and `/en/cookie-policy` pages |
| PR4 | `30db904` | feat(robots): block 8 AI crawlers in robots.txt and add noai meta tag to BaseLayout |
| PR5a | `6be9e88` | feat(splash): add sensitive-content warning modal before SiteHeader |
| PR5b | `f4074a9` | feat(consent): custom re-render of cookie banner with i18n labels + GA gating |

Verify-record commit (PR6 doc-only) is recorded in `apply-progress.md` but the docs commit itself was rolled into the work-unit evidence (per apply-progress note: WU 7 verification evidence captured in apply-progress.md, not as a separate commit).

## Files created or modified

Per `verify-report.md` Appendix A (final state):

| File | Status | Lines | Purpose |
|---|---|---|---|
| `public/robots.txt` | CREATE | 38 | Blocks 8 AI crawlers + Sitemap directive |
| `src/components/CookieConsentBanner.astro` | CREATE | 181 | Custom i18n-driven cookie banner |
| `src/components/SensitiveContentWarning.astro` | CREATE | 137 | Sensitive-content splash modal |
| `src/components/SiteFooter.astro` | MODIFY | +24/-1 | "Manage cookies" footer link → `astroConsent.reset()` |
| `src/cookiebanner/styles.css` | MODIFY | +15/-1 | Hide integration default banner via `#astro-consent-banner` |
| `src/layouts/BaseLayout.astro` | MODIFY | +30/-23 | `<meta name="robots" noai,noimageai>` + splash + banner + GA gating IIFE |
| `src/lib/consent-gate.ts` | CREATE | 58 | `gateScriptOnConsent(category, src, attrs?)` reusable helper |
| `src/lib/i18n.ts` | MODIFY | +510/-18 | Translation interface + es/en bundles extended for 5 new sections |
| `src/pages/cookie-policy/index.astro` | CREATE | 75 | es cookie-policy page |
| `src/pages/en/cookie-policy/index.astro` | CREATE | 75 | en cookie-policy page |
| `src/pages/en/privacy/index.astro` | CREATE | 95 | en privacy-policy page |
| `src/pages/privacy/index.astro` | CREATE | 95 | es privacy-policy page |
| `astro.config.mjs` | MODIFY | +15/-7 | `astroConsent()` config slimmed; i18n provides labels |
| **Total** | 8 commits | **+1,348 / -50** | 13 files (8 new, 5 modified), net **+1,298 lines** |

## Verification verdict (final state)

**Verdict**: `pass-with-warnings` (per `verify-report.md` obs #70, dated 2026-08-20).

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| WARNING | 4 |
| SUGGESTION | 3 |

**Requirements**: 56/62 satisfied (full evidence), 6 PARTIAL (runtime-only — need live dev server).

### CRITICAL issues
**None.** Archive proceeds.

### Warnings (advisory, deferred to follow-up changes)

- **W-1 — 6 REQs require live dev-server validation.** REQ-splash-5, REQ-splash-8, REQ-robots-5, REQ-consent-2, REQ-consent-3, REQ-consent-5. Static source is correct; localStorage/IIFE/runtime behaviour must be verified against the design §7 10-step manual checklist (`pnpm dev`).
- **W-2 — 24 pre-existing `astro check` errors.** Concentrated in `src/pages/blog/[...slug].astro` (22) + `src/pages/api/comments.ts` (2). All stem from deprecated `getEntryBySlug` usage; predates this change. Net delta is **−22** errors (46 → 24) as the apply run completed i18n parity. Out of scope; separate SDD change required.
- **W-3 — 14 `[EN: TODO legal review by Colombian attorney]` markers** in `src/lib/i18n.ts` (es↔en normative clauses). Attorney sign-off required before production deploy. See `apply-progress.md §"Legal review status"` for marker inventory.
- **W-4 — `CookieConsentBanner.write()` duplicates consent persistence logic** instead of calling `window.astroConsent.set()`. Functional (same key, compatible payload) but creates two code paths that can drift. Refactor opportunity for follow-up.

### Suggestions (minor, non-blocking)

- **S-1** — Spec REQ-splash-2 wording vs implementation (button labels differ). Either spec or i18n should be aligned.
- **S-2** — Splash storage key naming inconsistency (two keys: `plocos-sensitive-content-acknowledged` for splash vs `astro-consent` for consent banner). Add a design note documenting why both exist.
- **S-3** — Privacy page `<h2>` IDs use `privacy-` prefix; cookie page uses `cookies-` prefix. Extract a shared `slugify()` helper.

## Open items (handoff to user)

These are NOT archive blockers; they are the user's production-readiness checklist.

1. **14 EN normative clauses need attorney review.** Markers `grep -c "\[EN: TODO legal review by Colombian attorney\]" src/lib/i18n.ts` returns 14 across `en.terms.sections` and `en.privacy.sections`. Production deploy gate.
2. **24 pre-existing `astro check` errors** in `src/pages/blog/[...slug].astro` + `src/pages/api/comments.ts` (deprecated `getEntryBySlug`). Track in a separate SDD change.
3. **`pnpm.overrides` block was removed from `package.json` during apply** (defensive — restore if build environment shows version-drift regressions). Per apply-progress — flagged for the user to monitor.
4. **Safari private-mode localStorage write fails** — splash never dismisses for those visitors (graceful failure mode; intentional). Document for support team.
5. **6 REQs need live dev-server validation** via the 10-step manual checklist (design §7). Run `pnpm dev` and walk through the checklist:
   - splash first-visit, acknowledge persists in `localStorage["plocos-sensitive-content-acknowledged"] = "true"`
   - GA absent before consent; present after (DevTools Network)
   - `/terminos`, `/en/terms`, `/privacy`, `/en/privacy`, `/cookie-policy`, `/en/cookie-policy` all 200 with locale-correct text
   - `/robots.txt` returns the file
   - `<meta name="robots" content="noai, noimageai">` present in `<head>` of every page
   - Cookie banner: accept → `localStorage["astro-consent"]` = `{categories:{analytics:true,...}}`
   - Footer "Manage cookies" re-opens the banner
   - Esc does NOT close the splash

## Push instructions

8 commits are on `main` locally (range `c5f5f35..f4074a9`). The repository `origin` is at:

```
https://github.com/naujrevilo/plocos_astro.git
```

To push:

```bash
git push origin main
```

The user must push to `origin` manually. This archive worker does NOT push (per the launch prompt and standard sdd-archive contract).

## Reconciliation note (archive-time)

This archive proceeded despite stale unchecked implementation task acceptance criteria in `tasks.md`. Per the launch prompt's explicit override ("approve archive-time stale-checkbox reconciliation backed by apply-progress/verify-report proof"):

- **Reason**: `apply-progress.md` (obs #68, written 2026-08-20) records WU 0–7 complete with per-task commit evidence; `verify-report.md` (obs #70) records 56/62 REQs satisfied and 0 CRITICAL findings. The unchecked acceptance boxes in `tasks.md` are stale by-products of the per-task acceptance-criteria format (each task lists its own checkboxes; `sdd-apply` does not currently mark them).
- **Proof**: 8 commits (c5f5f35 → f4074a9) directly correspond to the 8 work units in `tasks.md` (PR0 baseline + PR1.1/1.2 split + PR2 + PR3 + PR4 + PR5a + PR5b).
- **Recording**: this reconciliation is intentional and is marked `closed-ok-with-warnings`. No silent reconciliation.

## Final state and handoff

```yaml
status: closed-ok-with-warnings
next_recommended: change-closed (await user action)
required_user_actions:
  - "git push origin main  # push 8 commits to GitHub"
  - "Schedule Colombian attorney review of en.terms.sections + en.privacy.sections (14 [EN: TODO] markers)"
  - "Run design §7 10-step manual checklist against pnpm dev"
  - "Decide on production deploy gate (depends on attorney sign-off)"
open_followups:
  - "Track 24 pre-existing astro check errors (blog/[...slug].astro + api/comments.ts) in a separate SDD change"
  - "Track pnpm.overrides restoration decision (defensive removal during apply)"
  - "Consider refactoring CookieConsentBanner.write() to delegate to window.astroConsent.set() (W-4)"
```

**The SDD cycle for `consentimiento-y-marco-legal` is complete.** Ready for the next change.

---

## Engram observation IDs read for traceability

| ID | Type | Topic | Persisted |
|---|---|---|---|
| #61 | architecture | `sdd/consentimiento-y-marco-legal/proposal` | 2026-08-20 18:25:23 |
| #62 | architecture | `sdd/consentimiento-y-marco-legal/specs` | 2026-08-20 18:30:00 |
| #63 | architecture | `sdd/consentimiento-y-marco-legal/design` | 2026-08-20 18:34:34 |
| #64 | architecture | `sdd/consentimiento-y-marco-legal/tasks` | 2026-08-20 18:40:20 |
| #65 | config | `preflight + chain strategy` | 2026-08-20 19:34:57 |
| #66 | discovery | `sdd-apply launch blocked by client runtime depth limit` | 2026-08-20 19:41:35 |
| #67 | decision | `W1 BLOCKER — pacto 11-section mapping decision pending` (SUPERSEDED by #68) | 2026-08-20 19:43:59 |
| #68 | decision | `sdd/consentimiento-y-marco-legal/apply-progress — WU 2-7 complete` | 2026-08-20 19:57:57 |
| #70 | architecture | `sdd/consentimiento-y-marco-legal/verify-report` | 2026-08-20 20:20:24 |

The archive report observation itself will be persisted at `sdd/consentimiento-y-marco-legal/archive-report` after this write.

---

## Archive mechanics

| Check | Result |
|---|---|
| Specs synced to `openspec/specs/` (5 NEW + 2 MODIFIED) | ✅ |
| Spec byte-identity verified (SHA-256, strip-and-compare) | ✅ 7/7 OK |
| `openspec/specs/index.md` created | ✅ |
| Change folder moved to `openspec/changes/archived/` | ✅ |
| `diff -r` snapshot vs. archive folder | ✅ EMPTY DIFF (13/13 files identical) |
| Source `openspec/changes/consentimiento-y-marco-legal/` removed | ✅ |
| Archive report written (this file) | ✅ |
| Archive report persisted to Engram | ⏳ (next step) |
