# Design: Consentimiento y Marco Legal

## 1. Resumen ejecutivo

Este cambio convierte la base legal y de consentimiento de Plocos en una pieza normativa alineada con la Ley 1581/2012 y el Decreto 1377/2013 (autoridad SIC), endurece el archivo contra scraping para entrenamiento de IA, y cierra la fuga de GA4 sin consentimiento. Cubre cinco capacidades: pacto de lectura de 11 secciones en `/terminos` + `/en/terms`, política de privacidad en `/privacy` + `/en/privacy`, política de cookies en `/cookie-policy` + `/en/cookie-policy`, splash de contenido sensible previo al banner, y hardening anti-IA (`public/robots.txt` + meta `noai,noimageai` en `BaseLayout.astro`). Modifica `astroConsent()` para leer etiquetas desde `getTranslations(locale).consent` (manteniendo el runtime API para gating de GA4) y extiende `src/lib/i18n.ts` con cinco secciones nuevas (`privacy`, `cookiePolicy`, `splash`, `consent`, `footer.manageCookies`) bajo paridad es↔en enforced a nivel de tipos.

## 2. Arquitectura general

### Diagrama de flujo

```
                        ┌──────────────────────────────┐
                        │  BaseLayout.astro (server)   │
                        │  • meta robots noai,noimageai│
                        │  • theme detection inline    │
                        │  • GA4 gating script (inline)│
                        └─────────────┬────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────────┐
                        │  <body>                      │
                        │  ┌────────────────────────┐  │
                        │  │ SensitiveContent       │  │  ← client mount
                        │  │ Warning.astro          │  │
                        │  │ (vaneo, <dialog>)      │  │
                        │  │ localStorage key:      │  │
                        │  │ plocos-sensitive-...   │  │
                        │  └────────────────────────┘  │
                        │  ┌────────────────────────┐  │
                        │  │ CookieConsentBanner    │  │  ← client mount, lee
                        │  │ .astro (custom)        │  │     getTranslations(locale)
                        │  │ usa window.astroConsent│  │
                        │  │ .set() para persistir  │  │
                        │  └────────────────────────┘  │
                        │  ┌────────────────────────┐  │
                        │  │ astroConsent(integration)│  │  ← banner hideado por CSS,
                        │  │ solo expone runtime API │  │     provee get/set/reset
                        │  └────────────────────────┘  │
                        │  ┌────────────────────────┐  │
                        │  │ GA4 loader script      │  │  ← inyecta solo si
                        │  │ → inyecta <script async>│  │     window.astroConsent.get()
                        │  │   googletagmanager.com │  │     .categories.analytics === true
                        │  └────────────────────────┘  │
                        └──────────────────────────────┘
```

### Mapa de archivos

| Acción | Ruta | Propósito |
|--------|------|-----------|
| CREATE | `public/robots.txt` | Bloquea 8 user-agents de IA + apunta a sitemap |
| CREATE | `src/components/SensitiveContentWarning.astro` | Modal pre-cookie, vanilla `<dialog>` + inline JS con focus trap |
| CREATE | `src/components/CookieConsentBanner.astro` | Re-render i18n del banner; usa `window.astroConsent.set()` |
| CREATE | `src/lib/consent-gate.ts` | Helper `gateScriptOnConsent(category, src)` para terceros |
| CREATE | `src/lib/astro-consent-labels.ts` | Etiquetas es/en del banner (consumido en config y en componente) |
| CREATE | `src/pages/privacy/index.astro` | Página es — política de privacidad |
| CREATE | `src/pages/en/privacy/index.astro` | Página en — política de privacidad |
| CREATE | `src/pages/cookie-policy/index.astro` | Página es — inventario de cookies |
| CREATE | `src/pages/en/cookie-policy/index.astro` | Página en — inventario de cookies |
| MODIFY | `astro.config.mjs` | Quitar labels hardcodeados; pasar `siteName`, `cookiePolicyUrl`, `privacyPolicyUrl`, `consent` solo |
| MODIFY | `src/lib/i18n.ts` | Agregar `privacy`, `cookiePolicy`, `splash`, `consent`, `footer.manageCookies` |
| MODIFY | `src/layouts/BaseLayout.astro` | Añadir meta `noai,noimageai`, importar `SensitiveContentWarning` + `CookieConsentBanner`, reemplazar `<GoogleAnalytics>` con gating script |
| MODIFY | `src/components/SiteFooter.astro` | Añadir link "Gestionar cookies" → `window.astroConsent.reset()` |
| MODIFY | `src/pages/terminos/index.astro` | Sin cambio de template; los datos nuevos vienen de `terms.sections` (más largo) |
| MODIFY | `src/pages/en/terms/index.astro` | Idem |
| MODIFY | `src/cookiebanner/styles.css` | Añadir regla `display:none` para el banner default de la integración |

