# Troubleshooting TinaCMS

Este documento resume los problemas encontrados y las soluciones aplicadas durante la configuración y el desarrollo con TinaCMS.

## 1. La interfaz de TinaCMS se queda en "Loading data..."

- **Síntoma:** La interfaz de administración de TinaCMS se quedaba atascada en la pantalla de carga y no mostraba el contenido.
- **Causa:** Desajustes entre el esquema de TinaCMS (`tina/config.ts`) y la estructura de los archivos de contenido.
- **Solución:**
    1. Se ajustó el esquema de la colección de `authors` para que utilizara el formato `md` en lugar de `json`.
    2. Se modificó el campo `category` en la colección de `posts` para que aceptara un solo valor en lugar de una lista.
    3. Se marcó el campo `language` como no obligatorio para evitar conflictos con archivos antiguos que no lo incluían.

## 2. Advertencia de ordenamiento por un campo no obligatorio

- **Síntoma:** La interfaz de TinaCMS mostraba la advertencia: "Sorting on a non-required field. Some documents may be excluded".
- **Causa:** El campo `pubDate`, utilizado para ordenar las publicaciones, no estaba marcado como obligatorio.
- **Solución:** Se añadió la propiedad `required: true` al campo `pubDate` en el esquema de la colección de `posts`.

## 3. Error de conexión con Turso: `Unexpected status code 400`

- **Síntoma:** Los scripts que intentaban conectar con la base de datos de Turso fallaban con el error `Unexpected status code while fetching migration jobs: 400`.
- **Causa:** Una versión obsoleta o con errores de `@libsql/client` instalada como sub-dependencia.
- **Solución:** Se forzó la actualización de `@libsql/client` a la versión `0.15.15` mediante la propiedad `pnpm.overrides` en `package.json`.

## 4. Error de TypeScript: `Cannot find module 'drizzle-orm'`

- **Síntoma:** El servidor de TypeScript no podía resolver el módulo `drizzle-orm`, provocando errores de tipo en los archivos que lo importaban.
- **Causa:** El servidor de TypeScript del IDE no había recargado los nuevos módulos instalados.
- **Solución:** Se forzó un reinicio del servidor de TypeScript realizando un cambio trivial (añadir y eliminar un comentario) en el archivo `tsconfig.json`.

## 5. Los comentarios no se mostraban en las publicaciones

- **Síntoma:** Los comentarios aprobados no aparecían en las páginas de las publicaciones.
- **Causas:**
    1. Las páginas de las publicaciones se estaban pre-renderizando (`export const prerender = true;`), lo que impedía la ejecución del script del lado del cliente que carga los comentarios.
    2. Se estaba pasando un identificador incorrecto (`post.id`) al componente `CommentSection` en lugar del `post.slug` esperado.
- **Solución:**
    1. Se cambió la configuración a `export const prerender = false;` en `src/pages/blog/[...slug].astro`.
    2. Se corrigió la llamada al componente para pasar `post.slug` como prop: `<CommentSection slug={post.slug} locale={locale} />`.
