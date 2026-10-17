# Guía de desarrollo local — Plocos / Nomás que la Vida

> **Documento de desarrollo.** Para la arquitectura completa, ver
> [`arquitectura.md`](arquitectura.md). Para el flujo de suscripciones con
> MercadoPago, ver [`diagramas/dev/suscripcion-mercadopago.md`](diagramas/dev/suscripcion-mercadopago.md).

## Requisitos

- Node.js + pnpm
- Cuenta de Clerk (instancia de **desarrollo**)
- Cuenta de MercadoPago con app de **Suscripciones** creada
- `cloudflared` instalado (`winget install --id Cloudflare.cloudflared -e`)
- `.env.local` completo (ver [.env.example](../.env.example))

## Arranque básico

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm test       # vitest — 307 tests
pnpm build      # verify:pacto + astro build
```

## Variables de entorno

> **Regla crítica:** las vars de `.env.local` están en `import.meta.env`,
> **no** en `process.env`. Si una var no se lee, ese es el primer sospechoso.

| Variable | De dónde sale |
|---|---|
| `PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Dashboard Clerk → API Keys |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Dashboard Clerk → Webhooks → signing secret |
| `MERCADOPAGO_PUBLIC_KEY` / `MERCADOPAGO_ACCESS_TOKEN` | Panel MP → Tus integraciones → tu app → Credenciales de **prueba** |
| `MERCADOPAGO_WEBHOOK_SECRET` | Panel MP → Notificaciones → Webhooks → **Clave secreta** (misma pestaña donde registrás la URL) |
| `MERCADOPAGO_PRICE_LECTOR` / `MERCADOPAGO_PRICE_COLABORADOR` | Decisión de producto (COP/mes, mínimo $1.600) |
| `ASTRO_DB_REMOTE_URL` / `ASTRO_DB_APP_TOKEN` | Turso → base `plocos` |

**Después de editar `.env.local`: reiniciá `pnpm dev`.** Las vars se leen al
arrancar.

## Configuración de Clerk (instancia dev)

1. **Métodos de acceso:** email + username + password. Verificación de email
   al signup **OFF** (los emails de prueba de MP no tienen buzón real).
2. **Device Trust: OFF** — si está ON, cada sign-in desde un "nuevo device"
   pide un código que nadie recibe.
3. **NO crees Organizations.** Los roles son globales por usuario vía
   `publicMetadata.role` (`lector` | `colaborador` | `auditor`). El código
   (`src/lib/access.ts`) ya lo lee del JWT.
4. **Webhook:** URL `https://<túnel>/api/webhooks/clerk` con eventos
   `user.created`, `user.updated`, `user.deleted` (mirror a Turso).
5. **Production instance:** exige dominio custom (Clerk no permite
   `*.accounts.dev` en prod). Requiere el dominio del cliente + registros
   CNAME. No bloquea el desarrollo.

## Configuración de MercadoPago (modo test)

1. **App:** panel → Tus integraciones → app de Suscripciones.
2. **Credenciales de prueba:** copiá `PUBLIC_KEY` y `ACCESS_TOKEN`.
3. **Webhook:** Notificaciones → Webhooks (pestaña *Modo de prueba*) →
   URL del túnel + `/api/webhooks/mercadopago`, evento **"Planes y
   suscripciones"**. Copiá la **Clave secreta** a `.env.local`.
4. **Cuentas de prueba:** mínimo 1 Vendedor (tu cuenta) + 1 Comprador.
   Si el panel no muestra el email del comprador, crealo por API:

   ```powershell
   curl.exe -s -X POST -H "Authorization: Bearer $env:MERCADOPAGO_ACCESS_TOKEN" `
     -H "Content-Type: application/json" `
     -d '{\"site_id\":\"MCO\"}' https://api.mercadopago.com/users/test_user
   ```

   La respuesta incluye `email` + `password` (eso resuelve el problema del
   email faltante).
5. **Tarjetas de prueba:** Visa `4013 5406 8274 6260` (crédito), CVV `123`,
   venc `11/30`. El resultado lo controla el **nombre del titular**:
   `APRO` = aprobado, `OTHE` = rechazado, `CALL` = pendiente, `FUND` = sin
   fondos. DNI `123456789`.

## El túnel y la regla de oro: localhost para navegar, túnel para webhooks

**El browser NUNCA navega por el túnel. El túnel existe solo para que MP y
Clerk entreguen webhooks a tu dev server.**

```powershell
cloudflared tunnel --url http://localhost:4321
# → https://algo-random.trycloudflare.com
# → ESA URL va en la config de webhooks de MP y de Clerk
```