### Decisión clave: ¿custom re-render del banner?

**Decisión**: CUSTOM RE-RENDER. La integración `astro-consent` v2.0.0 acepta `headline`, `description`, `acceptLabel`, `rejectLabel`, `manageLabel` en el constructor, pero esos valores se evalúan UNA SOLA VEZ al cargar `astro.config.mjs` — no por request ni por locale. La spec exige paridad es↔en (REQ-i18n-1/2) y ARIA labels en idioma activo (REQ-splash-7, REQ-consent-1). Pasar labels en español rompería la paridad para visitantes EN; pasarlos en inglés rompería el caso primario es.

**Solución**: configurar `astroConsent()` solo con `siteName`, `cookiePolicyUrl`, `privacyPolicyUrl`, `consent: { days: 30, storageKey: "astro-consent" }` (sin labels). El banner default de la integración se oculta vía una regla en `src/cookiebanner/styles.css` (`#cb-banner-host, [data-astro-consent-banner] { display: none !important; }` — selector exacto a confirmar en implementación mirando el DOM de la integración). El runtime API (`window.astroConsent.{get,set,reset}`) sigue expuesto y funcional. El componente custom `src/components/CookieConsentBanner.astro` se monta en `<body>`, lee `getTranslations(locale).consent.*`, renderiza dos botones (`Aceptar`, `Rechazar`), y al hacer click llama `window.astroConsent.set({ essential: true, analytics: <state> })`. La paridad i18n se cumple; la lógica de storage y expiración la da astro-consent.

**Wiring de locale en `astro.config.mjs`**: no se llama `getTranslations(locale)` desde el config — el config solo necesita los URLs de las páginas (estáticas, independientes del locale). Las etiquetas dinámicas van en `src/components/CookieConsentBanner.astro` que sí tiene acceso a `Astro.currentLocale` per-request.

## 3. Decisiones técnicas por capability

### Capability 1: `pacto-lectura` (NEW)

- **Archivos**: `src/pages/terminos/index.astro` (sin cambios estructurales), `src/pages/en/terms/index.astro` (idem), `src/lib/i18n.ts` (datos).
- **Forma**: el template actual renderiza `terms.sections.map(...)` con `heading`/`body`/`bullets`. Sólo se reemplaza `es.terms.sections` y `en.terms.sections` para que tengan 11 elementos en lugar de 6. Id de sección: `terms-${toSectionId(heading)}` (ya existe en el template).
- **Data flow**: `Astro.currentLocale` → `getTranslations(locale)` → `terms.sections` → render.
- **Edge cases**: (1) si `sections.length === 0` el render es vacío (no error); (2) bullets opcionales manejados con guard; (3) `Astro.currentLocale` cae a `defaultLocale` (`es`) si no está definido; (4) en caso de i18n fallback `en→es`, REQ-pacto-1 + REQ-pacto-6 prohíben el fallback automático para esta ruta — por eso `src/pages/en/terms/index.astro` existe como page real.
- **Failure modes**: si `terms.sections` no es array (regresión i18n), el template rompe en build (TypeScript detecta). Si falta key en `en`, `astro check` falla.
- **Out-of-scope**: la UI de moderación de comentarios se referencia pero no construye.

#### Las 6 secciones faltantes (es, ~180 palabras total)

