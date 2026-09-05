# Pipeline de Build y Deploy

## Local dev

```mermaid
flowchart LR
    Source[Source code] -->|pnpm install| NodeModules[node_modules/]
    NodeModules -->|pnpm dev| DevServer[Astro dev server<br/>localhost:4321]
    DevServer -->|Vite HMR| Browser[Browser reload]
    DevServer -->|env loaded| ImportMeta["import.meta.env.X"]
    DevServer -->|server-side render| PagesRendered[Pages renderizadas]
```

## Build de producción

```mermaid
flowchart TD
    Push[git push origin main] --> NetlifyHook[Netlify webhook]
    NetlifyHook --> Install[pnpm install]
    Install --> PrebuildHook{"pnpm verify:pacto<br/>(prebuild hook)"}
    PrebuildHook -->|SHA-256 match| BuildOK[Astro build --remote OK]
    PrebuildHook -->|drift > 0 bytes| BuildFail[Build fails<br/>pacto body corrupted]

    BuildOK --> AstroCheck{astro check<br/>0 errors?}
    AstroCheck -->|yes| NetlifyDeploy[Deploy to Netlify Edge]
    AstroCheck -->|new errors| Block[PR blocked]

    NetlifyDeploy --> CDN[Netlify CDN cache]
    NetlifyDeploy --> Functions[Netlify Functions<br/>SSR endpoints]
    CDN --> LiveSite[plocos.netlify.app]
    Functions --> LiveSite
```

## Prebuild hook: verify:pacto

El hook `prebuild` corre `pnpm verify:pacto` antes de cada build. Garantiza que el texto literal del pacto no mute.

```mermaid
flowchart LR
    Start[prebuild inicia] --> ReadFixture[Lee scripts/__fixtures__/pacto-canonical.json<br/>SHA-256 esperado]
    ReadFixture --> ReadBody[Lee src/content/_data/pacto.es.json<br/>concatena body.join empty]
    ReadBody --> HashBody[SHA-256 LF-normalizado]
    HashBody --> Compare{hash match?}
    Compare -->|sí| Pass[exit 0<br/>build continúa]
    Compare -->|no| Drift[exit 1<br/>drift_bytes + first_diff_offset reportados]
    Drift --> FixCode[Fix code, NO el body<br/>observación #99 es source of truth]
```

**Nunca** edites `pacto.es.json` o `pacto.en.json` a mano para "arreglar" un drift. La fuente de verdad es observación #99 en Engram. Si el hash cambia, el código que consume el body está mal.

## Variables de entorno en build vs dev

| Fase | Origen de env vars | API disponible |
|---|---|---|
| `pnpm dev` (local) | `.env.local` + shell | `import.meta.env.X` ✓ |
| `astro build` (local) | `.env.local` + shell | `import.meta.env.X` ✓ |
| `astro build --remote` | `.env.local` + shell | `import.meta.env.X` ✓ |
| Netlify build | Netlify environment UI | `import.meta.env.X` ✓ |
| Netlify runtime (SSR) | Netlify environment UI | `import.meta.env.X` ✓ |

**Importante**: Netlify NO lee `.env.local`. Las vars deben estar configuradas en Netlify UI (Site settings → Environment variables).

Última actualización: 2026-09-05
