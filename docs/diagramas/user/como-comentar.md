# Cómo Moderar Comentarios — Para el Cliente

> Esta guía está pensada para quien maneja el día a día del sitio (tú, el cliente). El equipo técnico se encarga de toda la configuración del servidor y las bases de datos. Tú solo necesitas saber cómo entrar al panel y aprobar o eliminar comments.

## Tu flujo diario

```mermaid
flowchart TD
    Start[Inicio del día] --> Check{¿Tienes tu<br/>token a mano?}
    Check -->|no| PedirToken[Pídele tu token<br/>al equipo técnico]
    Check -->|sí| Login["Abre /admin/login"]
    Login --> PegarToken["Pega el token en el campo"]
    PegarToken --> Submit["Click 'Sign In'"]

    Submit --> TokenCheck{¿Token<br/>correcto?}
    TokenCheck -->|sí| Panel["✓ Acceso al panel"]
    TokenCheck -->|no| Error["✗ Vuelve a intentar<br/>(recarga la página)"]

    Panel --> VerListas["📋 Ves 2 secciones:<br/>Pendientes y Aprobados"]
    VerListas --> HayPending{¿Hay<br/>pendientes?}
    HayPending -->|sí| Review["Lee cada comment<br/>+ revisa el post original"]
    HayPending -->|no| Fin["✓ Nada que hacer hoy"]

    Review --> Decision{¿Qué decides?}
    Decision -->|Aprobar| ClickAprobar["Click verde 'Aprobar'"]
    Decision -->|Eliminar| ClickEliminar["Click rojo 'Eliminar'"]
    Decision -->|Duda| VerContexto["Abre el post desde el link<br/>para leer contexto"]
    VerContexto --> Decision

    ClickAprobar --> Visible["✓ Comment ahora es público"]
    ClickEliminar --> Borrado["✓ Comment eliminado permanentemente"]
```

## Tu lista de pendientes

```mermaid
graph TD
    Comment["📨 Comment pendiente"] --> Meta["📅 Fecha + nombre del autor"]
    Comment --> Texto["💬 Lo que escribió el usuario"]
    Comment --> Botones["2 botones:<br/>✓ Aprobar (verde)<br/>🗑 Eliminar (rojo)"]

    Botones --> Aprobar["Click ✓ Aprobar<br/>→ Visible al público"]
    Botones --> Eliminar["Click 🗑 Eliminar<br/>→ Borrado permanente"]
    Botones --> Link["Click en el nombre del post<br/>(link arriba del comment)<br/>→ Abre el post en otra pestaña"]

    Aprobar --> Resultado1["El usuario ve su comment<br/>en el post"]
    Eliminar --> Resultado2["El comment desaparece<br/>de la base de datos"]
    Link --> Contexto["Lee el artículo completo<br/>para decidir mejor"]
```

## Tu token de acceso

Tu token es una llave secreta que te da acceso al panel. Es como una contraseña, pero más larga.

```mermaid
graph LR
    Token["🔑 Tu token"] --> Sirve["¿Para qué sirve?"]
    Sirve --> A["✅ Aprobar comments"]
    Sirve --> B["✅ Eliminar comments"]
    Sirve --> C["✅ Ver todos los comments<br/>(pendientes y aprobados)"]
    Sirve --> D["❌ NO sirve para editar el sitio,<br/>cambiar el pacto, ni ver datos de usuarios"]

    Token --> Donde["¿Dónde está?"]
    Donde --> TuOrdenador["Lo tienes guardado en un<br/>lugar seguro (papel, gestor<br/>de contraseñas, etc.)"]
```

**No tienes que preocuparte por dónde está guardado en el servidor.** El equipo técnico se encarga de eso. Si pierdes tu token, pídelo al equipo técnico y ellos te dan uno nuevo.

## Buenas prácticas de moderación

### ✅ Cosas que hacer

- **Lee el contexto antes de aprobar.** Si un comment dice algo que parece fuerte, abre el post desde el link para entender el contexto completo.
- **Sé consistente.** Si apruebas críticas constructivas, aprueba todas las similares.
- **Borra spam obvious** (links raros, texto sin sentido, otros idiomas).
- **Trabaja en sesiones cortas.** Si tienes muchos pendientes, tomate descansos.

### ❌ Cosas que NO hacer

- **No compartas tu token** con nadie por correo, chat, redes sociales, ni ningún medio inseguro.
- **No lo pegues en la URL** (el sistema lo protege automáticamente con cookies seguras).
- **No apruebes comments que rompan las reglas** del pacto (sección VI del pacto: spam, daño físico, ilegalidad, difamación sin fundamento).
- **No borres comments solo porque no estés de acuerdo.** El sitio es filosófico y las críticas son bienvenidas si son respetuosas.

## Qué pasa cuando apruebas un comment

```mermaid
flowchart LR
    Aprobar["✓ Aprobar"] --> Publico["Se muestra en el post<br/>(visible para todos)"]
    Publico --> Notificacion["Si otro tab tiene el post abierto,<br/>se actualiza sin recargar"]
```

## Qué pasa cuando eliminas un comment

```mermaid
flowchart LR
    Eliminar["🗑 Eliminar"] --> Borrado["Se borra de la base de datos"]
    Borrado --> Invisible["No aparece en ninguna parte:<br/>ni en el post, ni en búsqueda,<br/>ni en el panel"]
```

## Si algo no funciona

| Síntoma | Qué hacer |
|---|---|
| "Failed to moderate" (mensaje en pantalla) | Recarga la página y vuelve a hacer login |
| No puedo entrar a `/admin/login` | Pide tu token al equipo técnico |
| La página de moderación no carga | Pide ayuda al equipo técnico |
| Olvidé mi token | Pide uno nuevo al equipo técnico |

**Regla simple**: si algo falla, no intentes arreglarlo tú. Avísale al equipo técnico. Ellos saben qué hacer.

## Anti-spam automático

El sistema ya bloquea la mayoría de bots automáticamente con un truco invisible. Tú no tienes que hacer nada especial — los bots ni siquiera llegan a tu panel.

## Resumen rápido

| Quiero... | Hago esto... |
|---|---|
| Entrar al panel | Abro `/admin/login`, pego mi token, click "Sign In" |
| Ver comments pendientes | Voy a `/admin/comments`, sección "Pendientes" |
| Aprobar un comment | Click en el botón verde ✓ |
| Eliminar un comment | Click en el botón rojo 🗑 |
| Ver el contexto del comment | Click en el link del post (arriba del comment) |
| Ver comments ya aprobados | Voy a `/admin/comments`, sección "Aprobados" |
| Cambiar mi token | Se lo pido al equipo técnico |

---

Si tienes preguntas sobre el **por qué** de las decisiones del sistema, pregúntale al equipo técnico. Esta guía es para tu uso diario, no para entender la implementación.

Última actualización: 2026-09-05