```
{"heading":"Suscripción y comunicaciones","body":"Si el visitante opta por suscribirse a comunicaciones del archivo, su correo se utiliza exclusivamente para el envío de boletines editoriales y avisos de actualización. Puede cancelar la suscripción en cualquier momento mediante el enlace presente en cada mensaje o escribiendo a " + EMAIL + ". No cedemos direcciones a terceros ni incorporamos listas de marketing."}

{"heading":"Protección anti-IA","body":"El contenido del archivo se publica para consulta humana. Queda prohibida la recolección, copia o reutilización del material con el fin de entrenar, ajustar o evaluar modelos de inteligencia artificial, ya sea de forma directa o mediante intermediarios. Robots y rastreadores de IA conocidos son bloqueados en sentido expreso."}

{"heading":"Revocación de consentimiento","body":"El visitante puede revocar en cualquier momento los consentimientos otorgados: (a) reabriendo el panel de preferencias con el enlace «Gestionar cookies» del pie de página, (b) eliminando la clave «astro-consent» del almacenamiento local del navegador, o (c) contactando a " + EMAIL + ". La revocación no tiene efectos retroactivos."}

{"heading":"Propiedad intelectual y derechos de autor","body":"Las obras son de autoría del editor o de los colaboradores acreditados. Cualquier reproducción total o parcial requiere cita de fuente, preservación de la integridad de la pieza y autorización escrita previa, salvo los usos de citación honesta reconocidos por la legislación colombiana."}

{"heading":"Ley aplicable y jurisdicción","body":"Las condiciones de uso se rigen por la legislación de la República de Colombia. Cualquier controversia se somete a los jueces y tribunales competentes de Cartagena de Indias, sin perjuicio de los derechos del consumidor que la ley otorgue al visitante."}

{"heading":"Contribuciones, comentarios y moderación","body":"Los aportes enviados pasan por moderación editorial antes de publicarse. El editor puede ajustar estilo, retirar contenido que vulnere estos términos o responder a los aportes. El envío implica que quien comenta cuenta con los permisos necesarios sobre el material remitido."}
```

(Implementación: email se interpola en build con `contact.email` desde `src/data/contact.json` o la traducción existente; en este diseño usamos la constante `expresatura@plocos.com` literal para no introducir dependencia runtime.)

### Capability 2: `politica-privacidad` (NEW)

- **Archivos**: `src/pages/privacy/index.astro`, `src/pages/en/privacy/index.astro` (ambos nuevos), `src/lib/i18n.ts`.
- **Forma**: misma plantilla que `terminos/index.astro` pero renderizando `privacy.sections` con shape `{ heading, body, bullets? }`. Página plana, no requiere frameworks.
- **Data flow**: locale → `privacy.{metaTitle, metaDescription, sections, retention[], contactEmail, responseTimelines}` → render.
- **Edge cases**: (1) tabla de retención como `privacy.retention: { category: string; period: string }[]`; (2) email ARCO desde `src/data/contact.json` (`expresatura@plocos.com`) — si `contact.json` cambia, la página debe rebuildear; (3) las dos páginas DEBEN ser archivos reales (no fallback) — confirmado en §6 (rollback).
- **Failure modes**: si `astro check` no detecta la ruta en, cae a fallback `en→es` (prohibido por REQ-privacy-1); el preventivo es crear el archivo físicamente.
- **Out-of-scope**: formulario de solicitud ARCO dedicado (REQ-privacy-9 permite solo email).

### Capability 3: `politica-cookies` (NEW)

- **Archivos**: `src/pages/cookie-policy/index.astro`, `src/pages/en/cookie-policy/index.astro`.
- **Forma**: render de `cookiePolicy.categories[]` con shape `{ heading, description, cookies: { name, provider, purpose, duration, party: "first" | "third" }[] }`. Cuatro categorías: necesarias, analítica, búsqueda (Algolia), protección anti-IA (informativa, sin cookies).
- **Data flow**: locale → `cookiePolicy.{metaTitle, metaDescription, intro, categories, updatedLabel, updatedValue, revocation}` → render.
- **Algolia**: cookies `aind`, `_algolia_*` (duración: persistente hasta 1 año en cliente Algolia; tipo: tercero). Si en el futuro se quita Algolia, el bundle de translations puede eliminar la categoría y el template la omite sin guards (REQ-cookies-3).
- **Edge cases**: (1) categoría anti-IA es informativa, `cookies: []` válido; (2) nombres de cookie se preservan literalmente en `en` (REQ-cookies-7 — no se traduce `aind`).
- **Failure modes**: si el template hace hardcode de "4 categorías" y el bundle trae 3, rompe el build (TypeScript detecta).
- **Out-of-scope**: la integración `astroConsent` no debe depender de la existencia de esta ruta (REQ-cookies-9); los URLs en `astro.config.mjs` funcionan aunque la página 404 (es cosmetic, no crash).

### Capability 4: `splash-contenido-sensible` (NEW)

- **Archivos**: `src/components/SensitiveContentWarning.astro` (nuevo), `src/lib/i18n.ts` (datos), `src/layouts/BaseLayout.astro` (import).
- **Tecnología elegida**: **vanilla `<dialog>` + inline JS**. No se justifica Vue/React para un modal que se monta una vez en la vida del visitante. El `<dialog>` element da focus trap nativo, `aria-modal` automático, y `Esc` por default — el último se DEBE interceptar porque REQ-splash-7 prohíbe dismissal por Esc.
- **Forma**:

