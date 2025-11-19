# Guía de desarrollo local (NO subir a GitHub)

## Requisitos

- Node.js y pnpm instalados
- Archivo `.env.local` con credenciales reales (ver `.env.example`)
- No subir `.env.local` ni esta guía al repositorio

## Pasos para desarrollo

1. Instala dependencias: `pnpm install`
2. Inicia Astro en modo remoto (Turso): `pnpm dev --remote`
3. Accede al panel TinaCMS: `http://localhost:4321/admin/index.html`
4. Para moderar comentarios, visita `/admin/login` para iniciar sesión.
5. Una vez que hayas iniciado sesión, serás redirigido al panel de moderación en `/admin/comments`.

## Cambios recientes (v0.1.8)
- **Envío de comentarios como JSON**: El formulario de comentarios ahora envía los datos como `application/json` en lugar de `multipart/form-data`. Esto soluciona el error 415 Unsupported Media Type.
- **Redirección en el formulario de comentarios**: Después de enviar un comentario, el usuario es redirigido a la página de inicio.
- **Mejora en la interfaz de usuario del formulario de comentarios**: El color del texto en el área de texto ha sido mejorado para una mejor legibilidad.

## Troubleshooting

- Si el panel de moderación no muestra comentarios:
  - Verifica que las credenciales en `.env.local` son correctas.
  - Asegúrate de que la cookie se guarda (prueba en ventana privada).
  - El archivo `src/pages/admin/comments.astro` debe tener `export const prerender = false;`.
- Si no ves datos en Turso, asegúrate de usar `--remote` y que las credenciales sean válidas.
- Si los comentarios no se envían, verifica que la solicitud a `/api/comments` se esté realizando con el `Content-Type` correcto (`application/json`).

## Buenas prácticas

## Cambios recientes (v0.1.4)

- Header y menú móvil/escritorio refactorizados para mejor usabilidad.
- Drawer de búsqueda en móvil ahora funcional y con panel de resultados.
- Logs de depuración en el script de búsqueda.

## Correcciones en Sección de Comentarios (v0.1.5)

Se solucionaron varios errores en el componente `CommentSection.astro` que impedían la correcta visualización y funcionamiento del diseño actualizado.

**Causas:**

1.  **Sintaxis de TypeScript en script de cliente:** El uso de conversiones de tipo como `as HTMLElement` y `as DocumentFragment` en el script que se ejecuta en el navegador generaba errores de sintaxis, ya que los navegadores no interpretan TypeScript de forma nativa.
2.  **Errores tipográficos en clases de CSS:** Se encontraron y corrigieron erratas en las clases de utilidad de CSS (ej. `ease-in-out` en lugar de `ease-in-out`), lo que provocaba que los estilos de transición y foco no se aplicaran.

**Soluciones:**

- Se eliminó toda la sintaxis de TypeScript del script del lado del cliente para asegurar la compatibilidad con el navegador.
- Se corrigieron las clases de CSS para que los estilos se apliquen correctamente.
- Se implementó la lógica para mostrar inicialmente solo 5 comentarios y cargar los demás con un botón.

## Troubleshooting de Autenticación en Producción (v0.1.7)

**Problema:** No se puede acceder al panel de moderación de comentarios en el entorno de producción (ej. Netlify) después de introducir el token.

**Causa:**

1.  **Cookie Insegura en HTTPS:** La cookie de sesión se estaba configurando con `secure: false`, lo que hace que los navegadores la rechacen en un sitio que opera sobre HTTPS.
2.  **Variable de Entorno Ausente:** El token de moderación (`COMMENTS_MODERATION_TOKEN`) no estaba configurado en las variables de entorno del servidor de producción (Netlify).

**Solución:**

- Se modificó `src/pages/admin/comments.astro` para que la cookie se configure con `secure: import.meta.env.PROD`. Esto hace que la cookie sea segura en producción (`true`) y no segura en desarrollo (`false`).
- Se debe configurar manualmente la variable `COMMENTS_MODERATION_TOKEN` en el panel de administración de Netlify con el mismo valor que se usa en el archivo `.env` local.


