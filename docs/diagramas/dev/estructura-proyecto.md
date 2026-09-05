# Estructura del Proyecto — Vista de Desarrollo

```mermaid
graph TD
    subgraph "Frontend pages (src/pages)"
        StaticPages["Páginas estáticas con getStaticPaths"]
        BlogPages["/blog/[...slug] (getStaticPaths)"]
        AdminPages["/admin/* (prerender: false)"]
        ApiPages["/api/* (serverless endpoints)"]
        I18nPages["/en/* mirror (i18n routing)"]
    end

    subgraph "Layouts y componentes"
        BaseLayout["BaseLayout.astro<br/>splash + cookie banner + meta"]
        SiteHeader["SiteHeader.astro<br/>nav + lang/theme + hamburger"]
        SiteFooter["SiteFooter.astro<br/>links + manage cookies"]
        Components["Otros: PostCard, CommentSection,<br/>SearchDialog, SensitiveContentWarning,<br/>CookieConsentBanner"]
    end

    subgraph "Lib (núcleo)"
        i18n["i18n.ts<br/>getTranslations(locale)<br/>+ TypeScript parity check"]
        routes["routes.ts<br/>createLocaleHref()"]
        db["db.ts<br/>drizzle + libsql<br/>ASTRO_DB_* (import.meta.env)"]
        schema["db/schema.ts<br/>Comments table"]
    end

    subgraph "Content (colecciones Astro)"
        Posts["posts/<br/>~150 markdown con frontmatter"]
        Categories["categories/<br/>6 entries"]
        PactoData["_data/pacto.{es,en}.json<br/>(verbatim client text)"]
        Authors["authors/"]
    end

    subgraph "Build & verification"
        VerifyPacto["scripts/verify-pacto-body.mjs<br/>prebuild hook"]
        PactoFixture["scripts/__fixtures__/pacto-canonical.json"]
        AstroCheck["pnpm astro check<br/>0 errors, 0 warnings, 1 hint"]
    end

    BaseLayout --> SiteHeader
    BaseLayout --> SiteFooter
    BaseLayout --> Components

    StaticPages --> i18n
    StaticPages --> BaseLayout
    BlogPages --> i18n
    BlogPages --> Components
    BlogPages --> Posts
    AdminPages --> db
    AdminPages --> i18n
    ApiPages --> db
    ApiPages --> schema

    i18n --> PactoData
    VerifyPacto --> PactoFixture
    VerifyPacto --> PactoData

    AstroCheck -.->|gate| StaticPages
    AstroCheck -.->|gate| BlogPages
    AstroCheck -.->|gate| AdminPages
    AstroCheck -.->|gate| ApiPages
```

## Convenciones de organización

- **`src/pages/`** — solo rutas. Sin lógica de negocio. Delegan a `src/lib/`.
- **`src/lib/`** — módulos singleton sin estado. Solo lectura del ambiente (`import.meta.env`).
- **`src/content/`** — todo el contenido editable como colección Astro (typed via Zod).
- **`src/components/`** — componentes reutilizables. Props explícitos, sin estado global.
- **`scripts/`** — scripts ejecutables de build/dev/verificación. No importan código de `src/`.
- **`openspec/specs/`** — fuente de verdad de las capacidades activas.
- **`openspec/changes/`** — cambios en curso y archivados.

## Anti-patrones (NO hacer)

- ❌ Inline de strings traducibles en `.astro`. Siempre via `getTranslations()`.
- ❌ Acceso a DB en componentes de UI. Siempre en `src/lib/db.ts`.
- ❌ Hardcoded URLs. Siempre via `createLocaleHref()`.
- ❌ `process.env.X` para vars de `.env.local`. Siempre `import.meta.env.X`.
- ❌ Modificar `src/lib/i18n.ts` para añadir secciones legales. Usar `src/content/_data/*.json`.

Última actualización: 2026-09-05
