
# Guía para cliente (NO subir a GitHub)

## Cambios recientes (v0.1.4)
- Header y menú móvil/escritorio rediseñados para mejor navegación.
- Drawer de búsqueda en móvil ahora funcional y muestra resultados.
- Logs de depuración en el script de búsqueda.
- Mejoras en la moderación de comentarios.
- Panel de búsqueda más rápido.
- Corrección de errores menores.

## Acceso y uso del panel de moderación
1. Ingresa a `/admin/comments?token=TU_TOKEN` (solo la primera vez)
2. El token se guarda en una cookie segura y la URL se limpia automáticamente
3. Verás los comentarios pendientes y recientes
4. Usa los botones para aprobar o eliminar comentarios
5. Navega a la publicación para revisar el contexto antes de aprobar

## Buenas prácticas de moderación
- Nunca compartas el token por correo, chat o medios inseguros
- El token solo debe estar en tu entorno local o gestor seguro
- Si pierdes el acceso, solicita un nuevo token al equipo técnico
- Revisa siempre el contexto del comentario antes de aprobar
- Elimina comentarios que no cumplan las normas del sitio

## Seguridad
- El token nunca se muestra en la interfaz ni en la URL tras el login
- Si tienes problemas de acceso, recarga la página o prueba en ventana privada
- Ante cualquier duda, contacta al equipo técnico

---
Actualizado: 2025-11-16
Versión: 1.3.0