**Por qué:** la instancia dev de Clerk rechaza con **403** los requests
autenticados desde orígenes que no están en su allowlist (solo `localhost`
por defecto). Si navegás por el túnel, el verify del checkout muere en 403.

**Gotchas del quick tunnel:**
- La URL **cambia en cada reinicio** de cloudflared → hay que actualizar la
  URL en el panel de MP (y de Clerk) cada vez.
- Si el dev server está apagado cuando MP reintenta, los reintentos se
  agotan y el webhook se pierde. Por eso existe la reconciliación (ver abajo).

## Flujo de prueba de suscripción end-to-end

1. `pnpm dev` + `cloudflared tunnel --url http://localhost:4321` + URL actualizada en MP
2. Navegador en **`http://localhost:4321`** (NO el túnel)
3. Crear cuenta Clerk con el email del comprador de prueba
4. `/suscripcion` → "Suscribirme como Colaborador"
5. Checkout de MP: login con el comprador de prueba → tarjeta test con titular `APRO`
6. Vuelta a `/suscripcion?status=success` → **reconciliación automática**:
   el server consulta MP por `external_reference` (tu Clerk user id) y si la
   suscripción está `authorized` activa el rol sin depender del webhook
7. Refrescá: el header muestra "Leer el libro" / "Aportar" y en Clerk el
   Public metadata queda `{"role": "colaborador"}`

La reconciliación (`POST /api/suscripcion/verify`) es idempotente y convive
con el webhook: cualquiera de los dos caminos activa; el segundo es no-op.

## Paywall

- `src/lib/paywall.ts`: gatea `/libro/<año>/<ciclo>/<capítulo>` (ES+EN) para
  los tres roles pago. Los índices de año/ciclo y la intro son públicos.
- Para probar: cambiá `publicMetadata.role` en el dashboard de Clerk
  (Users → tu user → Metadata → Public) entre `lector`, `colaborador`,
  vacío y mirá el acceso al capítulo y los member links del header.

## Pipeline de build

```bash
pnpm verify:pacto   # corre antes de build; SHA-256 del pacto
pnpm build --remote
pnpm preview
```

## TDD

- Runner: **Vitest** (`pnpm test`). Los tests viven en `tests/**/*.test.ts`
  con el naming `tXX-<feature>.test.ts`.
- 307 tests al día de hoy. Cada tarea del feature doc tiene su suite.

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN is not set` | Var leída de `process.env` | Reiniciar dev server; usar `import.meta.env` |
| Webhook MP → `400 hmac_mismatch` | Secret incorrecta (pestaña prueba ≠ productivo) | Copiar la "Clave secreta" de la MISMA pestaña donde registraste la URL |
| Webhook MP → 403 | Endpoint no existe / tunnel muerto | Ver `pnpm dev` corriendo y túnel vivo |
| Checkout → "card_token_id is required" | Se intentó crear preapproval asociado a plan del panel | Usar el modelo sin plan (ya implementado) |
| Checkout → `Cannot pay an amount lower than $1600` | Monto bajo el mínimo COP | Subir `MERCADOPAGO_PRICE_*` |
| Verify → 403 | Navegando por el túnel (Clerk bloquea el origen) | Navegar por `localhost:4321` |
| Rol no cambia tras pagar | Webhook perdido + reconciliación no corrida | Volver a `/suscripcion?status=success` con sesión |
| `Cannot use 'in' operator to search for 'locals'` | `clerkClient()` sin contexto | `clerkClient(AstroContext)` |
| Clerk pide código de verificación al entrar | Device Trust ON o Verify-at-signup ON | Ambos OFF en la instancia dev |
| `astro check` nuevo error | Regresión | Bloquear PR |

## Reglas de operación para el asistente de IA

> Guardadas también como preferencia personal (engram). Aplican a sesiones
> con agentes de IA en este repo.

- **No ejecutar servers** (`pnpm dev`, `astro preview`, `netlify dev`) ni
  matar procesos (`Stop-Process node`) — el developer los maneja.
- No hacer fetch a `localhost:*` para "verificar renders".
- Permitido: `pnpm build`, `pnpm test`, git, lectura de archivos, probes a
  APIs externas (MP) con credenciales de test.

## Ver también

- [`arquitectura.md`](arquitectura.md) — vista general y decisiones
- [`diagramas/dev/suscripcion-mercadopago.md`](diagramas/dev/suscripcion-mercadopago.md) — flujo completo + catálogo de gotchas
- [`diagramas/dev/env-vars-vite6.md`](diagramas/dev/env-vars-vite6.md) — la lección de `import.meta.env`
- [`../odd/tasks/plataforma-nomas-que-la-vida.md`](../odd/tasks/plataforma-nomas-que-la-vida.md) — estado de tareas