```astro
---
import { defaultLocale, getTranslations, type Locale } from "../lib/i18n";
const locale = (Astro.currentLocale ?? defaultLocale) as Locale;
const splash = getTranslations(locale).splash;
---
<sensitive-splash data-acknowledged-key="plocos-sensitive-content-acknowledged">
  <dialog id="plocos-splash" role="dialog" aria-modal="true"
          aria-labelledby="splash-title" aria-describedby="splash-body"
          class="splash-dialog">
    <h2 id="splash-title">{splash.title}</h2>
    <p id="splash-body">{splash.body}</p>
    <form method="dialog" class="splash-actions">
      <button type="submit" data-action="acknowledge" class="splash-btn-primary">
        {splash.acknowledge}
      </button>
      <button type="button" data-action="exit" class="splash-btn-secondary">
        {splash.reject}
      </button>
    </form>
  </dialog>
</sensitive-splash>
<script is:inline>
  (function () {
    const KEY = "plocos-sensitive-content-acknowledged";
    if (localStorage.getItem(KEY) === "true") return;
    const dialog = document.getElementById("plocos-splash");
    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
      // Intercept Esc — REQ-splash-7 forbids dismissal via Esc
      dialog.addEventListener("cancel", (e) => e.preventDefault());
    }
    dialog.addEventListener("click", (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.dataset.action === "acknowledge") {
        localStorage.setItem(KEY, "true");
        dialog.close();
      }
      if (t instanceof HTMLElement && t.dataset.action === "exit") {
        window.location.href = "about:blank";
      }
    });
  })();
</script>
<style>
  .splash-dialog { /* modal centrado, max-width 32rem, padding generoso, contraste fuerte */ }
  .splash-dialog::backdrop { background: rgba(0,0,0,0.7); }
  .splash-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
  .splash-btn-primary, .splash-btn-secondary { /* ver tokens del site */ }
</style>
```

- **Data flow**: locale → `splash.{title, body, acknowledge, reject}` → render HTML server-side → cliente verifica localStorage → muestra modal o no.
- **Edge cases**: (1) si JS ejecutado antes de render del dialog (carrera), el IIFE no-op; (2) `localStorage` inaccesible (modo privado Safari) → no muestra splash, no es crítico; (3) `dialog.showModal` no supported (navegadores viejos) → el modal no aparece, falla graceful; (4) Esc interceptado con `event.preventDefault()` en el evento `cancel`; (5) no hay reset UI built-in (REQ-splash-6 — fricción intencional).
- **Failure modes**: si i18n no provee `splash.*`, el template intenta acceder a `undefined.title` y rompe el build (TypeScript).
- **Out-of-scope**: reset button (REQ-splash-6).

### Capability 5: `robots-anti-ia` (NEW)

- **Archivos**: `public/robots.txt` (nuevo), `src/layouts/BaseLayout.astro` (1 línea meta).
- **Forma**:

```text
# Plocos robots.txt — anti-IA hardening
# Bloquea rastreadores conocidos de entrenamiento de IA.
# Politica completa: https://plocos.netlify.app/terminos

# Search engines legitimos: se permite indexacion.
User-agent: *
Allow: /

# Bloqueos individuales por operador.
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Bytespider
Disallow: /

Sitemap: https://plocos.netlify.app/sitemap-index.xml
```

En `BaseLayout.astro`, en el `<head>` después de `<meta name="description">` y antes de los `<script>`:

```astro
<meta name="robots" content="noai, noimageai" />
```

- **Data flow**: archivo estático servido por Astro; meta tag inyectado por BaseLayout en cada página.
- **Hostname alignment**: `astro.config.mjs` define `site: 'https://plocos.netlify.app'`. La directiva `Sitemap:` coincide. `@astrojs/sitemap` produce `/sitemap-index.xml` por default, no requiere custom config.
- **Edge cases**: (1) hostname en `Sitemap:` debe cambiar si se mueve de Netlify (manual); (2) bots que ignoran robots.txt no se detienen (es la realidad); (3) `Google-Extended` NO bloquea `Googlebot` indexación — es solo opt-out de uso AI training (REQ-robots-3).
- **Failure modes**: si `astro.config.mjs` cambia `site` y no se actualiza `robots.txt`, hay drift (mitigación: ver §6).
- **Out-of-scope**: `X-Robots-Tag` HTTP header (REQ-robots-7 explícito).

