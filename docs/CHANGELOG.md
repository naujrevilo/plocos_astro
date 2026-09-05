# Changelog PLOCOS

## [0.1.45] - 2026-09-05

### ✨ Cambios principales
- **Pacto de Lectura actualizado**: 11 secciones → 8 secciones (I–VIII). Texto literal del cliente con fecha 2 de septiembre de 2026. SHA-256 byte-level enforcement via `pnpm verify:pacto` (corre como prebuild hook).
- **Anti-IA section separada**: Nueva sección IV independiente (antes combinada con propiedad intelectual), con mención explícita de fine-tuning, datasets, y "perseguirá civilmente cualquier elusión".
- **Modelo comercial explícito**: Nueva sección II declara "ánimo de lucro directo" (suscripciones, libro virtual interactivo, membresías). Edad mínima 18 años (antes 15).
- **Obras en desarrollo**: Nueva cláusula de "secreto profesional" en sección III.
- **Jurisdicción específica**: Cartagena de Indias, Distrito Turístico y Cultural (ya estaba, ahora con citas explícitas a Ley 23/1982, Decisión Andina 486, Convenio de Berna, Ley 1480/2011, Ley 1581/2012).
- **English translation**: 8 secciones traducidas con marker `[EN: TODO legal review by Colombian attorney]` al inicio de cada body. Pendiente revisión de abogado.
- **Visual tweaks cliente**: Logo más grande (h-32 w-32), mb-4 en SiteHeader y en "Nuestra razón de ser".

### 🐛 Correcciones
- **Bug crítico de env vars**: `src/lib/db.ts`, `src/pages/admin/comments.astro`, `src/pages/api/comments/moderate.ts` usaban `process.env` para leer `.env.local`. En Astro 5 + Vite 6 esto siempre devuelve `undefined`. Migrado a `import.meta.env`. Sin este fix, la moderación de comentarios estaba completamente rota.
- **24 errores `astro check`** en `src/pages/blog/[...slug].astro` (deprecated `getEntryBySlug`) y `src/pages/api/comments.ts` (variables no definidas): reducidos a 0.
- **Splash + cookie consent + GA4**: pre-existente, sin tocar.

### 🔧 Infraestructura
- **Verificador SHA-256 del pacto**: `scripts/verify-pacto-body.mjs` + fixture canónica en `scripts/__fixtures__/pacto-canonical.json`. Wired a `prebuild` hook.
- **`.gitattributes`**: `*.json text eol=lf` y `*.md text eol=lf` para evitar que `core.autocrlf=true` rompa el SHA-256.
- **Pacto JSON extraction**: `src/content/_data/pacto.{es,en}.json` reemplaza el texto inline en `src/lib/i18n.ts`. Permite futura edición vía CMS sin tocar el módulo de i18n.

### 📚 Documentación
- Nuevo `docs/arquitectura.md` — Overview del stack + decisiones arquitectónicas.
- Nuevo `docs/diagramas/dev/` — 5 diagramas técnicos (estructura, build, env vars, comment moderation, SDD lifecycle).
- Nuevo `docs/diagramas/user/como-comentar.md` — flujo de moderación para el cliente (los diagramas `arquitectura-informacion.md` y `primera-visita.md` se crearon inicialmente pero el cliente los encontró demasiado técnicos y fueron eliminados en una iteración posterior).
- Actualizados: `docs/README-usuario.md`, `docs/guia-desarrollo-local.md`, `docs/guia-cliente-moderacion.md`.

### 🚫 Scoped out (punteado a change futuro)
- **Item 4**: Autonomía editorial de contenido (CMS, audiovisual collection, home.tags removal). Decisión del cliente: Interstellar Writer Next pertenece a otro proyecto.
- **Decap CMS**: implementación revertida (5 commits eliminados del historial). Spec archivado como scoped-out.
- **Coleccion-audiovisuales**: nunca implementada. Spec archivado como scoped-out.

### ⚠️ Pendientes (gates de producción)
- **8 markers `[EN: TODO legal review by Colombian attorney]`**: pendiente revisión de abogado colombiano.
- **61 vulnerabilidades Dependabot** (subió a 62 después del fix de env vars): triage separado.
- **24 pre-existentes `astro check` errors**: YA reducidos a 0.
- **1 hint `astro check` en `admin/login.astro:7`**: false positive (`redirectUrl` se usa en línea 20 dentro de `if (token)`). No bloqueante.

### 🔗 Commits
- `7783e76` fix(env): migrate process.env to import.meta.env for Astro 5 + Vite 6
- `c38844f` fix(nav): client-requested visual tweaks
- `f9ef662` fix(astro-check): 24 -> 0 errors
- `6cb5784` docs(specs): sync pacto-lectura + i18n-mensajes deltas to active spec store
- `ddc4288` feat(pacto): English translation of 8 sections, attorney review pending
- `2bb227f` fix(i18n): preserve 9 pre-existing EN legal-review markers from legacy en.terms
- `37c48cf` feat(i18n): wire pacto JSON imports + av/editor namespaces
- `8dc7f6c` feat(pacto): extract 8-section es body to pacto.es.json + en bridge skeleton
- `27aee9f` chore(pacto): add byte-level verifier + canonical fixture from observation #99

Total: 9 commits, pushed a `origin/main`.

## [0.1.37] - 2025-11-22
### 🐛 Correcciones
- Se solucionó el error 500 en páginas de posts reemplazando la obtención de la entrada de la colección con `getEntryBySlug` y renderizándola correctamente.
- Se corrigió la URL de la API de comentarios en el script del cliente (de `/api/comments.json` a `/api/comments`).
- Se actualizó la versión del proyecto a `0.1.37`.

### 📚 Documentación
- Se añadieron logs de depuración a la API de comentarios para rastrear la obtención de comentarios por `slug` y `locale`.



## [0.1.36] - 2025-11-22
### 🐛 Correcciones
- Se corrigió un error que impedía mostrar los comentarios en las publicaciones. La causa era una combinación de pre-renderizado de páginas y el paso de un `slug` incorrecto al componente de comentarios.
- Se actualizó la versión del proyecto a `0.1.36`.

### 📚 Documentación
- Se actualizó `TROUBLESHOOTING.md` con nuevas entradas sobre errores comunes y sus soluciones.


## [1.3.0] - 2025-11-16
### ✨ Cambios principales
- Refactor completo del header móvil y escritorio: distribución horizontal, responsive y accesible.
- Drawer de búsqueda en móvil con resultados en tiempo real y panel de resultados integrado.
- Corrección de eventos y asociación de elementos en el drawer móvil.
- Logs de depuración agregados al script de búsqueda.
- Mejoras en la documentación técnica y de usuario.

### 🐛 Correcciones
- El drawer de búsqueda en móvil ahora muestra y actualiza resultados correctamente.
- El header ya no se apila ni duplica elementos en ningún breakpoint.

### 📚 Documentación
- Actualización de README.md, guía de desarrollo local y guía de cliente.
- Nueva guía de usuario en `docs/README-usuario.md`.
