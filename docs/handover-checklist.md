# Plocos — Checklist de entrega al cliente

> Documento operativo para la sesión de handover. No incluye el código ni decisiones técnicas; solo pasos y verificaciones.

## 0. Resumen

| Dato | Valor |
|---|---|
| Fecha de entrega | _a confirmar_ |
| Repositorio origen | `naujrevilo/plocos_astro` (cuenta del actual desarrollador) |
| Repositorio destino | `<USERNAME>/plocos_astro` (cuenta del cliente) |
| Hosting | Netlify (plan Free) |
| DB | Turso (libSQL) |
| Búsqueda | Algolia (plan Free) |
| Email transaccional | Resend (plan Free) |
| Comentarios/CMS | Markdown nativo en `src/content/`, **sin TinaCMS** (fuera de scope por decisión del cliente) |

## 1. Issues conocidos que se arreglaron / están pendientes

### 1.1 Algolia — variables de entorno mal alineadas (ARREGLADO en `20cc57d`)

El sistema de búsqueda está wired pero las variables entre `.env.local` y el código tenían nombres distintos, por lo que **tanto el sync de indexación como la búsqueda del cliente estaban rotos silenciosamente**:

- **Servidor** esperaba `ALGOLIA_ADMIN_KEY` → ahora `ALGOLIA_WRITE_API_KEY`
- **Cliente** esperaba `PUBLIC_ALGOLIA_*` → correcto (Astro requiere `PUBLIC_` para exponer al bundle JS)
- **CI** (`.github/workflows/algolia-sync.yml`) → actualizado

**Acción local del desarrollador actual** (no automática, requiere editar `.env.local`):
```diff
- ALGOLIA_API_KEY=807fe3cb46c0dec88f04657ceb8bb43f
+ PUBLIC_ALGOLIA_SEARCH_API_KEY=807fe3cb46c0dec88f04657ceb8bb43f
```
El resto (`ALGOLIA_APP_ID`, `ALGOLIA_WRITE_API_KEY`, `ALGOLIA_INDEX_NAME`) ya tienen los nombres correctos.

### 1.2 Email notification — captura lista, envío no implementado

El flag `notifyAuthor` se persiste correctamente al rechazar un comentario con "Avisar al autor" marcado en el modal. **Falta** el envío real del email (ver §6).

### 1.3 TinaCMS — explícitamente fuera

No debe haber ninguna referencia a TinaCMS en código, env vars, ni workflows. Confirmado: solo queda una mención histórica en `docs/guia-desarrollo-local.md` (línea 18) explicando que fue removido, la cual **se mantiene** como contexto.

---

## 2. Pre-reunión (preparación por el desarrollador actual)

- [ ] Confirmar que `main` está pusheado y sin cambios locales sin commitear (excepto `package.json` / `pnpm-lock.yaml` que contienen los upgrades de deps pendientes)
- [ ] Limpiar ramas locales y tags obsoletos
- [ ] Anotar el `COMMENTS_MODERATION_TOKEN` actual (referencia; se va a rotar post-entrega)
- [ ] Exportar la lista completa de env vars configuradas en Netlify (Site settings → Environment variables)
- [ ] Exportar la lista de GitHub Secrets del repo actual (Settings → Secrets and variables → Actions)
- [ ] Guardar el `ALGOLIA_WRITE_API_KEY` y `PUBLIC_ALGOLIA_SEARCH_API_KEY` actuales para no perderlos durante la transferencia

## 3. Reunión de entrega — agenda

### 3.1 Demo (15 min)
- [ ] Mostrar `/admin/comments` (Mass Moderation UI)
- [ ] Mostrar `/admin` (dashboard con stats)
- [ ] Demo end-to-end: enviar un comentario de prueba, moderar, ver reflejos en dashboard
- [ ] Verificar búsqueda en el sitio público (si la DB y Algolia están funcionando)

### 3.2 GitHub — Transfer del repo (10 min)
- [ ] **Desarrollador actual**: en `naujrevilo/plocos_astro`, Settings → General → Danger Zone → "Transfer ownership"
- [ ] Ingresar el username del cliente y nombre del repo (`plocos_astro`)
- [ ] Confirmar escribiendo el nombre del repo
- [ ] Ingresar 2FA
- [ ] **Cliente**: acepta el transfer desde el email que GitHub le envía
- [ ] **Desarrollador actual**: actualizar remote local:
  ```bash
  git remote set-url origin https://github.com/<CLIENT_USERNAME>/plocos_astro.git
  git remote -v  # verificar
  ```

