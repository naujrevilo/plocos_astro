# Guía de usuario PLOCOS

> **Documento vivo.** Para una vista completa de qué páginas existen y cómo se conectan, consulta [`docs/diagramas/user/arquitectura-informacion.md`](diagramas/user/arquitectura-informacion.md).

## Cambios recientes (v0.1.45)

- Nuevo pacto de lectura: 8 secciones (I–VIII) con texto literal del cliente, fecha 2 de septiembre de 2026.
- Sección I: Pacto Cognitivo (manifiesto editorial + taxonomía).
- Sección II: Naturaleza Transaccional (ánimo de lucro directo, mayoría de edad 18 años).
- Sección III: Propiedad Intelectual (Ley 23/1982, Decisión Andina 486, Convenio de Berna, licencia de consumo, obras en desarrollo).
- Sección IV: Protección Anti-IA (prohibición de minería de datos, finetuning, datasets).
- Sección V: Pagos, retracto y reembolsos (Ley 1480/2011).
- Sección VI: Limitaciones éticas y expulsión.
- Sección VII: Soberanía digital y privacidad (Ley 1581/2012, derechos ARCO).
- Sección VIII: Ley aplicable y jurisdicción (Cartagena de Indias).
- 8 nuevos markers `[EN: TODO legal review by Colombian attorney]` en la traducción al inglés.
- 14 markers pre-existentes preservados.
- Header rediseñado: logo más grande (h-32 w-32), margen inferior (mb-4).
- Sección "Nuestra razón de ser" con margen inferior ajustado.

Para detalles técnicos del cambio, ver [`openspec/changes/archived/pacto-cliente-y-autonomia-contenido/archive-report.md`](../openspec/changes/archived/pacto-cliente-y-autonomia-contenido/archive-report.md).
- El header móvil y escritorio ahora se distribuye horizontalmente y es totalmente responsive.
- El drawer de búsqueda en móvil funciona igual que el buscador de escritorio, mostrando resultados en tiempo real.
- Se agregaron logs de depuración para facilitar el diagnóstico de problemas en la búsqueda móvil.
- Mejoras de accesibilidad y usabilidad en todos los breakpoints.
- Mejoras en la moderación de comentarios.
- Panel de búsqueda más rápido.
- Corrección de errores menores.

## Cómo usar la búsqueda
- En escritorio: usa el campo de búsqueda en la barra superior para filtrar artículos y etiquetas.
- En móvil: pulsa el ícono de lupa para abrir el drawer, escribe tu consulta y verás los resultados en tiempo real.

## Navegación y cabecera
- El menú y los controles de idioma/theme se distribuyen horizontalmente y se adaptan al tamaño de pantalla.
- El menú hamburguesa solo aparece en móvil.

## Notas
- Si tienes problemas con la búsqueda en móvil, revisa la consola del navegador para ver logs de depuración.
- Para reportar errores, contacta al equipo técnico.

---
Actualizado: 2026-09-05
Versión: 0.1.45

## Ver también

- [`arquitectura.md`](arquitectura.md) — Vista técnica del proyecto
- [`diagramas/user/`](diagramas/user/) — Diagramas para usuarios y clientes
  - [`arquitectura-informacion.md`](diagramas/user/arquitectura-informacion.md) — Mapa del sitio
  - [`primera-visita.md`](diagramas/user/primera-visita.md) — Splash, cookies, consentimiento
  - [`como-comentar.md`](diagramas/user/como-comentar.md) — Flujo de moderación para ti
