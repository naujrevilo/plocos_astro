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