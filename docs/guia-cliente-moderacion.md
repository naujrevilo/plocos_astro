
# Guía para cliente

> **Tu guía de moderación de comentarios.** Para una vista completa del flujo con diagramas, consulta [`diagramas/user/como-comentar.md`](diagramas/user/como-comentar.md).

## Cambios recientes (v0.1.45)

- **Mejora en la seguridad de la moderación**: Se ha eliminado el uso de tokens en la URL para la autenticación. Ahora se utiliza un sistema de cookies seguras, lo que hace que el proceso sea más seguro y transparente.
- **Redirección automática**: Al enviar un comentario, el usuario es redirigido a la página de inicio.
- **Mejora en la interfaz de usuario del formulario de comentarios**: El color del texto en el área de texto ha sido mejorado para una mejor legibilidad.

## Acceso y uso del panel de moderación
1. Ingresa a `/admin/login` para iniciar sesión.
2. Pega tu `COMMENTS_MODERATION_TOKEN` (lo tienes en tu `.env.local` o te lo pasó el equipo técnico).
3. Una vez que hayas iniciado sesión, serás redirigido al panel de moderación en `/admin/comments`.
4. Verás dos secciones: **Pendientes** (amarillo) y **Aprobados** (verde).
5. Para cada comment pendiente, click en el link del post para ver contexto, luego "Aprobar" o "Eliminar".

Ver el flujo completo con diagrama en [`diagramas/user/como-comentar.md`](diagramas/user/como-comentar.md).

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
Actualizado: 2026-09-05
Versión: 1.4.0

## Ver también

- [`diagramas/user/como-comentar.md`](diagramas/user/como-comentar.md) — Tu flujo diario con diagrama
