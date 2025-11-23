# Changelog PLOCOS

## [0.1.36] - 2025-11-22
### 🐛 Correcciones
- Se corrigió un error que impedía mostrar los comentarios en las publicaciones. La causa era una combinación de pre-renderizado de páginas y el paso de un `slug` incorrecto al componente de comentarios.
- Se actualizó la versión del proyecto a `0.1.36`.

### 📚 Documentación
- Se actualizó `TROUBLESHOOTING.md` con nuevas entradas sobre errores comunes y sus soluciones.


## [1.3.0] - 2025-11-16
### ✨ Cambios principales
- Refactor completo del header móvil y escritorio: distribución horizontal, responsive y accesible.
- Drawer de búsqueda en móvil con resultados en tiempo real y panel de resultados integrado.
- Corrección de eventos y asociación de elementos en el drawer móvil.
- Logs de depuración agregados al script de búsqueda.
- Mejoras en la documentación técnica y de usuario.

### 🐛 Correcciones
- El drawer de búsqueda en móvil ahora muestra y actualiza resultados correctamente.
- El header ya no se apila ni duplica elementos en ningún breakpoint.

### 📚 Documentación
- Actualización de README.md, guía de desarrollo local y guía de cliente.
- Nueva guía de usuario en `docs/README-usuario.md`.
