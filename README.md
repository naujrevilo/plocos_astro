# Plocos — Archivo digital con Astro + TinaCMS

Sitio estático moderno que preserva el archivo histórico de [plocos.com](https://www.plocos.com/) usando Astro 5, Tailwind CSS 3 y TinaCMS 2 como panel editorial local. El repositorio contiene scripts de migración desde Blogger, colecciones tipadas y un flujo de trabajo local sin dependencias externas.

## Estado actual del proyecto

- **Framework**: Astro 5.15 con TypeScript habilitado mediante `astro:content`.
- **CMS local**: TinaCMS con panel React servido desde `public/admin/index.html`. El CLI levanta Astro y el backend GraphQL de Tina en puertos locales.
- **CSS**: Tailwind 3 con plugin de tipografía para maquetación de artículos.
- **Contenido**: markdown en `src/content/posts`, `src/content/categories` y `src/content/authors`, con sincronización opcional desde Blogger.
- **Imágenes**: bajo `public/images` (migradas) y `public/uploads` (nuevos assets del CMS).
- **Tipografía**: Pilas personalizadas con Noto Sans (cuerpo) y Sarala (títulos) servidas desde `public/fonts`.
- **UI social**: Botones de compartir y redes reducidos a íconos accesibles reutilizan el componente `SocialIcon`.
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

## Desarrollo local

1. Ejecuta `pnpm tinacms:dev` para lanzar Astro y el datalayer de TinaCMS.
2. Abre `http://localhost:4321/admin/index.html` (sirve el archivo de `public/admin`) y el panel cargará los assets desde `http://localhost:4101` mientras la API GraphQL escucha en `http://localhost:4001`.
3. Las ediciones se escriben directamente sobre los archivos Markdown del repositorio; no se requiere backend remoto.

> Nota: si los puertos 4321 u 4101 están ocupados, libera los procesos antes de iniciar TinaCMS (por ejemplo `npx kill-port 4321 4101 4001 9000`).

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