### Capability 6: `consentimiento-cookies` (MODIFIED)

- **Archivos**: `astro.config.mjs` (líneas 23-39), `src/cookiebanner/styles.css` (regla hide), `src/components/CookieConsentBanner.astro` (nuevo), `src/lib/astro-consent-labels.ts` (nuevo), `src/lib/i18n.ts` (datos), `src/lib/consent-gate.ts` (nuevo helper), `src/layouts/BaseLayout.astro` (import + GA gating script).
- **Forma `astro.config.mjs` modificado**:

```mjs
astroConsent({
  siteName: "Plocos",
  cookiePolicyUrl: "/cookie-policy",
  privacyPolicyUrl: "/privacy",
  displayUntilIdle: true,
  displayIdleDelayMs: 1000,
  consent: {
    days: 30,
    storageKey: "astro-consent"
  }
})
// Sin headline/description/acceptLabel/rejectLabel/manageLabel — esos vienen del componente custom.
```

- **Forma `src/components/CookieConsentBanner.astro`** (versión resumida):

```astro
---
import { defaultLocale, getTranslations, type Locale } from "../lib/i18n";
const locale = (Astro.currentLocale ?? defaultLocale) as Locale;
const consent = getTranslations(locale).consent;
---
<cookie-consent-banner data-storage-key="astro-consent">
  <div id="cb-banner" role="dialog" aria-labelledby="cb-headline" aria-describedby="cb-desc" hidden>
    <h2 id="cb-headline">{consent.headline}</h2>
    <p id="cb-desc">{consent.description}</p>
    <button data-action="accept" class="cb-btn-primary">{consent.acceptLabel}</button>
    <button data-action="reject" class="cb-btn-secondary">{consent.rejectLabel}</button>
    <button data-action="manage" class="cb-btn-link">{consent.manageLabel}</button>
    <a href="/cookie-policy">{consent.cookiePolicyLink}</a>
    <a href="/privacy">{consent.privacyPolicyLink}</a>
  </div>
  <div id="cb-modal" role="dialog" aria-modal="true" aria-labelledby="cb-modal-title" hidden>
    <h2 id="cb-modal-title">{consent.preferencesTitle}</h2>
    <fieldset>
      <legend>{consent.categories.essential}</legend>
      <input type="checkbox" checked disabled aria-readonly="true" />
    </fieldset>
    <fieldset>
      <legend>{consent.categories.analytics}</legend>
      <input type="checkbox" data-consent-category="analytics" />
    </fieldset>
    <button data-action="save">{consent.saveLabel}</button>
  </div>
</cookie-consent-banner>
<script is:inline>
  (function () {
    const KEY = "astro-consent";
    const banner = document.getElementById("cb-banner");
    const modal = document.getElementById("cb-modal");
    const aToggle = modal.querySelector('input[data-consent-category="analytics"]');
    const show = () => banner.hidden = false;
    const hide = () => banner.hidden = true;
    const get = () => {
      try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
      catch { return null; }
    };
    const set = (categories) => {
      const payload = JSON.stringify({
        categories: { essential: true, analytics: !!categories.analytics },
        updatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      });
      localStorage.setItem(KEY, payload);
    };
    if (!get()) requestIdleCallback(show, { timeout: 1000 });
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.dataset.action === "accept") { set({ analytics: true }); hide(); }
      if (t.dataset.action === "reject") { set({ analytics: false }); hide(); }
      if (t.dataset.action === "manage") { banner.hidden = true; modal.hidden = false; }
      if (t.dataset.action === "save") { set({ analytics: aToggle.checked }); modal.hidden = true; }
    });
  })();
</script>
```

- **GA4 gating script** (reemplaza `<GoogleAnalytics>` en BaseLayout):

```astro
{analyticsId && (
  <script is:inline define:vars={{ analyticsId }}>
    (function () {
      const tryInject = () => {
        try {
          const w = window;
          const consent = w.astroConsent && w.astroConsent.get();
          if (consent && consent.categories && consent.categories.analytics) {
            const s = document.createElement("script");
            s.async = true;
            s.src = "https://www.googletagmanager.com/gtag/js?id=" + analyticsId;
            document.head.appendChild(s);
            const inline = document.createElement("script");
            inline.text = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '" + analyticsId + "');";
            document.head.appendChild(inline);
          }
        } catch (e) { /* consent engine unavailable */ }
      };
      // Re-attempt when consent is granted from the modal.
      const orig = window.astroConsent && window.astroConsent.set;
      // simpler: poll briefly until astroConsent is on window
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (window.astroConsent) {
          clearInterval(poll);
          tryInject();
          // Listen for changes — modify astro-consent's set is not public; use storage event
          window.addEventListener("storage", (e) => {
            if (e.key === "astro-consent") tryInject();
          });
        } else if (tries > 50) {
          clearInterval(poll);
        }
      }, 100);
    })();
  </script>
)}
```

