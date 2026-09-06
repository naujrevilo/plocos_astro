# Changelog

## [0.1.46] - 2026-09-06

### Added

- **Moderación masiva**: la página `/admin/comments` se rediseñó siguiendo el patrón "Mass Moderation" (sidebar oscuro, grid masonry de tarjetas, multi-select con checkbox, barra inferior fija con acciones masivas, modal de "Razón de borrado" con opciones tipo Brainly). 5 componentes nuevos en `src/components/admin/` (Sidebar, FilterBar, Card, BulkBar, DeleteModal).
- **Endpoints API de moderación extendidos**: `/api/comments/moderate` ahora acepta acciones masivas con `{ ids: number[], action: 'approve' | 'reject' | 'spam' | 'delete', reason?: string, notifyAuthor?: boolean }`. Usa `inArray(Comments.id, ids)` para operaciones por lotes.
- **Dashboard de moderación en `/admin`**: nueva página con resumen de actividad — 4 cards de estado (Aprobados, Pendientes, Rechazados, Spam) con conteo animado, barra de distribución visual, top 5 posts con más comentarios, 8 cards de motivos de rechazo/spam, selector de período (7d / 30d / Todos) y animaciones de count-up + bar fill.
- **Sidebar admin con secciones**: navegación a `/admin` y `/admin/comments` + atajos de filtro por Estado e Idioma. Items del sidebar son deep-links a `/admin/comments?status=X` que funcionan desde cualquier página.

### Changed

- **Schema de `Comments` migrado a enum `status`**: el campo `approved: integer` se reemplazó por `status: text` con valores `pending | approved | rejected | spam` (default `'pending'`). Se agregaron `rejectionReason` (text, nullable) y `notifyAuthor` (integer, default 0). El endpoint público `/api/comments` filtra por `status='approved'` y guarda nuevos comentarios con `status='pending'`.
- **`createdAt` normalizado a ISO 8601** (`YYYY-MM-DDTHH:MM:SS.sssZ`): el schema declara `text('createdAt')` (sin `mode: 'timestamp'`, que producía formatos inconsistentes entre segundos y milisegundos). El endpoint público guarda `new Date().toISOString()`. Esto asegura que `ORDER BY createdAt DESC` ordena cronológicamente.
- **Layout base con prop opcional `hideChrome`**: cuando es `true`, oculta `SiteHeader`, `SiteFooter`, `CookieConsentBanner` y `SensitiveContentWarning` para usar el layout como "app shell" (caso admin con sidebar propia).
- **Página `/admin/comments` reescrita**: ya no usa `BaseLayout` (decisión revertida; ahora sí lo usa con `hideChrome`), filtros sincronizan URL via `history.replaceState`, selección múltiple + bulk approve/delete, modal de razón con 8 motivos, contador animado de selección.

### Fixed

- **Razón "Spam" mapeaba a status "rejected" en vez de "spam"**: el handler del modal siempre enviaba `action: 'reject'`, así que elegir "Spam" como razón guardaba `status='rejected', rejectionReason='spam'` y solo incrementaba el contador de Rechazados. Fix: `var action = reason === 'spam' ? 'spam' : 'reject'`. Migración one-off corrigió una fila afectada.
- **Items del sidebar no navegaban desde `/admin`**: eran `<button>` que solo disparaban handlers JS. En `/admin` no había FilterBar al cual aplicar el cambio, así que los clicks eran no-op. Fix: cambiados a `<a href="/admin/comments?status=X">`. El navegador navega nativamente desde `/admin`; en `/admin/comments` un handler intercepta con `preventDefault` y aplica el filtro via JS sin recargar. La URL se sincroniza via `history.replaceState` y se lee al cargar (`syncFromUrl`) para que la navegación desde el dashboard llegue con el filtro pre-aplicado.

### Database migration

- `drizzle/0001_moderation_status.sql`: agrega `status`, migra `approved=1` → `status='approved'`, dropea `approved`, agrega `rejectionReason` y `notifyAuthor`. Aplicada manualmente a Turso (la config `drizzle.config.ts` tiene `driver: 'turso'` obsoleto y no funciona con drizzle-kit 0.31; pendiente migración a `dialect: 'turso'`).

## [0.1.35] - 2025-11-22

### Fixed

- Resuelve problemas de conexión con la base de datos en Netlify para el sistema de comentarios.
- Corrige el acceso a variables de entorno en el lado del servidor para los endpoints de la API y las páginas de Astro.

## [0.1.34] - 2025-11-22

### Fixed

- Corrected the comment submission and approval flow by aligning the database schema with the API logic. The `approved` field is now consistently handled as a number (`0` or `1`) across the entire application, resolving issues with TypeScript types and ensuring reliable communication with the Turso database.

## [0.1.33] - 2025-11-212

### Fixed
- **Category Counter:** The category post counter now correctly counts all posts, including those without a specified language.
- **Blog Pagination:** The blog pagination now works correctly, properly calculating the total number of pages and distributing posts across them.