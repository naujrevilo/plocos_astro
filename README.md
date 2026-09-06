# Plocos — Archivo digital con Astro

Sitio estático moderno que preserva el archivo histórico de [plocos.com](https://www.plocos.com/) usando Astro 5 y Tailwind CSS 3. El repositorio contiene scripts de migración desde Blogger, colecciones tipadas y un flujo de trabajo local.


## Cambios recientes (v0.1.4)
## Estado actual del proyecto
## Versión 0.1.4
**v0.1.5** — 16/11/2025
## Variables de entorno

- Duplica el archivo `.env.example` como `.env` y rellena los valores. El ID de Google Analytics (`ANALYTICS_ID`) es opcional; déjalo vacío para desactivar la medición.
- No subas jamás el `.env` al repositorio.
- En entornos locales añade las variables a `.env`; en Netlify defínelas desde la interfaz de configuración (Site settings → Build & deploy → Environment).
- Para conectar Astro DB a Turso define `ASTRO_DB_REMOTE_URL` y `ASTRO_DB_APP_TOKEN`. Genera las credenciales con el CLI de Turso (`turso db show` / `turso db tokens create`) y ejecútalas en local y en el proveedor de hosting.
- Define un `COMMENTS_MODERATION_TOKEN` (cualquier cadena segura). El panel `/admin/comments` y el endpoint `/api/comments/moderate` lo usan para autenticar las acciones de aprobación/eliminación.

### Formularios de Netlify

- El formulario de contacto en `src/pages/contacto` y `src/pages/en/contact` usa Netlify Forms. Netlify detecta el formulario `name="contact"` durante el build porque incluye `data-netlify="true"`.
- No necesitas backend adicional: Netlify almacenará cada envío y permitirá configurar notificaciones por correo o integraciones (Slack, Zapier, etc.).
- Mantén activo el honeypot (`netlify-honeypot="bot-field"`) para reducir spam y habilita reCAPTCHA solo si los envíos maliciosos persisten.
- Para probar en local, ejecuta `netlify dev` o envía una petición desde la URL publicada; los formularios no se procesan fuera del entorno de Netlify.
- Para reenviar los envíos a Google Workspace (o cualquier buzón), usa **Site settings → Forms → Notification settings** en Netlify y añade una *Email notification* con la dirección deseada. Netlify enviará el correo y conservará el registro en el panel; recuerda mantener SPF/DKIM del dominio actuales para evitar que el mensaje caiga en spam.

### Comentarios moderados con Astro DB

- Cada publicación renderiza un formulario accesible (`CommentSection.astro`) que envía los comentarios a `/api/comments`.
- Los envíos se almacenan en la tabla `Comments` de Astro DB con `status = 'pending'` por defecto. El filtro público (`/api/comments`) solo devuelve comentarios con `status = 'approved'`. Los registros con `status` `rejected` o `spam` nunca se muestran al público.
- En local puedes desarrollar con la base embebida de Astro DB; para producción necesitas un host libSQL (p. ej. Turso) y definir `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN`.
- Para moderar visita `/admin/comments?token=TU_TOKEN` (solo la primera vez). Al ingresar el token, este se guarda en una cookie httpOnly y se elimina inmediatamente de la URL para máxima privacidad. Nunca se muestra el token en el HTML ni se expone en la interfaz. La página debe tener `export const prerender = false;` para que la cookie funcione en local.
- **Panel de moderación (`/admin/comments`)**: interfaz tipo "Mass Moderation" con sidebar oscuro, grid masonry de tarjetas, multi-select con checkbox, barra inferior con acciones masivas y modal de "Razón de borrado" (8 motivos: General, Spam, Contenido dañino, Información personal, Idioma incorrecto, Sin sentido, Fuera de tema, Bajo esfuerzo). Soporta acciones masivas vía `/api/comments/moderate` con `{ ids: number[], action, reason?, notifyAuthor? }`.
- **Dashboard de moderación (`/admin`)**: vista resumen con conteos por estado, distribución visual, top 5 posts con más comentarios y motivos de rechazo más frecuentes. Selector de período (7d / 30d / Todos).
- **Migraciones de schema**: los archivos SQL viven en `drizzle/`. La config `drizzle.config.ts` actual usa `driver: 'turso'` (obsoleto en drizzle-kit 0.31); pendiente migrar a `dialect: 'turso'`. Mientras tanto, las migraciones se aplican manualmente con scripts en `scripts/` o vía libsql client.

### GitHub Actions

- El workflow `/.github/workflows/ci.yml` valida cada push/PR a `main` ejecutando instalación, `astro check` y `pnpm build`.
- Define los secretos `ANALYTICS_ID` en *Settings → Secrets and variables → Actions* si usas Google Analytics.
- Protege la rama `main` exigiendo revisiones y la ejecución satisfactoria del workflow antes de permitir merges.

### Consideraciones de seguridad

**¡Importante!** El `COMMENTS_MODERATION_TOKEN` nunca debe compartirse ni mostrarse en la interfaz, URL o HTML. Solo se almacena en una cookie httpOnly tras el login y se elimina de la URL automáticamente. Trátalo como un secreto crítico: no compartir por correo/IM, rotar ante cualquier sospecha y definirlo solo en gestores seguros (GitHub Secrets, Netlify Environment, .env local privado). Si tienes problemas de acceso al panel, revisa que la cookie se guarde correctamente y que el archivo tenga `export const prerender = false;`.

## Estructura del contenido

El esquema de contenido se define en `src/content/config.ts` usando Zod para validar el frontmatter al momento de compilar Astro:

- `posts`: campos principales (`title`, `pubDate`, `language`, `summary`, `author`, `label` como lista de etiquetas, `categories`, `heroImage`, `heroImageAlt`, `draft`, `translationKey`, `originalUrl`, `body`).
- `categories`: metadatos de categorías (`title`, `description`, `color`, `featured`, `body`).
- `authors`: fichas de autores (`title`, `role`, `bio`, `portrait`, `body`).

## Estructura destacada

```text
src/
├─ components/        # Cabecera, pie, tarjetas, diálogo de búsqueda
├─ content/           # Markdown + schema Zod
├─ layouts/           # BaseLayout y variaciones
├─ lib/               # utilidades de posts, rutas e i18n
├─ pages/
│  ├─ index.astro     # Portada principal
│  ├─ posts/[...slug] # Detalle de publicaciones
│  └─ labels/         # Taxonomía y filtros
└─ styles/tailwind.css
public/
├─ images/            # Activos migrados y uploads nuevos
scripts/              # Herramientas de migración y normalización (ignoradas en git)
```

## Desarrollo local

1. Ejecuta `pnpm dev` para lanzar Astro en modo desarrollo.
2. Abre `http://localhost:4321/` para ver el sitio.
3. Las ediciones se realizan directamente sobre los archivos Markdown del contenido.

## Despliegue con Netlify

- Netlify usa el archivo `netlify.toml`; el comando de build ejecuta `pnpm build` y publica la carpeta `dist/`.
- Configura en Netlify (Site settings → Build & deploy → Environment) los valores:
  - `PUBLIC_SITE_URL` con la URL definitiva del sitio.
  - `ANALYTICS_ID` si usas GA4.
- Habilita "Deploy Previews" para revisar cambios de contenido en ramas antes de fusionarlos.

## Flujo editorial

1. Edita o crea contenido en los archivos Markdown de `src/content/posts/`.
2. Confirma los cambios en el repositorio.
3. Ejecuta `pnpm build` cuando desees generar la salida estática para despliegue.

## Mantenimiento y notas técnicas

- El importador (`scripts/import-plocos.js`) respeta rutas originales y evita duplicados de imágenes.
- Las utilidades en `scripts/*.mjs` permiten normalizar metadatos y recuperar fechas originales.
- Tailwind se configura vía `tailwind.config.js` y `src/styles/tailwind.css`; ahí viven las reglas de color, fuentes y utilidades globales.
- Dependabot y auditorías de seguridad pueden manejarse por separado; ninguna corrección automática se aplica desde este repositorio.
- La carpeta `.github/` se reserva para instrucciones locales y permanece fuera de control de versiones (misma lógica para `scripts/`).
- Si Astro arroja `PAGE_SIZE is not defined` al construir `/blog/page/[page]`, exporta la constante `PAGE_SIZE` en `src/pages/blog/page/[page].astro`; `getStaticPaths` se ejecuta fuera del alcance interno del componente.

### Tipografía personalizada

- Copia los archivos de fuente en `public/fonts` siguiendo los nombres detallados en `public/fonts/README.md`.
- Las pilas `font-sans` y `font-heading` se definen en `tailwind.config.js` y se aplican en `src/styles/tailwind.css`; ajusta ambos archivos si introduces nuevas familias.
- Reinicia el servidor de desarrollo después de agregar o sustituir archivos de fuente para que Vite sirva los assets actualizados.

### Contacto y redes

- Los canales de contacto (correo, donaciones y redes) se manejan desde `src/data/contact.json`.
- `SiteFooter.astro` renderiza las redes como botones circulares con íconos y etiquetas accesibles.
- `src/pages/posts/[...slug].astro` reutiliza las mismas redes para compartir publicaciones mediante botones de ícono único.
- El listado del blog (`src/pages/blog`) usa `paginate` para dividir las entradas en páginas de 12 ítems y enlaces generados con `createLocaleHref`.

## Documentación y changelog

La documentación técnica y el changelog se encuentran en la carpeta `docs/`.
Revisa `docs/README-usuario.md` para instrucciones de uso y `docs/CHANGELOG.md` para el historial de cambios agrupados.

---

**Changelog**
- 2025-11-14: Mejoras en autenticación del panel de moderación, documentación actualizada.
- Versión 0.1.2
