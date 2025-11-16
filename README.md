# Plocos — Archivo digital con Astro + TinaCMS

Sitio estático moderno que preserva el archivo histórico de [plocos.com](https://www.plocos.com/) usando Astro 5, Tailwind CSS 3 y TinaCMS 2 como panel editorial local. El repositorio contiene scripts de migración desde Blogger, colecciones tipadas y un flujo de trabajo local sin dependencias externas.


## Cambios recientes (v1.3.0)
- Refactor completo del header móvil y escritorio: distribución horizontal, responsive y accesible.
- Drawer de búsqueda en móvil con resultados en tiempo real y panel de resultados integrado.
- Corrección de eventos y asociación de elementos en el drawer móvil.
- Logs de depuración agregados al script de búsqueda.
- Mejoras en la documentación técnica y de usuario.

## Estado actual del proyecto

- **Framework**: Astro 5.15 con TypeScript habilitado mediante `astro:content`.
- **CMS local**: TinaCMS con panel React servido desde `public/admin/index.html`. El CLI levanta Astro y el backend GraphQL de Tina en puertos locales.
- **CSS**: Tailwind 3 con plugin de tipografía para maquetación de artículos.
- **Contenido**: markdown en `src/content/posts`, `src/content/categories` y `src/content/authors`, con sincronización opcional desde Blogger.
- **Imágenes**: bajo `public/images` (migradas) y `public/uploads` (nuevos assets del CMS).
- **Tipografía**: Pilas personalizadas con Noto Sans (cuerpo) y Sarala (títulos) servidas desde `public/fonts`.
- **UI social**: Botones de compartir y redes reducidos a íconos accesibles reutilizan el componente `SocialIcon`.
- **Comentarios**: Formularios moderados para cada post que persisten en Astro DB (libSQL/Turso) mediante el endpoint `/api/comments`.
- **Listado de blog**: `/blog` muestra 12 entradas recientes con paginación reutilizable (`paginate`) y navegación accesible.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `pnpm install` | Instala dependencias. |
| `pnpm dev` | Inicia Astro en `http://localhost:4321` (o el siguiente puerto libre). |
| `pnpm build` | Genera la versión de producción en `dist/`. |
| `pnpm preview` | Sirve el build generado para verificación local. |
| `pnpm import:plocos` | Repite la migración desde el feed de Blogger. |
| `pnpm tinacms:dev` | Ejecuta `tinacms dev -c "pnpm dev"` para iniciar Astro y el backend GraphQL de Tina; los assets del panel se sirven desde `http://localhost:4101`. |
| `pnpm tinacms:build` | Construye el panel de Tina para desplegarlo como SPA en `public/admin`. |


## Versión actual
**v1.3.0** — 16/11/2025

## Desarrollo local

1. Ejecuta `pnpm tinacms:dev` para lanzar Astro y el datalayer de TinaCMS.
2. Abre `http://localhost:4321/admin/index.html` (sirve el archivo de `public/admin`) y el panel cargará los assets desde `http://localhost:4101` mientras la API GraphQL escucha en `http://localhost:4001`.
3. Las ediciones se escriben directamente sobre los archivos Markdown del repositorio; no se requiere backend remoto.

> Nota: si los puertos 4321 u 4101 están ocupados, libera los procesos antes de iniciar TinaCMS (por ejemplo `npx kill-port 4321 4101 4001 9000`).

## Variables de entorno

- Duplica el archivo `.env.example` como `.env` y rellena los valores. El ID de Google Analytics (`ANALYTICS_ID`) es opcional; déjalo vacío para desactivar la medición.
- No subas jamás el `.env` al repositorio. `TINA_TOKEN` es un secreto con permisos de escritura y debe guardarse únicamente en gestores seguros (GitHub Secrets, Netlify Environment).
- En entornos locales añade las variables a `.env`; en CI/Netlify defínelas desde la interfaz de configuración.
- Para conectar Astro DB a Turso define `ASTRO_DB_REMOTE_URL` y `ASTRO_DB_APP_TOKEN`. Genera las credenciales con el CLI de Turso (`turso db show` / `turso db tokens create`) y ejecútalas en local y en el proveedor de hosting.
- Define un `COMMENTS_MODERATION_TOKEN` (cualquier cadena segura). El panel `/admin/comments` y el endpoint `/api/comments/moderate` lo usan para autenticar las acciones de aprobación/eliminación.

## Despliegue con Netlify + Tina Cloud

- Netlify usa el archivo `netlify.toml`; el comando de build ejecuta `pnpm run tinacms:build && pnpm build` y publica la carpeta `dist/`.
- Configura en Netlify (Site settings → Build & deploy → Environment) los valores:
  - `TINA_PUBLIC_CLIENT_ID` y `TINA_TOKEN` provistos por Tina Cloud.
  - `TINA_BRANCH` con la rama por defecto (`main`, salvo que uses otra).
  - `PUBLIC_SITE_URL` con la URL definitiva del sitio.
  - `ANALYTICS_ID` si usas GA4.
- Habilita “Deploy Previews” para revisar cambios de contenido en ramas antes de fusionarlos.
- La SPA del panel (`/admin`) queda disponible tras ejecutar `tinacms build`; Netlify aplica una redirección interna para permitir rutas internas del panel.

### Formularios de Netlify

- El formulario de contacto en `src/pages/contacto` y `src/pages/en/contact` usa Netlify Forms. Netlify detecta el formulario `name="contact"` durante el build porque incluye `data-netlify="true"`.
- No necesitas backend adicional: Netlify almacenará cada envío y permitirá configurar notificaciones por correo o integraciones (Slack, Zapier, etc.).
- Mantén activo el honeypot (`netlify-honeypot="bot-field"`) para reducir spam y habilita reCAPTCHA solo si los envíos maliciosos persisten.
- Para probar en local, ejecuta `netlify dev` o envía una petición desde la URL publicada; los formularios no se procesan fuera del entorno de Netlify.
- Para reenviar los envíos a Google Workspace (o cualquier buzón), usa **Site settings → Forms → Notification settings** en Netlify y añade una *Email notification* con la dirección deseada. Netlify enviará el correo y conservará el registro en el panel; recuerda mantener SPF/DKIM del dominio actuales para evitar que el mensaje caiga en spam.

### Comentarios moderados con Astro DB

- Cada publicación renderiza un formulario accesible (`CommentSection.astro`) que envía los comentarios a `/api/comments`.
- Los envíos se almacenan en la tabla `Comments` de Astro DB con `approved = false` por defecto. Solo los registros aprobados se muestran públicamente.
- En local puedes desarrollar con la base embebida de Astro DB; para producción necesitas un host libSQL (p. ej. Turso) y definir `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN`.
Para moderar sin CLI visita `/admin/comments?token=TU_TOKEN` (solo la primera vez). Al ingresar el token, este se guarda en una cookie httpOnly y se elimina inmediatamente de la URL para máxima privacidad. Nunca se muestra el token en el HTML ni se expone en la interfaz. Solo los usuarios autenticados pueden aprobar o eliminar comentarios pendientes y consultar actividad reciente. Si tienes problemas de autenticación en local, asegúrate de que la cookie se guarda correctamente y que la página no está prerenderizada (debe tener `export const prerender = false;`).
- Para aprobar un comentario, ejecuta un update contra la tabla: `pnpm astro db shell -- --query "UPDATE Comments SET approved = 1 WHERE id = ?" --remote` o crea un script en `db/` y lánzalo con `pnpm astro db execute ./path/to/script.ts -- --remote`.
- Ejecuta `pnpm astro db push -- --remote` cada vez que modifiques `db/config.ts` para sincronizar el esquema con tu instancia remota.

### GitHub Actions

- El workflow `/.github/workflows/ci.yml` valida cada push/PR a `main` ejecutando instalación, compilación del panel, `astro check` y `pnpm build`.
- Define los secretos `TINA_PUBLIC_CLIENT_ID` y `TINA_TOKEN` en *Settings → Secrets and variables → Actions*; sin ellos el pipeline fallará.
- Protege la rama `main` exigiendo revisiones y la ejecución satisfactoria del workflow antes de permitir merges.

### Consideraciones de seguridad

**¡Importante!** El `COMMENTS_MODERATION_TOKEN` nunca debe compartirse ni mostrarse en la interfaz, URL o HTML. Solo se almacena en una cookie httpOnly tras el login y se elimina de la URL automáticamente. Trátalo como un secreto crítico: no compartir por correo/IM, rotar ante cualquier sospecha y definirlo solo en gestores seguros (GitHub Secrets, Netlify Environment, .env local privado). Si tienes problemas de acceso al panel, revisa que la cookie se guarde correctamente y que el archivo tenga `export const prerender = false;`.

El `TINA_TOKEN` concede acceso de escritura al repositorio; trátalo como un secreto crítico (no compartir por correo/IM, rotarlo ante cualquier sospecha).
Restringe el acceso al panel de Tina Cloud a cuentas invitadas; no compartas credenciales genéricas.
Mantén activado 2FA en GitHub, Netlify y Tina Cloud.
Programa copias de seguridad periódicas del contenido (por ejemplo, etiquetas semanales o mirrors privados del repo) para recuperaciones rápidas ante errores humanos.

## Colecciones y esquema

El esquema de Tina se define en `tina/config.ts` y refleja la estructura actual del contenido:

- `posts`: campos principales (`title`, `pubDate`, `language`, `summary`, `author`, `label` como lista de etiquetas, `categories`, `heroImage`, `heroImageAlt`, `draft`, `translationKey`, `originalUrl`, `body`).
- `categories`: metadatos de categorías (`title`, `description`, `color`, `featured`, `body`).
- `authors`: fichas de autores (`title`, `role`, `bio`, `portrait`, `body`).

En paralelo, `src/content/config.ts` valida el frontmatter mediante Zod al momento de compilar Astro. Asegúrate de mantener ambos esquemas sincronizados cuando agregues campos.

### Personalizaciones del panel TinaCMS

- El selector de categorías usa un componente React (`tina/components/CategoryMultiSelect.tsx`) que consulta la API GraphQL local para mostrar las categorías disponibles en formato de casillas horizontal, guardando los slugs originales en frontmatter.
- El campo `body` de los posts está configurado como `rich-text`, habilitando un editor visual con formato enriquecido en el panel.
- El campo `heroImageAlt` permite registrar texto alternativo personalizado para la imagen destacada desde el panel, manteniendo un fallback automático con el título del post.

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
├─ admin/             # SPA generada por TinaCMS
└─ images/            # Activos migrados y cargas nuevas
scripts/              # Herramientas de migración y normalización (ignoradas en git)
```

## Flujo editorial actual

1. Levanta los servicios con `pnpm tinacms:dev`.
2. Edita o crea contenido desde el panel (`/admin/index.html`).
3. Confirma los cambios en los archivos Markdown del repositorio.
4. Ejecuta `pnpm build` únicamente cuando desees generar la salida estática para despliegue (no requerido para el flujo de edición).

## Mantenimiento y notas técnicas

- El importador (`scripts/import-plocos.js`) respeta rutas originales y evita duplicados de imágenes.
- Las utilidades en `scripts/*.mjs` permiten normalizar metadatos y recuperar fechas originales.
- Tailwind se configura vía `tailwind.config.js` y `src/styles/tailwind.css`; ahí viven las reglas de color, fuentes y utilidades globales.
- Los assets del panel (desarrollo) viven en `http://localhost:4101`; verifica firewall o proxys si el panel no carga.
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

## Próximos pasos sugeridos

- Revisar la alineación entre `tina/config.ts` y `src/content/config.ts` al añadir campos nuevos.
- Automatizar la limpieza de imágenes huérfanas dentro de `public/images/uploads` si el flujo editorial lo requiere.
- Evaluar despliegues estáticos en servicios compatibles con Astro (por ejemplo, Vercel, Netlify o Cloudflare Pages).

---

**Changelog**
- 2025-11-14: Mejoras en autenticación del panel de moderación, documentación actualizada, troubleshooting añadido, guías separadas para desarrollo y cliente.
- Versión: 1.1
