# Specs Index — `plocos_astro`

Active capabilities (source of truth). Each capability is the merged result of every delta that has touched it; this directory is read by the sdd-spec phase when authoring new changes, and by consumers (templates, components, tests) at runtime.

| Capability | Type | Source | Purpose |
|---|---|---|---|
| `pacto-lectura` | MODIFIED | `pacto-cliente-y-autonomia-contenido` (2026-09-05) | Replaces 11-section pacto with the client's mandated 8-section pacto de lectura (I–VIII, es verbatim + en translation, dated 2 de septiembre de 2026). SHA-256 byte-level preservation enforced via `pnpm verify:pacto`. |
| `politica-privacidad` | NEW | `consentimiento-y-marco-legal` (2026-08-20) | `/privacy` policy compliant with Ley 1581/2012 — controller, purposes, ARCO rights, transfers, retention. |
| `politica-cookies` | NEW | `consentimiento-y-marco-legal` (2026-08-20) | `/cookie-policy` inventory of cookies by category (necesarias, analítica, búsqueda, anti-IA info). |
| `splash-contenido-sensible` | NEW | `consentimiento-y-marco-legal` (2026-08-20) | Pre-cookie modal that gates first visit with two buttons (acknowledge / exit). |
| `robots-anti-ia` | NEW | `consentimiento-y-marco-legal` (2026-08-20) | `public/robots.txt` blocking GPTBot/ClaudeBot/CCBot/etc. + `<meta name="robots" content="noai, noimageai">` site-wide. |
| `consentimiento-cookies` | MODIFIED | `consentimiento-y-marco-legal` (2026-08-20) | Migrates `astroConsent()` labels to `getTranslations(locale)` and gates GA4 on `analytics` consent. |
| `i18n-mensajes` | MODIFIED | `consentimiento-y-marco-legal` (2026-08-20) + `pacto-cliente-y-autonomia-contenido` (2026-09-05) | Adds `privacy`, `cookiePolicy`, `splash`, `consent`, `footer.manageCookies`, `av.collection`, `editor` sections; pacto body sourced from JSON; enforces es ↔ en parity. |

## Provenance

Every `spec.md` in this directory carries YAML frontmatter identifying the change it was last archived from:

```yaml
---
status: active
archived_from: <change-name>
date_archived: YYYY-MM-DD
---
```

When a future change modifies a capability, `sdd-archive` writes the new merged spec with an updated `archived_from` and `date_archived`. The delta lives in `openspec/changes/<change-name>/specs/<capability>/spec.md` until that change is archived.

## Active capabilities count

7. Two (`pacto-lectura`, `i18n-mensajes`) carry deltas from `pacto-cliente-y-autonomia-contenido` (2026-09-05); the other five are unchanged from `consentimiento-y-marco-legal`. Two proposed capabilities (`cms-editorial-unificado`, `coleccion-audiovisuales`) from the same change were scoped out before apply and are not part of the active spec store.
