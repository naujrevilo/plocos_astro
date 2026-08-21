# Specs Index — `consentimiento-y-marco-legal`

Delta specifications for the Ley 1581/2012 compliance, anti-AI hardening, and consent-gated analytics change.

| Capability | Type | Purpose |
|---|---|---|
| `pacto-lectura` | NEW | Replaces generic `/terminos` text with the client's mandated 11-section pacto de lectura (es + en). |
| `politica-privacidad` | NEW | `/privacy` policy compliant with Ley 1581/2012 — controller, purposes, ARCO rights, transfers, retention. |
| `politica-cookies` | NEW | `/cookie-policy` inventory of cookies by category (necesarias, analítica, búsqueda, anti-IA info). |
| `splash-contenido-sensible` | NEW | Pre-cookie modal that gates first visit with two buttons (acknowledge / exit). |
| `robots-anti-ia` | NEW | `public/robots.txt` blocking GPTBot/ClaudeBot/CCBot/etc. + `<meta name="robots" content="noai, noimageai">` site-wide. |
| `consentimiento-cookies` | MODIFIED | Migrates `astroConsent()` labels to `getTranslations(locale)` and gates GA4 on `analytics` consent. |
| `i18n-mensajes` | MODIFIED | Adds `privacy`, `cookiePolicy`, `splash`, `consent`, `footer.manageCookies` sections; enforces es ↔ en parity. |

## Open questions — resolutions

1. **Splash persistence** — localStorage with key `plocos-sensitive-content-acknowledged`, no TTL. Explicit dismissal only; Esc and X SHALL NOT dismiss (see `splash-contenido-sensible` REQ-splash-2, REQ-splash-5, REQ-splash-7).
2. **Negative-button behaviour** — navigates to `about:blank` to close the experience without showing alternative content (see `splash-contenido-sensible` REQ-splash-4).
3. **Algolia status** — ACTIVE (`PUBLIC_ALGOLIA_*` env vars present; `Search.vue` initialises `algoliasearch/lite`). Cookie policy SHALL list Algolia cookies (see `politica-cookies` REQ-cookies-3).
4. **ARCO procedure** — email to `expresatura@plocos.com` is the sole required channel; the contact form on `/contacto` MAY be used but is optional. SLAs per Ley 1581 art. 14: 10 business days for consultas, 15 for reclamos (see `politica-privacidad` REQ-privacy-5, REQ-privacy-6, REQ-privacy-9).
5. **Bilingual parity** — TypeScript-enforced via the `Translation` union type. A manual sync checklist SHALL be documented in the design phase (see `i18n-mensajes` REQ-i18n-2, REQ-i18n-5, REQ-i18n-6, and `pacto-lectura` REQ-pacto-6).
6. **Robots enforcement depth** — `robots.txt` + meta `noai, noimageai` ONLY. `X-Robots-Tag` HTTP header is out of scope for this change (see `robots-anti-ia` REQ-robots-7).
7. **`/en/terms` retention** — KEPT. The pacto page renders in both locales; deleting the en mirror would create an i18n fallback to the es content, which violates the "no auto-translation of legal text" rule (see `pacto-lectura` REQ-pacto-1, REQ-pacto-6).

## Spec artifacts

- `pacto-lectura/spec.md`
- `politica-privacidad/spec.md`
- `politica-cookies/spec.md`
- `splash-contenido-sensible/spec.md`
- `robots-anti-ia/spec.md`
- `consentimiento-cookies/spec.md`
- `i18n-mensajes/spec.md`

## Next step

Ready for `sdd-design`. Design phase will lock in: i18n key shapes, `astroConsent` integration approach (the library's labels API vs. a wrapper), GA4 client-side gating script, splash modal accessibility, and the manual es ↔ en sync checklist.
