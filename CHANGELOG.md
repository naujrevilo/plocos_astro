## 0.1.25 - 2025-11-20

### Fixes

- Corregido un error de hidratación en el componente de búsqueda (`Search.vue`) que impedía su correcto funcionamiento.
- Solucionado un error de tipo en la definición de `ContactData` en las páginas de contacto.

### Features

- Eliminado el formulario de donación y movido el botón de pago de PayPal exclusivamente a las páginas de contacto.

### Refactor

- Eliminadas las traducciones obsoletas relacionadas con donaciones del archivo `i18n.ts`.
- Refactorizado el pie de página (`SiteFooter.astro`) para eliminar el código de PayPal.

## 0.1.24 - 2025-11-19

### Features

- Se actualizó el script de importación de posts para usar la API v3 de Blogger, asegurando la correcta sincronización de 219 posts.
- Se limpiaron los posts duplicados y se normalizó la estructura de datos.
- Se actualizó el script que genera `posts.json` para que sea recursivo y refleje todos los posts importados.