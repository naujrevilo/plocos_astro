# Arquitectura de PLOCOS

> Documento vivo: describe la arquitectura actual del proyecto y los patrones que rigen su evolución.

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Astro (output: `server`) | 5.16.0 |
| Adapter | `@astrojs/netlify` | 6.6.2 |
| DB | libSQL (Turso) + Drizzle ORM | @libsql/client 0.7 |
| Estilos | Tailwind CSS + Flowbite | 3.4 + 4.0 |
| UI islands | Vue + React + Preact | mixto |
| i18n | Astro nativo (es-CO primary, en fallback) | builtin |
| Env vars | `.env.local` → `import.meta.env` | Vite 6 |
| Tests | manual + `astro check` + `verify:pacto` SHA-256 | — |

## Vista de alto nivel

```mermaid
graph LR
    Visitor[Visitante] -->|navegador| Pages[Pages .astro]
    Moderator[Moderador] -->|/admin/login + token| Auth[Cookie Auth]
    Pages -->|SSR| Netlify[Netlify Adapter]
    Netlify --> Lib[Lib: i18n, routes]
    Netlify --> DB[(Turso/libSQL)]
    Pages --> Content[Content Collections]
    Auth --> DB
    Pages --> Robots[robots.txt + meta noai]
    Pages --> Splash[Sensitive Content Splash]
    Pages --> Consent[Cookie Consent Banner]
```

## Estructura del proyecto

```mermaid
graph TD
    Root[plocos_astro/] --> Src[src/]
    Root --> Public[public/]
    Root --> Openspec[openspec/]
    Root --> Docs[docs/]
    Root --> Scripts[scripts/]

    Src --> Layouts[layouts/]
    Src --> Pages[pages/]
    Src --> Components[components/]
    Src --> Lib[lib/]
    Src --> Content[content/]
    Src --> PagesApi[pages/api/]
    Src --> PagesAdmin[pages/admin/]

    Layouts --> BaseLayout[BaseLayout.astro<br/>shell + cookie banner + splash]
    Pages --> PáginasEstáticas[/terminos, /privacidad, etc.]
    Pages --> PagesEn[en/* mirror]
    Pages --> PagesBlog[blog/[slug]]
    Pages --> PagesCategorias[categorias/[slug]]
    PagesAdmin --> Login[login.astro]
    PagesAdmin --> Comments[comments.astro]
    PagesApi --> CommentsAPI[/api/comments]
    PagesApi --> ModerateAPI[/api/comments/moderate]
    PagesApi --> SavePostAPI[/api/save-post]

    Lib --> i18n[lib/i18n.ts<br/>es-CO + en bundles]
    Lib --> db[lib/db.ts<br/>Drizzle + libSQL]
    Lib --> routes[lib/routes.ts]

    Content --> Categories[6 categories]
    Content --> Posts[~150 posts]
    Content --> PactoData[_data/pacto.{es,en}.json]

    Public --> Logo[logo.svg + flags/]
    Public --> Robots[robots.txt]

    Openspec --> Specs[specs/<br/>7 active capabilities]
    Openspec --> Changes[changes/<br/>archived changes]

    Docs --> DocsGuides[guias + diagramas]

    Scripts --> Verifier[verify-pacto-body.mjs<br/>SHA-256 pacto]
    Scripts --> PactoFixture[__fixtures__/pacto-canonical.json]
```

## Pipeline de build y deploy

```mermaid
flowchart LR
    Dev[git push origin main] --> Netlify[Netlify Build]
    Netlify --> Prebuild1[pnpm install]
    Prebuild1 --> Prebuild2[pnpm verify:pacto<br/>prebuild hook]
    Prebuild2 --> Build[astro build --remote]
    Build --> Deploy[Deploy to Netlify Edge]
    Deploy --> Live[plocos.netlify.app]

    Prebuild2 -->|SHA-256 mismatch| Fail[Build fails: pacto drift]
    Build -->|astro check errors >0| Warn[Block PR if new errors]

    Dev -.->|local| DevServer[pnpm dev<br/>localhost:4321]
    DevServer -.->|Vite HMR| Dev
```

## Variables de entorno (lección Vite 6)

> **Regla crítica**: en Astro 5 + Vite 6, las vars de `.env.local` **NO** se exponen en `process.env`. Solo en `import.meta.env`.

```mermaid
flowchart TD
    EnvLocal[.env.local] -->|gitignored| ViteLoader[Vite loadEnv]
    EnvExample[.env.example] -->|tracked| ViteLoader
    ViteLoader -->|import.meta.env| CodeServer[server-side code<br/>.astro / .ts en pages/api]
    ViteLoader -->|import.meta.env.X_PUBLIC| CodeClient[client-side code<br/>con prefijo PUBLIC_]
    ShellVars[Shell env vars<br/>NODE_ENV, PATH, USERPROFILE] --> ProcessEnv[process.env]
    EnvLocal -.->|NO se popula| ProcessEnv

    CodeServer -->|process.env.X| Broken[undefined<br/>build/runtime fails]
    CodeServer -->|import.meta.env.X| Working[valor real cargado]

    Broken -->|Fix: usar import.meta.env| Working
```

## Flujo de moderación de comentarios

