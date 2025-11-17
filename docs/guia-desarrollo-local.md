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


