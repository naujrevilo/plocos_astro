# Guía de desarrollo local (NO subir a GitHub)

## Requisitos

- Node.js y pnpm instalados
- Archivo `.env.local` con credenciales reales (ver `.env.example`)
- No subir `.env.local` ni esta guía al repositorio

## Pasos para desarrollo

1. Instala dependencias: `pnpm install`
2. Inicia Astro en modo remoto (Turso): `pnpm dev --remote`
3. Accede al panel TinaCMS: `http://localhost:4321/admin/index.html`
4. Para moderar comentarios, visita `/admin/comments?token=TU_TOKEN` (solo la primera vez)
5. El token se guarda en cookie httpOnly y la URL se limpia automáticamente

## Troubleshooting

- Si el panel de moderación no muestra comentarios tras ingresar el token:
  - Verifica que el token en `.env.local` es correcto
  - Asegúrate de que la cookie se guarda (prueba en ventana privada)
  - El archivo `src/pages/admin/comments.astro` debe tener `export const prerender = false;`
  - En local, la opción `secure: false` para la cookie permite guardar en http
- Si no ves datos en Turso, asegúrate de usar `--remote` y que las credenciales sean válidas

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