- **Helper `src/lib/consent-gate.ts`** (reusable para futuros terceros):

```ts
export function gateScriptOnConsent(category: 'analytics' | 'marketing', src: string, attrs: Record<string, string> = {}): void {
  const tryInject = () => {
    const consent = window.astroConsent?.get();
    if (consent?.categories?.[category]) {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
      document.head.appendChild(s);
    }
  };
  // ... polling pattern igual al de GA4
}
```

- **Data flow**: locale → `consent.{headline, description, acceptLabel, rejectLabel, manageLabel, categories.{essential, analytics}, preferencesTitle, saveLabel, cookiePolicyLink, privacyPolicyLink}` → render custom banner → click → `window.astroConsent.set(...)` → GA4 injector polling ve el cambio → inyecta.
- **Edge cases**: (1) `astroConsent` no disponible en window (fallo de carga) → polling expira a 5s; (2) `localStorage` full / deshabilitado → no set, banner se vuelve a mostrar en próximo load (REQ-consent-5); (3) dos pestañas abiertas que cambian consent → evento `storage` re-dispara polling (puede doble-inyectar si la primera pestaña ya tenía GA — mitigable guardando `localStorage['plocos-ga-injected']`).
- **Failure modes**: si `analyticsId` no está en env, no se inyecta nada (consistente con el comportamiento actual). Si `astro.config.mjs` ReferenceError, build falla.
- **Out-of-scope**: categoría `marketing` (REQ-consent-7 la declara no usada actualmente).

### Capability 7: `i18n-mensajes` (MODIFIED)

- **Archivos**: `src/lib/i18n.ts` (extender `Translation` interface y ambos bundles).
- **Forma**: añadir las cinco secciones al interface `Translation` y poblar `es`/`en`. Para evitar drift, mantener el `Translation` interface único y reutilizar las keys declaradas en §5.

## 4. Componentes nuevos (firmas)

### `src/components/SensitiveContentWarning.astro`

Ver bloque completo en §3 Capability 4. Firma resumida:

```ts
// Sin props. Lee locale via Astro.currentLocale.
const splash: { title: string; body: string; acknowledge: string; reject: string };
```

### `src/components/CookieConsentBanner.astro`

Ver bloque en §3 Capability 6. Firma resumida:

```ts
const consent: {
  headline: string;
  description: string;
  acceptLabel: string;
  rejectLabel: string;
  manageLabel: string;
  preferencesTitle: string;
  saveLabel: string;
  cookiePolicyLink: string;
  privacyPolicyLink: string;
  categories: { essential: string; analytics: string };
};
```

### `src/lib/consent-gate.ts`

```ts
export function gateScriptOnConsent(
  category: 'analytics' | 'marketing',
  src: string,
  attrs?: Record<string, string>
): void;
```

### `src/lib/astro-consent-labels.ts`

```ts
// Exporta los mismos strings que el componente custom, pero en un objeto
// plano JS para uso en astro.config.mjs si en el futuro se quisiera
// re-pasar labels. Hoy no se usa; queda como anclaje futuro.
export const consentLabels = {
  es: { headline, description, acceptLabel, rejectLabel, manageLabel, /* ... */ },
  en: { headline, description, acceptLabel, rejectLabel, manageLabel, /* ... */ }
} as const;
```

### `BaseLayout.astro` — diff

```diff
   <meta name="description" content={metaDescription} />
   <meta name="theme-color" content="#f5f1e6" />
+  <meta name="robots" content="noai, noimageai" />
   {image && <meta property="og:image" content={image} />}
   {analyticsId && (
-    <GoogleAnalytics id={analyticsId} />
+    <script is:inline define:vars={{ analyticsId }}>
+      /* GA4 gating script — ver §3 Capability 6 */
+    </script>
   )}
   <script is:inline src="/node_modules/flowbite/dist/flowbite.min.js" defer></script>
 </head>
 <body>
   <SiteHeader currentPath={currentPath} locale={locale} />
   <main class="flex-1">
     <slot />
   </main>
   <SiteFooter locale={locale} />
+  <SensitiveContentWarning />
+  <CookieConsentBanner />
 </body>
```