```mermaid
sequenceDiagram
    participant U as Usuario/Moderador
    participant L as /admin/login
    participant C as /admin/comments
    participant A as /api/comments/moderate
    participant DB as Turso (libSQL)

    U->>L: GET /admin/login?redirect=/admin/comments
    L->>L: Lee COMMENTS_MODERATION_TOKEN (import.meta.env)
    U->>L: POST token en form
    alt token correcto
        L->>U: Set-Cookie: plocos-comments-token (httpOnly)
        L->>U: 302 → /admin/comments
    else token incorrecto
        L->>U: Re-render login
    end

    U->>C: GET /admin/comments (con cookie)
    C->>C: Verifica cookie === moderationToken
    alt cookie válida
        C->>DB: SELECT * FROM comments ORDER BY createdAt DESC
        DB-->>C: rows (pending + approved)
        C->>U: HTML con UI de moderación
    else cookie inválida/ausente
        C->>U: 302 → /admin/login?redirect=/admin/comments
    end

    U->>A: POST { id, action } (approve/delete)
    A->>A: Verifica cookie === moderationToken
    alt cookie válida
        A->>DB: UPDATE/DELETE comments WHERE id=?
        DB-->>A: ok
        A->>U: 200 { success: true }
    else cookie inválida
        A->>U: 401 { error: "Unauthorized" }
    end
```

## Routing i18n

```mermaid
flowchart LR
    Request[Request] --> Check[Astro.currentLocale]
    Check -->|es| Spanish[Routes /terminos, /privacidad, /politica-de-cookies]
    Check -->|en| English[Routes /en/terms, /en/privacy, /en/cookie-policy]
    Check -->|otro| Fallback[Rewrite a /es/*]
    Spanish --> Render[Render con getTranslations es]
    English --> RenderEn[Render con getTranslations en]
    Fallback --> Spanish
```

## Ciclo de Spec-Driven Development (SDD)

Este proyecto sigue SDD. Toda propuesta de cambio pasa por 6 fases antes de merge.

```mermaid
flowchart TD
    Idea[Idea del cliente o del equipo] --> Preflight[Session Preflight<br/>modo + artifacts + PRs + review]
    Preflight --> Propose[sdd-propose<br/>proposal.md]
    Propose --> Spec[sdd-spec<br/>4 delta specs]
    Spec --> Design[sdd-design<br/>design.md]
    Design --> Tasks[sdd-tasks<br/>tasks.md con WUs + PRs]
    Tasks --> Apply[sdd-apply<br/>6 PRs stacked-to-main]
    Apply --> Verify[sdd-verify<br/>manual 18-step checklist]
    Verify --> Archive[sdd-archive<br/>specs synced + change archivado]

    Propose -.->|blocked| Gatekeeper[Gatekeeper valida]
    Spec -.->|blocked| Gatekeeper
    Design -.->|blocked| Gatekeeper
    Tasks -.->|blocked| Gatekeeper
    Apply -.->|blocked| Gatekeeper
    Verify -.->|blocked| Gatekeeper

    Apply -->|auto-chain forecast >400| ChainedPR[PRs encadenados<br/>stacked-to-main]
```

## Decisiones arquitectónicas vigentes

| Decisión | Razón | Cambio | Archivo |
|---|---|---|---|
| `import.meta.env` para `.env.local` | Vite 6 no popula `process.env` | `7783e76` | `src/lib/db.ts`, `src/pages/admin/comments.astro`, `src/pages/api/comments/moderate.ts` |
| Pacto body en `src/content/_data/pacto.{es,en}.json` | Permite CMS futuro sin tocar i18n.ts | `8dc7f6c` | `src/content/_data/` |
| Verifier SHA-256 byte-level del pacto | Garantiza que el texto literal del cliente no mute | `27aee9f` | `scripts/verify-pacto-body.mjs` |
| `*.json text eol=lf` en `.gitattributes` | Evita que `core.autocrlf=true` rompa el SHA-256 | `27aee9f` | `.gitattributes` |
| 8 secciones en pacto (I–VIII) | Texto literal del cliente 2026-09-02 | `8dc7f6c` | `openspec/specs/pacto-lectura/spec.md` |
| Netlify Adapter (no Node server) | Deploy serverless, scaling automático | `f4074a9` | `astro.config.mjs` |
| Cookie httpOnly para auth de moderación | Evita token en URL, previene XSS | `a2e5b8e` | `src/pages/admin/login.astro` |

## Próximos pasos arquitectónicos (no iniciados)

- **Item 4 del cliente** (autonomía editorial + audiovisual + CMS): punteado a change separado.
- **Limpiar `av` y `editor` interfaces** en `Translation`: declaradas en PR1 pero sin UI consumer (cruft).
- **Migrar 24 errores pre-existentes** en `src/pages/blog/[...slug].astro` (ya reducidos a 0 en `f9ef662`).
- **8 markers `[EN: TODO legal review]`**: pendiente revisión de abogado colombiano.
- **Home.tags pills** (Ensayos Lumínicos / Poética Visual / Bitácora Crítica): sin decisión.

## Ver también

- `docs/diagramas/dev/` — diagramas técnicos detallados
- `docs/diagramas/user/` — diagramas para el cliente y usuario final
- `openspec/specs/` — fuente de verdad de las capacidades activas
- `openspec/changes/archived/` — historial completo de cambios

---

Última actualización: 2026-09-05
Versión del proyecto: 0.1.45
