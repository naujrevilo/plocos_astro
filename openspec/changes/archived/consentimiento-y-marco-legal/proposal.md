---
id: consentimiento-y-marco-legal
status: proposed
date: 2026-08-20
locale: es-CO
jurisdiction: CO
mode: auto
artifact_store: both
---

# Propuesta: Consentimiento y Marco Legal

## Por qué

El cliente exige un "PACTO DE LECTURA" de 11 secciones (naturaleza, contenido sensible, edad, suscripción, anti-IA, propiedad intelectual). En Colombia la Ley 1581/2012 y el Decreto 1377/2013 regulan datos personales, con la SIC como autoridad. El contenido editorial debe protegerse del scraping para entrenamiento de IA.

## Qué cambia

**Páginas:**
- `/terminos` (es) + `/en/terms` (en): REEMPLAZAN el texto genérico con §1-§11 del pacto.
- `/privacy` (es) + `/en/privacy` (en): NUEVA — responsable, finalidad, base legal, derechos ARCO, transferencias (Netlify/GA → EE.UU.), conservación, canal de contacto.
- `/cookie-policy` (es) + `/en/cookie-policy` (en): NUEVA — cookies por categoría (necesarias, analítica, algolia si aplica, anti-IA).

**Componente:** splash de contenido sensible (modal con dos botones), aparece ANTES del cookie banner.

**Hardening anti-IA:** `public/robots.txt` (NUEVO) bloquea GPTBot, ClaudeBot, CCBot, Google-Extended, anthropic-ai, PerplexityBot, Bytespider. Meta `<meta name="robots" content="noai, noimageai">` en `BaseLayout.astro`.

**Consentimiento + i18n:** `astroConsent()` consume `getTranslations(locale)`. GA4 solo carga si `getConsent('analytics') === true`.

## Impacto

| Sistema | Cambio | Riesgo si no se entrega |
|---------|--------|--------------------------|
| Sitio público | 3 páginas + splash + robots | Exposición Ley 1581/2012; SIC abre investigación |
| Build Astro | i18n + meta robots + GA gating | Etiquetas inconsistentes; GA sin consentimiento |
| Comentarios | solo referenciado en §11 | UI moderación queda como trabajo separado |
| Audiencias | es primario, en fallback | Visitantes sin marco legal |

## Fuera de alcance

UI de moderación, autenticación, pasarela de pagos, migración de posts históricos, GDPR/LOPD (Colombia es la jurisdicción primaria).

## Preguntas abiertas

1. ¿Splash persistente (`localStorage`) o por sesión?
2. ¿"NO QUIERO CONTINUAR" cierra pestaña o redirige?
3. ¿Algolia activo? Si no, omitir cookies algolia.
4. ¿Formulario ARCO o basta con correo?
5. ¿`/en/terms` se conserva o se elimina?

## Capabilities (contrato con sdd-spec)

**Nuevas:** `terminos-y-pacto`, `politica-de-privacidad`, `politica-de-cookies`, `splash-contenido-sensible`, `proteccion-anti-ia`.

**Modificadas:** `consentimiento-de-cookies` (i18n + GA4 gated), `layout-base` (meta robots + splash + banner).

## Enfoque

Reutilizar `getTranslations(locale)`. Páginas legales: Astro estático plano, sin JS salvo el splash. `robots.txt` desde `public/`. Gating GA: render condicional del `<script>` en `BaseLayout.astro` según `getConsent('analytics')`.

## Reversión

- Páginas → revertir texto en git.
- Splash → quitar import de `BaseLayout.astro`.
- `robots.txt` → borrar.
- GA gating → restaurar `<script>` sin condición.
- i18n → revertir etiquetas duras en `astro.config.mjs`.

## Criterios de éxito

- [ ] 3 páginas en es + en con texto normativo.
- [ ] Splash bloquea antes del cookie banner.
- [ ] `robots.txt` bloquea bots listados; meta `noai` en `<head>`.
- [ ] GA4 no carga sin `analytics === true`.
- [ ] Banner sale de `getTranslations(locale)`.
- [ ] Build Astro pasa sin warnings.