### `SiteFooter.astro` — diff

```diff
   <nav aria-label="Footer links" class="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end">
     <a href={termsHref} class="transition-colors hover:text-accent">{termsLabel}</a>
     <a href="/rss.xml" class="transition-colors hover:text-accent">{rss}</a>
+    <button type="button" id="manage-cookies" class="transition-colors hover:text-accent">
+      {translations.footer.manageCookies}
+    </button>
   </nav>
```

```diff
+  <script is:inline>
+    document.getElementById("manage-cookies")?.addEventListener("click", () => {
+      window.astroConsent?.reset();
+    });
+  </script>
```

## 5. i18n contract

Extensión de la `Translation` interface en `src/lib/i18n.ts`:

```ts
interface Translation {
  // ... existentes ...
  footer: {
    // ... existentes ...
    manageCookies: string;  // NUEVO
  };
  consent: {                                                    // NUEVO
    headline: string;
    description: string;
    acceptLabel: string;
    rejectLabel: string;
    manageLabel: string;
    preferencesTitle: string;
    saveLabel: string;
    cookiePolicyLink: string;
    privacyPolicyLink: string;
    categories: {
      essential: string;
      analytics: string;
    };
  };
  splash: {                                                     // NUEVO
    title: string;
    body: string;
    acknowledge: string;
    reject: string;
  };
  privacy: {                                                    // NUEVO
    metaTitle: string;
    metaDescription: string;
    title: string;
    sections: { heading: string; body: string; bullets?: string[] }[];
    contactEmail: string;
    responseTimelines: { consultas: string; reclamos: string; };
    retention: { category: string; period: string }[];
    arcoProcedure: string[];
  };
  cookiePolicy: {                                               // NUEVO
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    updatedLabel: string;
    updatedValue: string;
    categories: {
      heading: string;
      description: string;
      cookies: { name: string; provider: string; purpose: string; duration: string; party: 'first' | 'third' }[];
    }[];
    revocation: string[];
  };
}
```

Paridad es↔en enforced por el sistema de tipos: cualquier key faltante en `en` rompe `astro check` (REQ-i18n-2).

## 6. Riesgo y mitigación

| Riesgo | Mitigación |
|--------|------------|
| **Algolia drift** — `PUBLIC_ALGOLIA_*` envs se quitan pero la política de cookies sigue listando Algolia. | Verificación en build: añadir script `scripts/check-cookie-consistency.mjs` (NO parte de este cambio en su primera entrega; queda como debt si no hay tiempo). Mitigación inmediata: comentario en el bundle `cookiePolicy.categories` que documenta el acoplamiento. |
| **GA4 leakage window** — visitor rechaza pero GA ya cargó en primer paint. | Doble defensa: (1) NO emitir `<GoogleAnalytics>` server-side (cambio a gating script inline); (2) documentar en `politica-privacidad` que GA solo carga post-consent. |
| **Splash accessibility vs Esc bypass** — usuarios pueden presionar Esc para evitar el splash. | Interceptar evento `cancel` del `<dialog>` con `preventDefault()`. Defensa secundaria: ninguna ruta para "reset" built-in. |
| **i18n locale addition drift** — nuevo locale añadido sin poblar las 5 secciones nuevas. | El `Translation` interface rechaza cualquier bundle que no cumpla las 5 secciones. Para el futuro, agregar un test `tsc --noEmit` que parsee `translations[locale]` contra `Translation`. Aplicable en CI si se instala un test runner (hoy strict_tdd=false). |
| **`/en/terms` y `/en/privacy` fallback conflict** — fallback `en→es` reescribiría el pacto en español cuando se accede a `/en/terms`. | **Crear archivos físicos** `src/pages/en/terms/index.astro` (ya existe) y `src/pages/en/privacy/index.astro` (NUEVO). Mismo con `src/pages/en/cookie-policy/index.astro` (NUEVO). El fallback `en→es` en `astro.config.mjs` se mantiene porque aplica a otras rutas, no a estas. |
| **No test runner** — no hay vitest/playwright. | Verificación manual listada en §7 (Rollback §7 manual checks). |
| **Hostname drift** — `site:` en config y `Sitemap:` en robots.txt divergen. | Anotar en `robots.txt` un comentario que diga "hostname must match astro.config.mjs site"; el grep equivalente `grep -r "Sitemap:" .` es trivial. |
| **Custom banner doble con el de la integración** — astro-consent podría renderizar su banner detrás del nuestro. | Hide via CSS en `src/cookiebanner/styles.css`: `[data-astro-consent-banner], #cb-banner-host { display: none !important; }` (selector exacto a confirmar mirando el DOM de la integración inyectada). |
| **`window.astroConsent.reset()` reload UX** — el footer "Gestionar cookies" dispara un reload. | Aceptable: la página vuelve a cargar con el modal visible. Documentar en el comentario del componente. |