### 3.3 Netlify — Crear cuenta + Transfer site (15 min)
- [ ] **Cliente**: crear cuenta en [netlify.com](https://netlify.com) con su email
- [ ] **Desarrollador actual**: Site settings → "Transfer site" → escribir email del cliente
- [ ] **Cliente**: aceptar desde su email
- [ ] Verificar que las env vars se transfirieron correctamente (Site settings → Environment variables)
- [ ] Si hay dominio custom: el cliente debe iniciar la transferencia del dominio en su registrar

### 3.4 Algolia — Crear cuenta + Fix de env vars + Reindex (20 min)
- [ ] **Cliente**: crear cuenta en [algolia.com](https://www.algolia.com/) (Free plan)
- [ ] Decidir estrategia:
  - **Opción A** (recomendada): cliente crea índice nuevo, el dev actual reindexa desde el repo con la API key del cliente
  - **Opción B**: cliente te agrega como Editor en su índice existente y transferís ownership después
- [ ] En `.env.local` del cliente (que va a crear desde `.env.example`):
  ```
  ALGOLIA_APP_ID=<del cliente>
  ALGOLIA_WRITE_API_KEY=<admin key del cliente>
  PUBLIC_ALGOLIA_APP_ID=<mismo que arriba>
  PUBLIC_ALGOLIA_SEARCH_API_KEY=<search-only key del cliente>
  PUBLIC_ALGOLIA_INDEX_NAME=<índice del cliente>
  ```
- [ ] En GitHub Secrets del repo transferido:
  ```
  ALGOLIA_APP_ID
  ALGOLIA_WRITE_API_KEY
  ALGOLIA_INDEX_NAME
  ```
- [ ] Reindexar: push a main → triggerea `algolia-sync.yml`. Verificar que la búsqueda funciona en producción.

### 3.5 Resend — Crear cuenta + Verificar dominio (10 min)
- [ ] **Cliente**: crear cuenta en [resend.com](https://resend.com) (Free: 100 emails/día, 3000/mes)
- [ ] Agregar y verificar el dominio de envío (Resend genera registros DKIM/SPF para el DNS del cliente)
- [ ] Generar API key con permisos de envío
- [ ] Guardar en Netlify env vars del sitio del cliente:
  ```
  RESEND_API_KEY=<key>
  RESEND_FROM_EMAIL=noreply@<dominio-del-cliente>
  ```

### 3.6 Otros servicios (10 min)
- [ ] **Turso**: crear cuenta en [turso.tech](https://turso.tech/), crear nueva DB, **transferir los datos** ejecutando la migración en la DB nueva
- [ ] **Google Analytics**: si el cliente tiene cuenta, agregar la propiedad nueva y dar acceso; si no, crear propiedad
- [ ] **Dominio custom** (si Plocos usa dominio propio): iniciar transferencia en el registrar al cliente

### 3.7 Decisiones con el cliente (5 min)
- [ ] Email principal para notificaciones de Netlify, Algolia, Resend
- [ ] ¿Rotar `COMMENTS_MODERATION_TOKEN` ahora o después?
- [ ] Plan de mantenimiento continuo (quién paga Netlify, Algolia, Resend si hay costos)

---

## 4. Post-reunión (todo)

### 4.1 Inmediato (primer día)
- [ ] Verificar que `main` corre limpio en CI del repo transferido
- [ ] Verificar deploys automáticos en Netlify después de push
- [ ] Verificar que el dashboard `/admin` muestra los counts reales
- [ ] Verificar que la búsqueda funciona (post fix de env vars)

### 4.2 Email notification feature (cuando cliente decida)
- [ ] Agregar SDK de Resend al `package.json` (`pnpm add resend`)
- [ ] Crear `src/lib/resend.ts` con helper para enviar emails
- [ ] Modificar `/api/comments/moderate` para triggear el envío cuando `action` es `reject` o `spam` con `notifyAuthor=1`
- [ ] Crear template HTML del email (incluir el nombre del autor, el comentario, la razón de rechazo, link al post si aplica)
- [ ] Test con email real del cliente
- [ ] Documentar el feature en CHANGELOG

### 4.3 Limpieza (cuando sea estable)
- [ ] Rotar `COMMENTS_MODERATION_TOKEN` (generar nuevo, actualizar en Netlify env vars)
- [ ] Actualizar `.env.example` si hace falta reflejar cambios del cliente
- [ ] Actualizar `README.md` con la nueva URL del repo (`<CLIENT_USERNAME>/plocos_astro`)
- [ ] Documentar el handover en `docs/handover-YYYY-MM-DD.md`

---

## 5. Cuentas a crear (resumen)

| Servicio | Quién crea | Plan | Costo |
|---|---|---|---|
| GitHub (destino) | Cliente | Free | $0 |
| Netlify | Cliente | Free | $0 |
| Algolia | Cliente | Free (10k records) | $0 |
| Resend | Cliente | Free (3k/mes) | $0 |
| Turso | Cliente | Free (500MB) | $0 |
| Google Analytics | Cliente | Free | $0 |

---

## 6. Email notification — referencia de implementación (futuro)

Pseudocódigo del trigger que va después del update en `/api/comments/moderate`:

```ts
if ((action === 'reject' || action === 'spam') && notifyAuthor === 1 && comment.email) {
  await sendRejectionEmail({
    to: comment.email,
    authorName: comment.name,
    postSlug: comment.postSlug,
    reason: rejectionReason, // 'general' | 'spam' | 'harmful' | ...
    postTitle: lookupPostTitle(comment.postSlug),
  });
}
```

**Template del email** (HTML mínimo en español):
- Asunto: "Tu comentario en {postTitle} no fue aprobado"
- Body: explicación de la razón, link al post si quiere revisar el contexto, link de contacto

**Costo esperado**: ~$0 al inicio con Resend Free. Si crece el volumen (>3k emails/mes), upgrade a plan Pro de Resend ($20/mes por 50k emails).
