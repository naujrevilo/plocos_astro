
# Guía para cliente (NO subir a GitHub)

## Cambios recientes (v0.1.5)

- **Mejora en la seguridad de la moderación**: Se ha eliminado el uso de tokens en la URL para la autenticación. Ahora se utiliza un sistema de cookies seguras, lo que hace que el proceso sea más seguro y transparente.
- **Redirección automática**: Al enviar un comentario, el usuario es redirigido a la página de inicio.
- **Mejora en la interfaz de usuario del formulario de comentarios**: El color del texto en el área de texto ha sido mejorado para una mejor legibilidad.

## Acceso y uso del panel de moderación
1. Ingresa a `/admin/login` para iniciar sesión.
2. Una vez que hayas iniciado sesión, serás redirigido al panel de moderación en `/admin/comments`.
3. Verás los comentarios pendientes y recientes.
4. Usa los botones para aprobar o eliminar comentarios.
5. Navega a la publicación para revisar el contexto antes de aprobar.

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