## 7. Rollback

### Revertible en un solo PR

- `public/robots.txt` → borrar el archivo.
- `BaseLayout.astro` meta `<meta name="robots">` → borrar la línea.
- `BaseLayout.astro` GA gating script → restaurar `<GoogleAnalytics id={analyticsId} />`.
- `BaseLayout.astro` imports `SensitiveContentWarning` y `CookieConsentBanner` → borrar.
- `CookieConsentBanner.astro` → borrar. `astroConsent` muestra su banner default.
- `src/components/SiteFooter.astro` link Gestionar cookies → borrar.
- `src/pages/privacy/index.astro`, `src/pages/en/privacy/index.astro`, `src/pages/cookie-policy/index.astro`, `src/pages/en/cookie-policy/index.astro` → borrar.
- `src/lib/consent-gate.ts`, `src/lib/astro-consent-labels.ts` → borrar.
- `astro.config.mjs` → restaurar las labels hardcodeadas en español.
- `src/cookiebanner/styles.css` → borrar la regla `display:none` del banner default.

### Requiere revert coordinado

- `src/lib/i18n.ts` — los cambios a `terms.sections` (extender a 11) y las nuevas secciones (`privacy`, `cookiePolicy`, `splash`, `consent`, `footer.manageCookies`) deben revertirse en coordinated fashion con la reversión de los consumidores (páginas, componentes). TypeScript catch el caso contrario.

### NUNCA auto-revertible

- **El texto normativo del pacto** — una vez publicado en `es.terms.sections` y `en.terms.sections`, las 11 secciones son ley de la site. Si se quiere modificar, debe pasar por otro SDD change que documente la modificación normativa. La 11-arrays-invariante es contractual con el cliente.

### Verificación manual (no test runner)

1. `pnpm dev` → abrir `http://localhost:4321/`. Verificar splash, luego banner, luego poder aceptar.
2. DevTools → Network → buscar `googletagmanager.com`. No debe aparecer antes de aceptar; debe aparecer después.
3. DevTools → Application → Local Storage → verificar `astro-consent` con `{categories:{analytics:true,...}}`.
4. DevTools → Application → Local Storage → `plocos-sensitive-content-acknowledged` debe ser `"true"` después de click.
5. Repetir con `localStorage` vacío: el splash aparece, el banner aparece después, Esc no cierra el splash.
6. Visitar `/terminos`, `/en/terms`, `/privacy`, `/en/privacy`, `/cookie-policy`, `/en/cookie-policy` → todas 200, todas con texto distinto.
7. `curl http://localhost:4321/robots.txt` → devuelve el archivo.
8. Inspeccionar `<head>` de cualquier página → contiene `<meta name="robots" content="noai, noimageai">`.
9. `pnpm build` → no warnings nuevos.
10. `pnpm check:pages` → 0 errores.

### Manual es ↔ en sync checklist (proceso, no código)

Para traductores — verificar en cada release de las páginas legales:

- [ ] Mismo número de secciones en ambos bundles.
- [ ] Mismos `heading` shape (slug idéntico).
- [ ] Bullets en el mismo orden.
- [ ] Fechas (`updatedValue`) actualizadas en ambos.
- [ ] Email `expresatura@plocos.com` idéntico (no se traduce).
- [ ] "Ley 1581/2012" se preserva en `en` con explicación parentética.
- [ ] "SIC" se preserva en `en` con explanation al primer uso.
- [ ] "ARCO" lleva paréntisis explicativo en `en`.
- [ ] Algolia cookie names (`aind`, `_algolia_*`) sin traducir.
- [ ] `pnpm check:pages` pasa sin type errors.

## Próximo paso

Listo para `sdd-tasks`. Las tareas de implementación deben respetar el orden: (1) extender `i18n.ts` con ES completo primero, (2) poblar EN, (3) `astro check` debe pasar, (4) crear páginas legales, (5) componentes splash + banner, (6) `robots.txt` + meta, (7) modificar `BaseLayout`, (8) verificación manual.
