# Feature: plataforma-nomas-que-la-vida

> **Mirror**: Engram topic `odd/plataforma-nomas-que-la-vida/tasks` (project: `plocos_astro`)
> **Created**: 2026-10-02
> **Workflow**: ODD (gentle-ai v4 default)
> **Delivery**: stacked-to-main, 7 chained PRs
> **TDD Mode**: Strict ON
> **RDD Mode**: OFF for this clone (`gentle-ai review mode disable --scope clone`, 2026-10-02 — native lens budget cannot handle T01-size deletion commits)

## Objective

Pivot completo de Plocos de "archivo histórico de blog con comentarios moderados" a "plataforma de libro digital No más que la Vida" con suscripciones pagadas, paywall por iteración/capítulo, anotaciones topográficas al PDF, motor de triaje con LLM, Repositorio público, Habeas Scriptum y aprobación por correo.

## Problem

El cliente (Michel Saer) cambió el modelo de negocio y el producto entero. La nueva spec elimina blog/categorías/posts y agrega 3 roles (Lector/Colaborador/Auditor), integración de pagos duales (PayPal + MercadoPago), auth (Clerk), DB relacional (Turso), motor LLM (Google Gemini), cumplimiento de Ley 1581/2012 (Habeas Data) y protección de propiedad intelectual vía Habeas Scriptum.

## Why

El pivote sostiene un ecosistema dialéctico de doble núcleo donde los suscriptores pueden alterar el canon de la obra a través de anotaciones aprobadas. La viabilidad económica depende de las suscripciones. La propiedad intelectual requiere un clickwrap (Habeas Scriptum) que delimite la cesión. La aprobación por correo (en vez de panel admin) escala sin contratar moderadores.

## Constraints (no negociables)

- **Strict TDD Mode ON**: cada tarea con lógica de negocio lleva ciclo RED→GREEN→REFACTOR con TDD Cycle Evidence table.
- **ODD workflow**: tasks tracked en este documento + Engram mirror. NO crear SDD artifacts.
- **RDD OFF (clone-scoped)**: deshabilitado por el usuario el 2026-10-02. No iniciar reviews ni reactivarlo; la verificación es vitest + `astro build` por tarea.
- **Bilingüe ES + EN**: cualquier texto público o legal tiene versión EN con marcadores `[EN: TODO legal review by Colombian attorney]`.
- **Habeas Scriptum clickwrap**: ninguna interfaz de Colaborador se habilita sin aceptación explícita.
- **SHA-256 verified**: `pnpm verify:pacto` corre en prebuild. Cuidado al reescribir `pacto.es.json`.
- **drizzle.config.ts**: actualizar de `driver: 'turso'` (obsoleto) a `dialect: 'turso'`.
- **Stack fijo**: Clerk (auth) + Turso (DB) + PayPal+MercadoPago (pagos) + Gemini Pro/Flash (LLM) + Netlify Blobs (PDF) + Resend (email) + bundle monolítico `src/lib/i18n.ts` con parity compile-time.
- **Spec `robots-anti-ia` REUSE íntegra**: cerco anti-IA ratificado por el cliente. 8 user-agents bloqueados + meta `noai, noimageai`.
- **Splash de Pacto de Ingreso**: texto verbatim "Los textos y obras aquí expuestos transitan sin censura con contenido sensible. Si decide continuar, asume los términos de nuestros <Términos del Sitio>."

## Tasks

24 tareas en 7 PRs encadenados (stacked-to-main). Cada tarea con ID estable, descripción, líneas estimadas (~400 heurístico, no cap) y acceptance criteria.

### PR 1 — Foundation cleanup

- [x] **T01** Borrar routes legacy y contenido histórico (~400 líneas, refactor puro sin TDD). — commits: 81775e0, 9219c6a, 9e72cfd, d480f0a
  - Borrar: `src/pages/blog/`, `src/pages/blog/page/[page].astro`, `src/pages/blog/[...slug].astro`, `src/pages/[...path].astro`, `src/pages/categorias/`, `src/pages/labels/`, `src/pages/nuestra-razon-de-ser/`, `src/pages/editor/`, `src/pages/editor.astro`, `src/pages/api/posts.json.ts`, `src/pages/api/save-post.ts`, `src/pages/admin/`, `src/pages/admin/comments.astro`, `src/pages/admin/index.astro`, `src/pages/admin/login.astro`, `src/pages/api/comments/`, `src/pages/api/comments.ts`, `src/pages/api/comments/moderate.ts`, `src/pages/rss.xml.js`.
  - Eliminar: `src/content/posts/*.md` (216 archivos), `src/content/categories/{ArsetScire,Ex-lateribus-cogite,galeria,general,prosyart}.md` (mantener `nomas-que-la-vida.md`).
  - Eliminar componentes: `Search.vue`, `SearchBar.astro`, `SearchDialog.astro`, `PostCard.astro`, `MobileMenu.jsx`, `CommentSection.astro`, `admin/*.astro` (5 archivos).
  - Eliminar libs: `src/lib/categories.ts`, `src/lib/taxonomy.ts`, `src/lib/pagination.ts`, `src/lib/consent-gate.ts`, `src/lib/algoliasearch.js`.
  - Quitar deps: `@algolia/*`, `algoliasearch`, `vue-instantsearch`, `@astrojs/vue`, `@astrojs/react`, `astro-google-analytics`.
  - **Acceptance**: `pnpm build` corre sin errores; no quedan referencias a `getCollection('posts')`; `grep -r "postSlug"` retorna vacío.

- [ ] **T02** Verificar spec `robots-anti-ia` (~30 líneas, verificación pura).
  - Verificar `public/robots.txt` mantiene 8 user-agents bloqueados.
  - Verificar `BaseLayout.astro:42` sigue inyectando `<meta name="robots" content="noai, noimageai">`.
  - **Acceptance**: spec RE-robots-1..7 vigente sin cambios.

- [x] **T07** Schema DB redesign (~400 líneas, TDD para schema invariants). — commits: 2016344, 7d054ba
  - Reescribir `src/lib/db/schema.ts`: drop `Comments`, agregar `users`, `subscriptions`, `iterations`, `bookChapters`, `bookParagraphs`, `bookAnnotations`, `auditorProfiles`, `notificationQueue` (ver §Schema).
  - Crear migración `drizzle/0002_pivot_plataforma.sql`.
  - Actualizar `drizzle.config.ts` de `driver: 'turso'` a `dialect: 'turso'`.
  - Aplicar migración manualmente a Turso vía libsql client.
  - **Acceptance**: `pnpm verify:schema` corre; FKs y enums válidos; tests RED para invariants (status enum, FK, etc.) pasan antes de cualquier endpoint que las use.

### PR 2 — Auth + legal docs

- [x] **T08** Wire Clerk auth (~400 líneas, TDD para middleware y webhook). — commits: d703571, 75dcee7
  - Añadir `@clerk/astro` a deps.
  - Configurar `PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` env vars.
  - Middleware `src/middleware.ts` injecta `Astro.locals.auth`.
  - Páginas `/sign-in`, `/sign-up/*` con `<SignIn />` y `<SignUp />` de Clerk.
  - Página `/cuenta` con `<UserProfile />` de Clerk.
  - Webhook `/api/webhooks/clerk` para `user.created`, `user.updated`, `user.deleted` (esencial para ARCO).
  - **Acceptance**: registro funciona; sesión persiste en SSR; webhook borra fila en `users` local en `user.deleted` (ARCO derecho de cancelación).

- [x] **T03** Spec splash-contenido-sensible update (~30 líneas). — commits: 9976476
  - Actualizar `src/lib/i18n.ts` `splash.body` al texto verbatim del cliente.
  - **Acceptance**: splash muestra nuevo texto, link a Términos funciona.

- [x] **T04** Spec pacto-lectura rewrite 11 secciones (~400 líneas, TDD para SHA-256 invariant). — commits: c5d829a
  - Reescribir `src/content/_data/pacto.es.json` con las 11 secciones del doc maestro (I. Pacto Cognitivo, II. Naturaleza Transaccional, III. Propiedad Intelectual, IV. Anti-IA, V. Pagos, VI. Éticas, VII. Simbiosis Algorítmica, VIII. Soberanía Digital, IX. Jurisdicción + secciones III/IV del doc: Habeas Scriptum, Términos y Condiciones de Auditoría).
  - Crear `pacto.habeas-scriptum.es.json` y `pacto.habeas-scriptum.en.json` (con marcador TODO legal).
  - Crear `pacto.terminos-auditoria.es.json` y `pacto.terminos-auditoria.en.json` (con marcador TODO legal).
  - Crear `pacto.simbiosis-algoritmica.es.json` y `pacto.simbiosis-algoritmica.en.json` (con marcador TODO legal).
  - Páginas nuevas: `src/pages/terminos/habeas-scriptum.astro`, `src/pages/terminos/auditoria.astro`, `src/pages/terminos/simbiosis-algoritmica.astro`. Y sus espejos `src/pages/en/terms/habeas-scriptum.astro`, etc.
  - **Acceptance**: SHA-256 del cuerpo del pacto actualiza; `pnpm verify:pacto` verde; las 3 nuevas páginas muestran el contenido legal; enlaces cruzados entre pacto y sub-secciones funcionan.

- [x] **T05** Spec politica-privacidad update (~150 líneas). — commits: b6502a5
  - Reescribir `src/pages/privacidad/index.astro` y `src/pages/en/privacy/index.astro`: añadir finalidades de suscriptores/colaboradores/auditores, datos del Repositorio público, mención al responsable (Plocos) y encargados (PayPal, MercadoPago, Netlify, Resend, Clerk).
  - **Acceptance**: cubre Ley 1581/2012 + Decreto 1377/2013 + datos del Repositorio + ARCO + delegado de protección de datos.

- [x] **T06** Spec politica-cookies update (~100 líneas). — commits: b6502a5
  - Actualizar `src/pages/politica-de-cookies/index.astro` y `src/pages/en/cookie-policy/index.astro`: añadir cookies de auth (Clerk `__session`, `__client`), preferencia (locale, theme), paywall (iteración visitada), anotaciones en curso.
  - **Acceptance**: 4 categorías de cookies cubiertas, todas declaradas con propósito y duración.

- [x] **T27** Conectar Turso (BD `plocos`) + mirror de usuarios Clerk (~350 líneas, TDD con libsql en memoria). Ruta: delegated direct (writer) — trigger: 2+ archivos no triviales (schema, db client, users.ts, webhook, tests).
  - Estado previo (inspección read-only 2026-10-04): BD `default` en estado Astro DB (`Comments` 25 filas de prueba, `_astro_db_snapshot`, `__drizzle_migrations` vacía); la migración manual `0002_pivot_plataforma.sql` nunca se aplicó y no estaba en el journal. Respaldo: `.backups/turso-legacy-2026-10-04.json` (gitignored).
  - Decisiones: BD nueva `plocos` (Turso no permite renombrar); `users.role` nullable, `NULL` = sin suscripción (alinea con T26); FKs hacia `users` con `onDelete: 'cascade'` (Política de Privacidad promete cancelación en cascada).
  - Migraciones regeneradas desde `schema.ts` (drizzle-kit generate, journal limpio); se eliminan 0000/0001 (blog) y la 0002 manual.
  - `src/lib/db/users.ts`: upsert/delete reales; webhook Clerk devuelve error real (no traga fallos) para que Clerk reintente.
  - **Progreso (código local)**: migración `drizzle/0000_naive_susan_delgado.sql`; FKs cascade en subscriptions/bookAnnotations/auditorProfiles/notificationQueue.userId, estructura del libro sin cascade (borrar contenido no debe borrar anotaciones). Bug latente corregido: svix 2.6.1 `verify()` devuelve void → el webhook nunca procesó eventos (el 200 lo ocultaba); ahora `JSON.parse(body)` tras verificar. Evidencia: RED t27 (import) y t08 (sin upsert, 200 en vez de 500) → GREEN; suite 207/207; tsc 0 errores. Commit 6f74f21.
  - **Migración remota (2026-10-04, autorizada por el usuario)**: BD `plocos` verificada vacía → `migrate()` → 8 tablas + `__drizzle_migrations` (1), FK subscriptions→users `CASCADE`, `users.role` nullable sin default.
  - **Webhook en dev verificado (2026-10-04)**: quick tunnel de cloudflared → endpoint Clerk `/api/webhooks/clerk`; evento de prueba `user.updated` → `200 OK` y fila `user_29w83sx…` (`example@example.org`, `role = NULL`) en `users` de `plocos` (consulta read-only). Fallos encontrados en el camino, todos de configuración: endpoint sin la ruta (200 con el HTML de `/`, falso positivo silencioso) y servidor dev con un secret viejo en memoria (400; HMAC recalculada a mano coincidía con el `.env.local`, se resolvió reiniciando). Usuario real `user_3KEU…` ya en `users` (`role = NULL`) tras editar el perfil; fila de ejemplo borrada a mano por el usuario. Camino ARCO probado por el usuario con eventos reales (crear y borrar un usuario descartable en Clerk, ambos 200); estado final consistente: el descartable no quedó en `users`.
  - **Acceptance**: tests de `users.ts` contra libsql en memoria con la migración generada; webhook `user.created` inserta con `role = NULL`; `user.deleted` borra en cascada; migración aplicada a `plocos` (requiere autorización del usuario para escritura remota).

### PR 3 — Payments integration

- [ ] **T10** Integración PayPal (TDD). Rama `feature/pr-3-payments` desde `feature/pr-2-auth-legal` (`301473b`). Propuesta aprobada por el usuario el 2026-10-20.
  - **T10a — Ruteo (función pura `src/lib/payment-routing.ts`)** — GREEN 14/14 (Log L8). Fuera de Colombia, elegir MercadoPago a mano marca `warnOutsideColombia` (no bloquea). Colombia → MercadoPago (COP); zona euro (21 países desde el 2026-01-01: AT, BE, BG, CY, DE, EE, ES, FI, FR, GR, HR, IE, IT, LT, LU, LV, MT, NL, PT, SI, SK) → PayPal EUR; resto → PayPal USD. Detección: `Astro.locals.netlify?.context?.geo?.country?.code` → región de `Accept-Language` → USD. Selector manual se mantiene. Aviso aprobado si el país es CO y se elige PayPal: "Desde Colombia el pago es con MercadoPago (COP): PayPal no permite pagos entre cuentas colombianas. Si tu cuenta PayPal es de otro país, puedes continuar." + botón "Volver a MercadoPago"; no se bloquea. Supuesto: la restricción de PayPal en Colombia no tiene fuente oficial vigente encontrada. Tests: `tests/t10-payment-routing.test.ts`.
  - **T10b — Wrapper REST `src/lib/paypal.ts`** — GREEN 35/35 (Log L9, L10). Sin SDK (`@paypal/checkout-server-sdk` está deprecado; `@paypal/paypal-server-sdk` 2.5.0 no tiene productos ni verificación de webhooks): configuración (`PAYPAL_API_BASE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` vía `import.meta.env` con respaldo `process.env`; error `<VAR> is not set`), token OAuth en caché hasta 60 s antes de expirar, `paypalRequest` (401 → invalida el caché y reintenta una vez), verificación propia de firma (`transmissionId|timeStamp|webhookId|crc32` del cuerpo crudo contra `paypal-transmission-sig`) que devuelve `valid` / `simulated` (`WEBHOOK_ID`) / `invalid`; `paypal-cert-url` solo https, host exacto `api.paypal.com` o `api.sandbox.paypal.com` (supuesto aprobado: el de producción se dedujo por simetría con el ejemplo de sandbox de la documentación) y ruta bajo `/v1/notifications/certs/` (comprobada tras normalizar la URL), certificado en caché por URL; `PAYPAL_WEBHOOK_ID = "WEBHOOK_ID"` se rechaza como configuración inválida. Crear y leer suscripción pasan a T10d (aprobado). Tests: `tests/t10-paypal.test.ts`.
  - **T10c — Webhook `/api/webhooks/paypal` + leer suscripción** — RED 41 → GREEN 78/78 + 1 `todo` (Log L11, L12); sin commit. Firma: `valid` procesa; `simulated` → 200 + log, sin tocar nada; `invalid` → 401; fallo al descargar el certificado → 503 para que PayPal reintente (timeout `CERT_FETCH_TIMEOUT_MS` = 5 s, `redirect: 'error'`, `CertificateUnavailableError`). Fuente de verdad: ante `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.COMPLETED` (por `billing_agreement_id`) se lee `GET /v1/billing/subscriptions/{id}` (`getSubscription` en `src/lib/paypal.ts`, movido desde T10d; 404 → `SubscriptionNotFoundError`) y se actúa según ese estado; `custom_id` = usuario de Clerk. Política: `ACTIVE` → `activateSubscription` + rol + `accessUntil` (= `next_billing_time`); `ACTIVE` con `failed_payments_count > 0` → `past_due`, mantiene el rol; `CANCELLED` → `canceled`, mantiene el rol; `SUSPENDED` → `suspended` y `EXPIRED` → `canceled`, ambos quitan el rol en Turso y Clerk salvo que otra suscripción del usuario dé acceso (`updateSubscriptionStatus`, Log L14, L16: `active` sin límite de fecha; `past_due` con fin null o futuro; `canceled` con fin futuro; gana primero la vigente, después el plan más alto, después la fecha); `APPROVAL_PENDING`/`APPROVED` → nada. Evento desconocido, 404 o sin `custom_id` → 200 + log; error transitorio o `plan_id` desconocido → 500. Planes en `PAYPAL_PLAN_{LECTOR,COLABORADOR}_{USD,EUR}`. Timeouts: certificado 5 s, API de PayPal 8 s (`PAYPAL_API_TIMEOUT_MS`). **Pendiente (Log L9):** fixture real del simulador (cabeceras, cuerpo crudo y certificado X.509) y su prueba (`it.todo` en `tests/t10c-paypal-webhook.test.ts`). Tests: `tests/t10-paypal.test.ts`, `tests/t10c-paypal-webhook.test.ts`, `tests/t10c-subscriptions-db.test.ts`.
  - **T10d — Checkout + reconciliación** (incluye crear suscripción en `src/lib/paypal.ts`, movido desde T10b; leer suscripción pasó a T10c, Log L11): `/api/suscripcion/paypal` crea la suscripción con `custom_id` = usuario de Clerk; al volver, `verify` lee la suscripción por su ID y activa si `custom_id` coincide y el estado es `ACTIVE` (reutiliza `activateSubscription`). Supuesto por confirmar: PayPal agrega `subscription_id` a la `return_url`. **Requisito (Log L13), resuelto en T10c (Log L14):** antes de quitar el rol se comprueba que ninguna otra suscripción del usuario dé acceso; `verify` de T10d reutiliza `activateSubscription`, que ya devuelve el rol y `accessUntil` por usuario.
  - **Setup del usuario (developer.paypal.com, sandbox)**: cuentas Business y Personal; app REST (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` ya en `.env.local`); webhook con los 6 eventos (`PAYPAL_WEBHOOK_ID`); producto + 4 planes Lector/Colaborador × USD/EUR (`PAYPAL_PLAN_LECTOR_USD`, `PAYPAL_PLAN_LECTOR_EUR`, `PAYPAL_PLAN_COLABORADOR_USD`, `PAYPAL_PLAN_COLABORADOR_EUR`) — vacías hasta crearlos; `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`.
  - **Acceptance**: ruteo con pruebas en RED → GREEN; suscripción se crea en checkout; webhook y reconciliación actualizan `subscriptions.status` y el rol; pruebas en RED para la firma y para el evento del simulador.

- [x] **T11** Integración MercadoPago (Colombia, COP; TDD para firma del webhook y reconciliación). — commits: b96d3f2, 1c0fae7, 56ef58b, a9236af, 4c8afda, aa82f5c, 6b57119, 4c649a8, e24d110, 8bc6d4a, 6870bec, e17539d, a10461e (+ 17ad58a túnel dev, 7bfa0b5 dependencia `mercadopago`, 5a59dd7/e5faf43 docs)
  - Suscripciones **sin plan asociado**: `auto_recurring` en línea + `status: "pending"` → `init_point` (los planes del panel exigen tokenizar la tarjeta en el cliente: `card_token_id is required`). Monto mínimo COP 1600.
  - Webhook `/api/webhooks/mercadopago`: firma HMAC-SHA256 de `x-signature` con el manifest `id:…;request-id:…;ts:…;` (dos puntos); prueba sin firma del panel → 200 sin procesar; 404 de MercadoPago → 200 + log (los 500 sostenidos desactivan el webhook).
  - Checkout `/api/suscripcion/mercadopago` + reconciliación al volver `/api/suscripcion/verify`: busca la suscripción autorizada solo por `external_reference`, sin depender del email; activa la suscripción (idempotente) y el rol sin esperar al webhook.
  - Wrapper `src/lib/mercadopago.ts`; tests `tests/t11-mercadopago.test.ts`. Catálogo de gotchas en `docs/diagramas/dev/suscripcion-mercadopago.md`.
  - **Verificado en vivo (2026-10-17, según Engram #230):** pago de prueba de COP 20.000 autorizado, `external_reference` correcto, webhook con firma validada y reconciliación operativa. Supuesto: no re-ejecutado en esta sesión.
  - Política de cancelación decidida el 2026-10-20 (Log L6); implementación pendiente (hoy el webhook ignora `cancelled`).
  - **Acceptance (MercadoPago)**: la suscripción se crea en checkout; webhook y reconciliación actualizan `subscriptions.status` y el rol; tests RED para la firma del webhook. Cumplido según los commits listados y `tests/t11-mercadopago.test.ts`.

### PR 4 — Book section + paywall

- [x] **T12** Paywall middleware (~200 líneas, TDD para enforcement). — commit: f93cdff (`src/lib/paywall.ts` + `src/middleware.ts`, tests `tests/t12-paywall.test.ts`; verificado por el usuario según Engram #230: libro visible con sesión, bloqueado sin ella)
  - Middleware `src/middleware/paywall.ts` chequea: auth (Clerk), subscription activa, iteración/capítulo permitido por plan.
  - Si no pasa: redirige a paywall con CTA de suscripción.
  - **Acceptance**: rutas `/libro/[year]/[iteration]/[chapter]` redirigen a paywall si usuario no es Lector+Colaborador+Auditor con subscription activa.

- [ ] **T14** Sec Nomás que la Vida (~400 líneas, TDD para content rendering).
  - `src/pages/libro/index.astro` (intro al ecosistema dialéctico) + `src/pages/en/book/index.astro`.
  - `src/pages/libro/[year]/index.astro` (listado de iteraciones) + `src/pages/en/book/[year]/index.astro`.
  - `src/pages/libro/[year]/[iteration]/index.astro` (capítulos + intro de la iteración) + EN.
  - `src/pages/libro/[year]/[iteration]/[chapter].astro` (render del capítulo + visor PDF + anotaciones) + EN.
  - **Acceptance**: navegación funciona, paywall se aplica, visor PDF renderiza, anotaciones topográficas se pueden crear y persisten.

- [x] **T14a** Archivo del Canon + PDF protegido (slice de T14 + T24; ~350 líneas, TDD). Ruta: delegated direct (writer) — trigger: 2+ archivos no triviales.
  - `src/lib/books.ts`: agrupación pura de iteraciones por año (años desc, ciclos asc, marca la última como vigente) + consulta `listIterations`.
  - `/libro` y `/en/book`: sección "Archivo" bajo el texto verbatim existente; con rol lista años → iteraciones con enlace al PDF; sin rol CTA a suscripción.
  - Endpoint `/api/books/[year]/[cycle].pdf`: exige rol (`getRoleFromClaims`), busca la iteración en Turso, sirve el blob `plocos-books` en streaming (límite Netlify: 6 MB buffered / 20 MB streamed; PDF de prueba 15,7 MB). Sin rol → redirige a suscripción.
  - Ruta solo-dev para sembrar el blob desde `private/books/` (gitignored); producción se sube con `netlify link` + `netlify blobs:set` al desplegar.
  - Datos: fila `iterations` id=1 (2026, ciclo 1, `pdfUrl='2026/1.pdf'`) insertada en `plocos` con autorización del usuario (2026-10-04).
  - **Acceptance**: tests de agrupación y del endpoint (rol/sin rol/iteración inexistente/streaming); con rol se abre el PDF en el navegador; sin rol no.
  - **Progreso**: código listo; RED 30/30 → GREEN 30/30; suite 237/237; tsc y astro check sin errores; `/libro` y `/en/book` 200; `/api/books/2026/1.pdf` anónimo → 302 `/sign-in`. Commit 7e001b8.
  - **Verificado en navegador (2026-10-04)**: blob sembrado (15.729.362 bytes); con rol `colaborador` `/libro` lista 2026 → Iteración 1 "Versión vigente" (4/10/2026 – 3/12/2026) y `/api/books/2026/1.pdf` abre el PDF. Incidencia: `no such table: iterations` por dev server arrancado con credenciales de la BD `default` → resuelto reiniciando `astro dev`.

- [ ] **T24** Netlify storage para PDFs (~150 líneas).
  - Configurar Netlify Blobs store `plocos-books`.
  - API endpoint `/api/books/[year]/[iteration]/[chapter].pdf` sirve el PDF con auth check.
  - **Acceptance**: PDFs accesibles para Lector+Colaborador+Auditor; no accesibles para anónimos (devuelve 401).

### PR 5 — Triaje engine

- [ ] **T19** Triaje engine con Gemini (~600 líneas, TDD para los 3 niveles).
  - `src/lib/triaje/model.ts` interface abstracta `TriAIModel` (para swap futuro de proveedor).
  - `src/lib/triaje/gemini-pro.ts` y `gemini-flash.ts` implementaciones.
  - `src/lib/triaje/nivel1.ts` (Flash: rechazo por regex + heurística de falacias + estructura silogística mínima).
  - `src/lib/triaje/nivel2.ts` (Pro: análisis de silogismo completo, premisas, conclusión, falacias primarias).
  - `src/lib/triaje/nivel3.ts` (Pro: detección de antítesis estructural que amenaza nodo raíz).
  - `src/lib/triaje/queue.ts` (fallback si Gemini caído — persiste Nivel 2/3 para reintentar).
  - Endpoint `/api/annotations/submit` recibe aporte → triaje → publica (Nivel 2) o eleva a cola del autor (Nivel 3) o rechaza (Nivel 1).
  - **Acceptance**: 3 niveles funcionan; fallback queue persiste en `notificationQueue`; tests RED cubren falacias comunes (ad hominem, strawman, petitio principii) y sinonismos.

- [ ] **T20** Aprobación por correo (~300 líneas, TDD para template rendering).
  - `src/lib/email.ts` con `Resend` SDK + templates para aprobación, rechazo, elevación, recordatorio de iteración.
  - Webhook handler genera emails con tokens de acción (one-click approve/reject/elevate).
  - Endpoint `/api/actions/email-token` procesa el click del correo.
  - **Acceptance**: email se envía al autor y al colaborador; click en el link actualiza `bookAnnotations.status`; tests RED para token expiration y security.

- [ ] **T21** Habeas Scriptum clickwrap (~200 líneas, TDD para enforcement).
  - `src/pages/habeas-scriptum.astro` con el verbatim + checkbox de aceptación.
  - Persistir `habeasScriptumAcceptedAt` en `users` local al hacer click.
  - Middleware bloquea `api/annotations/submit` si `habeasScriptumAcceptedAt IS NULL`.
  - **Acceptance**: Colaborador no puede enviar aportes sin aceptar; el flag persiste; el middleware retorna 403 con redirect a habeas-scriptum.

### PR 6 — Public sections + landing

- [x] **T13** Sec Inicio landing (~200 líneas). — commits: 227cb55, ac17276
  - Reescribir `src/pages/index.astro` y `src/pages/en/index.astro` con el contenido verbatim del doc maestro: filosofía + manifiesto del Ploco + pregunta del guionista + oferta de valor + categorías de suscripción + enlaces a 5 secciones.
  - **Acceptance**: landing muestra el contenido verbatim; splash se muestra antes que el contenido profundo.

- [x] **T15** Sec Auditores (~200 líneas). — commits: 227cb55, ac17276
  - `src/pages/auditores/index.astro` y `src/pages/en/auditors/index.astro` lista `auditorProfiles` con `publicVisible = true`.
  - **Acceptance**: lista muestra CV + foto + email (si toggle público activo); respeta `publicVisible = false`.

- [x] **T16** Sec Repositorio (~300 líneas). — commits: 227cb55, ac17276
  - `src/pages/repositorio/index.astro` y `src/pages/en/repository/index.astro` con índice de aportes por año y periodo de iteración.
  - Filtros: año (2026+), iteración (1-6), estado (aprobados/todos).
  - Click en un aporte → modal/page con razón de aprobación (`approvalReason`).
  - **Acceptance**: index funciona; drill-down muestra razón; respeta visibilidad pública de email según toggle.

- [x] **T17** Sec Contacto (~200 líneas). — commits: 227cb55, ac17276
  - Reescribir `src/pages/contacto/index.astro` y `src/pages/en/contact/index.astro`: formulario con campos para ARCO (nombre, cédula, tipo de solicitud) + consultas generales.
  - Eliminar botón PayPal duplicado y referencias a client-id.
  - **Acceptance**: Netlify Forms recibe el form con `name="contact"`; se notifica al admin; no quedan referencias a PayPal en el código.

- [x] **T25** Header, Suscripción y Footer legales (~400 líneas, TDD para route assembly). — commits: e126073, b4cacbe
  - Reescribir `src/components/SiteHeader.astro` (ES+EN): navegación a las 5 secciones (Inicio / Nomás Que La Vida / Auditores / Repositorio / Contacto) + link a Blog legacy (`plocos.blogspot.com`) + CTA "Suscripción" + íconos de redes (`src/data/contact.json`).
  - Crear `src/pages/suscripcion.astro` y `src/pages/en/subscription.astro`: página donde el visitante elige Lector vs Colaborador e inicia el flujo de pago (decide PayPal o MercadoPago según geografía, con selector manual).
  - Reescribir `src/components/SiteFooter.astro` (ES+EN): añadir enlaces a `/habeas-scriptum`, `/terminos/auditoria`, `/terminos/simbiosis-algoritmica` además de los actuales.
  - **Acceptance**: el header enlaza las 5 secciones + Blog + Suscripción + redes; el footer enlaza los sub-documentos legales; `/suscripcion` muestra opciones de plan con pre-selección geográfica o selector manual.
  - **Decisión 2026-10-04 (afecta T10/T11)**: la pasarela de Colombia (geo-IP) es MercadoPago; fuera de Colombia, PayPal. Clerk Billing descartado (solo Stripe). País desconocido → fallback a definir en T10.

- [x] **T26** Acceso por rol al iniciar sesión (~250 líneas, TDD para `src/lib/access.ts`). Ruta: inline guiado (el usuario pidió guía y aporta la regla de negocio). — commits: cf97738 (header sign-in/UserButton), ba5b0d3 (access + /auth/continue + member links)
  - Opción A elegida: el rol se replica en `publicMetadata` de Clerk y viaja en el session token (`metadata.role`); Turso sigue siendo la fuente de verdad (los webhooks de pago escribirán ambos en T10/T11).
  - `src/lib/access.ts`: `getRoleFromClaims` (valida contra `USER_ROLES`), `getPostSignInPath(role, locale)`, `getMemberLinks(role, locale)`.
  - `/auth/continue`: redirige según rol; `<SignIn fallbackRedirectUrl>` apunta ahí (respeta `redirect_url` del middleware).
  - Header con sesión: "Leer el libro" (todo rol) + "Aportar" (colaborador/auditor; la UI de aportes llega en T21).
  - **Acceptance**: con rol → `/libro` (`/en/book`); sin rol → `/suscripcion` (`/en/subscription`); claims con rol inválido se tratan como sin rol; tests verdes.
  - **Evidencia**: `tests/t26-access.test.ts` RED (módulo ausente → 4 fallos del stub) → GREEN; suite 187/187. `/auth/continue` sin sesión → 302 `/sign-in`. Flujo con sesión: el usuario llegó a `/auth/continue` tras login (pendiente: confirmar destino `/libro` con rol y `/suscripcion` sin rol en navegador).
  - **Verificado en navegador (2026-10-04)**: con `role: colaborador` el login aterriza en `/libro` y el header muestra "Leer el libro" + "Aportar".
  - **Setup externo (usuario)**: Clerk Dashboard → Sessions → Customize session token `{"metadata": "{{user.public_metadata}}"}`; publicMetadata de prueba `{"role":"colaborador"}`.

### PR 7 — i18n + automation

- [ ] **T18** i18n extension (~600 líneas).
  - Añadir a `src/lib/i18n.ts` (interface `Translation`): `subscription`, `auditores`, `repositorio`, `bookChapter`, `annotation`, `paywall`, `auth`, `habeasScriptum`, `terminosAuditoria`, `simbiosisAlgoritmica`. Versiones EN con marcadores TODO legales en secciones legales.
  - **Acceptance**: `astro check` verde; parity compile-time enforced; sin secciones top-level nuevas sin design review (REQ-i18n-7).

- [ ] **T22** Auditor ascention logic (~200 líneas, TDD para counting). — **Parcial.** Lógica hecha en 3586a59 (`src/lib/auditor.ts`, umbrales 4+ / 2+, tests `tests/t22-auditor.test.ts`). **Falta** (verificado 2026-10-20): el endpoint `/api/cron/auditor-check` no existe (no hay `src/pages/api/cron`) y `src/lib/auditor.ts` solo lo importa `tests/t22-auditor.test.ts`. Pendiente crear el endpoint cron y conectarlo, junto con T23.
  - Endpoint `/api/cron/auditor-check` (Netlify Scheduled Function) corre diariamente: cuenta aportes del usuario con `status = 'elevated'` y `triajeLevel = 3`; si >= 4 y no es Auditor, ascender; si es Auditor y pasó 1 año, renovar solo si >= 2 nuevos aportes.
  - **Acceptance**: logic funciona, role updates correctamente, renewal con gracia de 30 días.

- [ ] **T23** Iteration cycle automation (~200 líneas).
  - Incluye el cron diario `/api/cron/subscription-expiry` (Log L7): quita el rol en Turso y Clerk a las suscripciones `canceled` cuyo `currentPeriodEnd` ya pasó.
  - Endpoint `/api/cron/iteration-transition` (Netlify Scheduled Function): cada 60 días cierra `iteration.status = 'open'` → `'closed'`, notifica al autor con los aportes Nivel 3 elevados, marca nueva iteración `status = 'open'` para el siguiente ciclo.
  - **Acceptance**: schedule dispara, state transitions correctamente, email al autor llega con resumen.

## Schema (T07 detail)

```ts
// users (mirror de Clerk; sync via webhook)
users: {
  clerkUserId: text PRIMARY KEY,
  email: text NOT NULL,
  displayName: text,
  role: text ENUM('lector' | 'colaborador' | 'auditor') NOT NULL DEFAULT 'lector',
  habeasScriptumAcceptedAt: timestamp NULL,
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}

// subscriptions (PayPal o MercadoPago)
subscriptions: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  userId: text REFERENCES users(clerkUserId),
  provider: text ENUM('paypal' | 'mercadopago'),
  providerSubscriptionId: text,
  plan: text ENUM('lector' | 'colaborador'),
  status: text ENUM('active' | 'past_due' | 'canceled' | 'pending') NOT NULL DEFAULT 'pending',
  currentPeriodStart: timestamp,
  currentPeriodEnd: timestamp,
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}

// iterations (ciclos de 60 días)
iterations: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  year: integer NOT NULL,
  cycleNum: integer NOT NULL,  // 1..6
  startsAt: timestamp NOT NULL,
  endsAt: timestamp NOT NULL,
  status: text ENUM('open' | 'closed' | 'archived') NOT NULL DEFAULT 'open',
  pdfUrl: text NULL,
  createdAt: timestamp NOT NULL,
  UNIQUE(year, cycleNum)
}

// chapters
bookChapters: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  iterationId: integer REFERENCES iterations(id),
  chapterNum: integer NOT NULL,
  title: text NOT NULL,
  slug: text NOT NULL,
  createdAt: timestamp NOT NULL
}

// paragraphs (topografía para deep linking en PDF)
bookParagraphs: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  chapterId: integer REFERENCES bookChapters(id),
  paragraphNum: integer NOT NULL,
  anchorId: text NOT NULL,  // para deep link en el PDF
  createdAt: timestamp NOT NULL
}

// annotations (anotaciones topográficas)
bookAnnotations: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  paragraphId: integer REFERENCES bookParagraphs(id),
  userId: text REFERENCES users(clerkUserId),
  content: text NOT NULL,
  status: text ENUM('pending' | 'approved' | 'rejected' | 'spam' | 'elevated') NOT NULL DEFAULT 'pending',
  triajeLevel: integer,  // 1, 2, 3
  triajeReasoning: text,
  approvedAt: timestamp NULL,
  approvalReason: text NULL,  // para mostrar en Repositorio
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}

// auditor profiles
auditorProfiles: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  userId: text REFERENCES users(clerkUserId) UNIQUE,
  publicVisible: integer NOT NULL DEFAULT 0,  // boolean
  bio: text,
  photoUrl: text,
  ascentionCount: integer NOT NULL DEFAULT 0,
  lastAscentionYear: integer NULL,
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}

// notification queue (for emails)
notificationQueue: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  userId: text REFERENCES users(clerkUserId) NULL,
  emailType: text NOT NULL,
  payload: text NOT NULL,  // JSON
  status: text ENUM('pending' | 'sent' | 'failed') NOT NULL DEFAULT 'pending',
  scheduledFor: timestamp NOT NULL,
  sentAt: timestamp NULL,
  createdAt: timestamp NOT NULL
}
```

## PR slice boundaries (stacked-to-main)

| PR | Tareas | Líneas estimadas | Branch base | Branch |
|---|---|---|---|---|
| PR 1 | T01, T02, T07 | ~830 | main | `feature/pr-1-foundation` |
| PR 2 | T08, T03, T04, T05, T06 (+ T13, T15, T16, T17, T25 adelantadas de PR 6) | ~2400 | `feature/pr-1-foundation` | `feature/pr-2-auth-legal` |
| PR 3 | T10, T11 | ~800 | main | `feature/pr-3-payments` |
| PR 4 | T12, T14, T24 | ~750 | main | `feature/pr-4-book-paywall` |
| PR 5 | T19, T20, T21 | ~1100 | main | `feature/pr-5-triaje` |
| PR 6 | (vacío — T13, T15, T16, T17, T25 se entregaron en PR 2) | — | — | — |
| PR 7 | T18, T22, T23 | ~1000 | main | `feature/pr-7-i18n-automation` |

**Desvío (2026-10-17):** T11, T12 y la lógica de T22 (`3586a59`) se entregaron en `feature/pr-2-auth-legal` (commits b96d3f2…e5faf43), no en los PR 3, 4 y 7 previstos. PR 3 queda con T10; PR 4 con T14 y T24; PR 7 con T18, T23 y el resto de T22 (endpoint cron `/api/cron/auditor-check` y su conexión). PR 2 sigue sin merge a `main` por decisión del usuario (`plocos.netlify.app` = staging).

**Total**: ~6.860 líneas (con TDD + i18n + tests). Por encima del trigger 400 de ODD — por eso se particiona en 7 PRs stacked-to-main.

## Verification Evidence

- 2026-10-04: `npx vitest run` → 5 files, 175/175 PASS. `pnpm build` → Complete.
- 2026-10-17 (según Engram #230, no re-ejecutado): 307/307 PASS, build verde.
- 2026-10-20: `npx vitest run` (Vitest 5.0.3) → 11 files, 307/307 PASS, 1.82 s. `pnpm build` no ejecutado en esta sesión.
- 2026-10-20 (T10a, `feature/pr-3-payments`): `npx vitest run` → 12 files, 321/321 PASS; `npx tsc --noEmit` → 0 errores.
- 2026-10-20 (T10b): `npx vitest run` → 13 files, 356/356 PASS; `npx tsc --noEmit` → 0 errores; verificador independiente sin bloqueos (Log L10).

## Progress

- **PR 1** (#10, `feature/pr-1-foundation`): T01, T07 hechas. T02 (verificación `robots-anti-ia`) sin evidencia registrada — pendiente.
- **PR 2** (#11, `feature/pr-2-auth-legal`, apilado sobre PR 1): T03, T04, T05, T06, T08 + T13, T15, T16, T17, T25. Fixes: middleware allow-list (`75dcee7`), netlify edge-functions dev (`51e8b8f`), header UI (`b4cacbe`).
- **PR 2 audit cleanup** (2026-10-04): remanentes del blog eliminados (Algolia, scripts de posts, colecciones de contenido `posts/authors/categories`, `/about`, `public/api/posts.json`, deps sin uso), bundle i18n reducido a la superficie del producto, links legales del footer por locale, sign-in EN, rutas EN de auth públicas, `/api/comments` fuera del allow-list. `src/content/categories/nomas-que-la-vida.md` se conserva por decisión T01. Test: `tests/pr2-cleanup.test.ts`.
- **PR 2, 2026-10-17** (adelantadas de PR 3/4/7): T11 MercadoPago, T12 paywall; T22 parcial (solo la lógica de `src/lib/auditor.ts`, sin endpoint cron); migración de botones/nav a Flowbite (`65ffabf`); Prettier (`5ec6d40`); documentación del pivote (`5a59dd7`, `e5faf43`). Último commit `e5faf43`.
- **Abiertas**: T02, T10, T14, T18, T19, T20, T21, T22 (parcial: falta el endpoint cron), T23, T24.

## Next Step

**Siguiente paso (próxima sesión): T10c — webhook `/api/webhooks/paypal`** (T10a `487d746` y T10b `9f4ea9d` ya están en `feature/pr-3-payments`). Pendientes del usuario para esa sesión:
- Corregir .env.local: PAYPAL_API_BASE=https://api-m.sandbox.paypal.com (sandbox.paypal.com es el sitio web, no la API) y PAYPAL_PLAN_* vacías (son IDs de plan, no precios).
- Decidir dónde apunta el webhook de PayPal: túnel, plocos.netlify.app o ambos (PayPal admite varios por app).
- Crear el webhook en PayPal y poner PAYPAL_WEBHOOK_ID en .env.local.
- Netlify: plocos.netlify.app publica main; para ver feature/pr-3-payments hace falta activar branch deploys o hacer el merge. Revisar las env vars (Clerk, MercadoPago, PayPal sandbox; Turso probablemente ya está, por los comentarios).
- Agregar el dominio de Netlify en Clerk y actualizar los webhooks de Clerk y MercadoPago.

1. Confirmar con el usuario el flujo final por `localhost:4321`: verify → enlaces de miembro → metadata de Clerk con el rol.
2. Antes del merge a `main`: env vars en Netlify (Clerk, MercadoPago, Turso); webhooks apuntando a `plocos.netlify.app`; cambiar la URL del webhook de MercadoPago (hoy apunta al túnel) y su secret; Clerk de producción exige dominio propio (`plocos.com`). Pendientes previos: `netlify link` + `netlify blobs:set` del PDF y limpiar `netlify.toml` (`build --remote`, `included_files db/**`) — supuesto: no verificado si siguen vigentes.
3. Después: resto de T10 (T10c webhook, T10d checkout + reconciliación), T14 capítulos, T18 i18n, T19 triaje con Gemini, T20 correo, T21 clickwrap de Habeas Scriptum, T22 endpoint `/api/cron/auditor-check` + T23 cron, T24 storage, T02 verificación de robots.
4. Implementar la política de cancelación de L6/L7 en MercadoPago y PayPal: `accessUntil` en Clerk (webhooks y `verify` de ambas pasarelas), paywall por fecha; cron de limpieza en T23. **Requisito antes de producción (no de staging), Log L16:** política de cancelación de MercadoPago (`cancelled`/`paused`): hoy esas filas quedan `active` y, con el rol por usuario, bloquean la revocación de PayPal (`SUSPENDED`/`EXPIRED`).
5. Refactor: acotar la regla global `a { color: var(--accent) }` a `.prose a` y quitar el `!important` (`3de6fd8`).

Operación (Engram #227): ningún agente levanta servidores ni mata procesos; el usuario maneja los servidores y prueba en su navegador. El túnel de Cloudflare es solo para webhooks entrantes.

## Log

- **L1 (2026-10-04, T25):** decisión de pasarelas por geografía (ver T25).
- **L2 (2026-10-17):** la pasarela de Colombia es MercadoPago (suscripciones con cobro recurrente automático); fuera de Colombia, PayPal (T10). Fecha tomada del primer commit de MercadoPago (`b96d3f2`); supuesto: la aprobación del cliente no consta en git ni en Engram #230.
- **L3 (2026-10-20):** documento reconciliado con `git log` y Engram #230: T11 y T12 hechas; T22 queda abierta y parcial (lógica en `3586a59` con pruebas; el endpoint `/api/cron/auditor-check` no existe y `src/lib/auditor.ts` solo lo importan las pruebas, verificado por el usuario y en esta sesión); desvío de PR anotado; Progress y Next Step reescritos; suite 307/307.
- **L4 (2026-10-20):** instrucción del usuario: "Elimina Wompi también de la bitácora, incluido el historial." Se quitaron de este documento la investigación, el plan original y la comparación de alternativas de T11; T25, L1 y L2 se reescribieron sin esa pasarela. En el código se quitó de `/suscripcion`, `/en/subscription`, `src/lib/i18n.ts`, `src/lib/db/schema.ts` y las pruebas t07/t27 (ver el commit de limpieza).
- **L5 (2026-10-20):** precios **de prueba**, no definitivos. MercadoPago (COP): Lector 9.900 y Colaborador 20.000 (en `MERCADOPAGO_PRICE_LECTOR` / `MERCADOPAGO_PRICE_COLABORADOR`; confirmado por el usuario). PayPal: Lector 5 y Colaborador 10, en USD y en EUR; provisionales (los define el cliente), van solo en el script de creación de planes y aquí. Dato del usuario sin verificar: MercadoPago tendría un tope de COP 30.000.
- **L6 (2026-10-20):** política del rol al cancelar, para MercadoPago y PayPal: el rol se mantiene hasta `currentPeriodEnd`. `CANCELLED` marca la suscripción como `canceled` pero no quita el rol; el paywall compara la fecha en cada visita y, si ya venció, niega el acceso. `SUSPENDED` y `EXPIRED` quitan el acceso de inmediato. Con esto se cierra el pendiente de cancelaciones de MercadoPago. Limpieza del rol en Turso y Clerk: pendiente de aprobar la propuesta del agente.
- **L7 (2026-10-20):** aprobada la limpieza del rol: `accessUntil` (= `currentPeriodEnd`) en el `publicMetadata` de Clerk junto al rol; el paywall compara la fecha en cada visita sin consultar la base; `SUSPENDED` y `EXPIRED` quitan el rol en el momento. El cron de limpieza (`/api/cron/subscription-expiry`) se registra en T23, no en T10. El webhook y `verify` de MercadoPago también tienen que escribir `accessUntil`.
- **L8 (2026-10-20):** T10a: dos pruebas añadidas antes del GREEN: `Accept-Language` de la zona euro sin geo (`de-DE,de;q=0.9` → PayPal EUR, `language`) y MercadoPago elegido a mano fuera de Colombia (geo `US`) → marca propia `warnOutsideColombia` (supuesto del usuario: la cuenta colombiana de MercadoPago solo cobra a compradores en Colombia; no bloquea). RED 12/12 (stub `not implemented`) → GREEN 12/12. Corrección pedida por el usuario: `manualChoice` llega del formulario o la URL, y `MANUAL_ROUTES['toString']` devolvía la función heredada (ruta con `provider` y `currency` `undefined`); prueba en RED con `'toString'` y `'bitcoin'` (se ignoran, ruta detectada con `source: 'geo'`) → validación con `Object.hasOwn` → GREEN 14/14; suite 321/321; `tsc --noEmit` limpio. Commit `487d746`.
- **L9 (2026-10-20):** T10b: RED 29/29 (stub `not implemented`) → GREEN 29/29; suite 350/350; `tsc --noEmit` limpio. Pruebas sin red (`fetch` y `fetchCert` inyectados). Supuestos aprobados: hosts del certificado `api.paypal.com` y `api.sandbox.paypal.com`; margen de renovación del token de 60 s. Alcance aprobado: crear y leer suscripción pasan a T10d. Supuesto abierto: las pruebas firman con un par RSA en memoria y el certificado falso es una llave pública PEM (no hubo permiso para generar un X.509 con `openssl`); PayPal envía un X.509 en PEM, que según la documentación de Node `crypto.createVerify().verify()` acepta. Pendiente de T10c, por instrucción del usuario: guardar un evento real del simulador como fixture (cabeceras, cuerpo crudo exacto y certificado de `paypal-cert-url`) y probar esa firma real.
- **L10 (2026-10-20):** verificación independiente de T10b (riesgo: item 2, seguridad): sin bloqueos, los 5 puntos del usuario pasan; los intentos de saltar la lista de hosts (punto final, userinfo, puertos, IPv6, punycode, barras invertidas, `%2E`, ancho completo) no la saltan. Por decisión del usuario se corrigieron dos advertencias antes del commit, con RED → GREEN: `PAYPAL_WEBHOOK_ID = "WEBHOOK_ID"` se rechaza (en RED devolvía `valid` para eventos del simulador) y `isAllowedCertUrl` exige la ruta `/v1/notifications/certs/` (verificada con el ejemplo de la documentación de PayPal: `https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-ab66f33d`); T10b 35/35, suite 356/356, `tsc --noEmit` limpio. A T10c: timeout, redirect y respuesta si falla la descarga del certificado. Anotadas sin acción: (4) `vi.stubEnv` escribe en `import.meta.env` y `process.env`, así que las pruebas no distinguen la lectura por `import.meta.env`; (5) el margen de 60 s solo se prueba a 30 s, el reintento tras 401 no sirve con cuerpos en stream (T10d usa JSON en texto) y las renovaciones simultáneas del token no se agrupan; (6) no se valida la cadena ni la vigencia del certificado y se ignora `paypal-auth-algo` (no lo pide la especificación; el supuesto del X.509 sigue abierto para T10c).
- **L11 (2026-10-21):** T10c, petición del usuario (literal):
  > Sigue con T10c (webhook /api/webhooks/paypal) con eventos firmados en las pruebas, mientras creo el webhook en PayPal. Pruebas en RED para:
  > 1. Firma: valid → procesa; simulated → 200 + log, sin tocar nada; invalid → 401; fallo al descargar el certificado → 5xx para que PayPal reintente (con timeout en la descarga y sin seguir redirects; verifica qué recomienda PayPal).
  > 2. Fuente de verdad: ante BILLING.SUBSCRIPTION.*, consulta GET /v1/billing/subscriptions/{id} y usa ese estado, no el del evento (cubre eventos fuera de orden y repetidos). custom_id = usuario de Clerk. Esto adelanta "leer suscripción" de T10d a T10c: agrégalo al wrapper con su prueba y ajusta la bitácora; "crear suscripción" sigue en T10d.
  > 3. Política aprobada: ACTIVATED activa (idempotente) y escribe accessUntil; PAYMENT.SALE.COMPLETED renueva accessUntil (se relaciona por billing_agreement_id); CANCELLED marca canceled sin quitar el rol; SUSPENDED y EXPIRED quitan el rol; PAYMENT.FAILED → past_due.
  > 4. Evento desconocido → 200 + log. Suscripción inexistente en PayPal (404) → 200 + log, como en T11.
  > 5. Cuando tenga el webhook creado, captura un evento real del simulador como fixture (cabeceras, cuerpo crudo y certificado) y agrega la prueba que cierra el supuesto del X.509 (L9).
  > Muéstrame el RED antes de implementar.
  Documentación de PayPal (developer.paypal.com/api/rest/webhooks/rest): el certificado "should automatically be downloaded and cached"; no dice nada de timeout ni redirects; ante una respuesta no 2xx PayPal "will retry each delivery up to 25 times over 3 days" (su código de ejemplo responde 200 incluso con firma inválida; aquí se mantiene 401, por decisión del usuario). Esquema oficial de suscripciones: estados `APPROVAL_PENDING|APPROVED|ACTIVE|SUSPENDED|CANCELLED|EXPIRED`; `billing_info.failed_payments_count` "Resets to 0 after a successful payment". Para que la fuente de verdad sea el GET también en `PAYMENT.FAILED`, `past_due` se decide por `ACTIVE` + `failed_payments_count > 0`, no por el tipo de evento. RED: 41 fallan, 37 pasan (35 previas de T10b, la cota del timeout y el ancla de idempotencia de `activateSubscription`), 1 `todo` (fixture del simulador); `tsc --noEmit` limpio. Pendiente de aprobación del usuario antes del GREEN.
- **L12 (2026-10-21):** el usuario aprueba las tres decisiones de L11 (`past_due` por `ACTIVE` + `failed_payments_count > 0`; planes en `PAYPAL_PLAN_{LECTOR,COLABORADOR}_{USD,EUR}` con 500 ante un `plan_id` desconocido; `SUSPENDED` → `past_due`, `EXPIRED` → `canceled`). Advertencia registrada por instrucción del usuario: en la tabla `subscriptions`, `past_due` agrupa dos casos con acceso distinto: pago fallido con `ACTIVE` (mantiene el rol) y `SUSPENDED` (quita el rol). **Regla:** T23 (cron) y T10d (reconciliación) deciden el acceso por el rol y `accessUntil` de Clerk o consultando PayPal, nunca por ese `status`. Corrección de prueba: en PayPal `CANCELLED` es terminal y la que se reactiva es una `SUSPENDED`; la prueba de evento tardío usa ahora un `SUSPENDED` tardío con la suscripción `ACTIVE`. GREEN: T10c 78/78 + 1 `todo` (fixture del simulador); suite 15 archivos, 399/399 + 1 `todo`; `tsc --noEmit` limpio. Sin commit ni push, a la espera de que el usuario revise los resultados.
- **L13 (2026-10-21):** T10c en commit `97807aa`. Verificador independiente (riesgo item 2): puntos 1-4 de L11 PASS; punto 5 `it.todo` esperado. (a) Rol por usuario y no por suscripción: un `SUSPENDED`/`EXPIRED` de una suscripción vieja quita el rol aunque el usuario tenga otra activa (prueba en copia aparte: MercadoPago `colaborador` activo + revocación de PayPal → `role` null); además `activateSubscription` sobrescribe el rol, así que una activación `lector` de PayPal baja a un `colaborador` de MercadoPago. T11 tiene el mismo patrón por usuario (siempre escribe `colaborador`, nunca revoca, no escribe `accessUntil`; ya pendiente en el punto 4 de Siguiente paso). Por instrucción del usuario no se corrige ahora: queda como requisito de T10d. (b) `ACTIVE` sin `next_billing_time` deja el `accessUntil` anterior en Clerk (`JSON.stringify` descarta `undefined`; Clerk solo borra con `null`) y el `currentPeriodEnd` anterior en Turso; arreglo propuesto, sin aplicar: `accessUntil: periodEnd ? periodEnd.toISOString() : null`, con su prueba. (c) El límite síncrono de Netlify es 60 s, no configurable (docs.netlify.com/build/functions/configuration/, comprobado 2026-10-21); el comentario de 10 s en `CERT_FETCH_TIMEOUT_MS` está desactualizado. Sin timeout: token OAuth, `paypalRequest`/`getSubscription` (hasta 4 llamadas con el reintento tras 401), libsql y Clerk. Si Netlify corta a mitad, PayPal reintenta y el diseño converge al releer el estado. Arreglo propuesto, sin aplicar: timeout en las llamadas a la API de PayPal y corregir el comentario. Pendiente de decisión del usuario.
- **L14 (2026-10-21):** el usuario decide corregir a, b y c de L13 en T10c con TDD. Petición (literal):
  > 1. Agrega 'suspended' a SUBSCRIPTION_STATUSES y guarda SUSPENDED de PayPal como 'suspended' (ya no como past_due). Antes, confirma que la columna status no tiene un CHECK en la base (Turso). Si cambiar el enum requiere migración, detente y muéstramelo.
  > 2. Punto a. Regla: "otra suscripción da acceso" si su status es 'active' o 'past_due', o si es 'canceled' y currentPeriodEnd > ahora. La regla vale para PayPal y MercadoPago y excluye la propia (provider, providerSubscriptionId).
  >    - updateSubscriptionStatus solo revoca si ninguna otra da acceso, y devuelve el rol que queda (el plan más alto entre las que dan acceso: colaborador > lector).
  >    - El handler escribe en Clerk ese rol, no null. Si queda acceso, accessUntil sale de esa suscripción.
  >    - activateSubscription conserva el plan más alto entre las suscripciones que dan acceso.
  >    - Pruebas: SUSPENDED de A con B activa mantiene el rol en Turso y en Clerk; activación lector con un colaborador activo en MercadoPago mantiene colaborador; EXPIRED sin otra suscripción quita el rol, como hasta ahora.
  > 3. Punto b: accessUntil: periodEnd ? periodEnd.toISOString() : null, y currentPeriodEnd a null en Turso, con su prueba. Anota en la bitácora la regla pendiente para el paywall: rol sin accessUntil = acceso mientras el rol exista.
  > 4. Punto c: timeout de 8 s (PAYPAL_API_TIMEOUT_MS) en el token OAuth y en paypalRequest, con prueba de reloj falso. Corrige el comentario: Netlify tiene 60 s de límite, no configurable (https://docs.netlify.com/build/functions/configuration/).
  > 5. Muéstrame el RED, después el GREEN con la suite completa y tsc --noEmit. Bitácora (L14) y Engram. Commit aparte, junto con el cambio de bitácora que está sin commitear. Sin push.

  Sin migración: `drizzle/0000_naive_susan_delgado.sql:80` crea `status` como `text DEFAULT 'pending' NOT NULL`, sin CHECK, y el snapshot de drizzle no guarda los valores del enum. Implementado: `'suspended'` en `SUBSCRIPTION_STATUSES`; `remainingAccess` (privada) elige el plan más alto entre las suscripciones que dan acceso y, a igual plan, la de `currentPeriodEnd` desconocido y luego la más tardía; `updateSubscriptionStatus` con `revokeRole` recalcula el rol excluyendo la propia y devuelve `{ role, accessUntil }`; `activateSubscription` devuelve `{ id, role, accessUntil }` y acepta `currentPeriodEnd: null` (borra) frente a `undefined` (conserva, camino de MercadoPago sin cambios); el webhook escribe en Clerk lo que devuelven esos helpers (`null`, nunca `undefined`); `fetchWithTimeout` de 8 s en el token OAuth y en `paypalRequest` (también acota la lectura del cuerpo). Comprobación diferencial: MercadoPago (`webhooks/mercadopago.ts` y `suscripcion/verify.ts`) siempre activa `colaborador`, el plan más alto, así que su rol no cambia; T11 sigue verde. **Regla pendiente para el paywall (T12/T23):** rol sin `accessUntil` = acceso mientras el rol exista. Advertencias sin acción: `EXPIRED` se guarda como `canceled`, así que si llegara con `currentPeriodEnd` futuro contaría como suscripción que da acceso para las demás; el cálculo del rol y su escritura no van en una transacción (dos entregas simultáneas del mismo usuario podrían cruzarse; el reintento de PayPal converge). RED 19 fallan / 138 pasan / 1 `todo` (las dos pruebas de timeout fallaron por colgarse) → GREEN; suite 15 archivos, 418/418 + 1 `todo`; `tsc --noEmit` limpio.
- **L15 (2026-10-21):** petición del usuario (literal): "Agrega 'expired' a SUBSCRIPTION_STATUSES y guarda EXPIRED de PayPal como 'expired' (RED → GREEN): una prueba de remainingAccess donde una fila 'expired' con currentPeriodEnd futuro no da acceso, y otra del webhook." Commit `3f73967`: RED 2 fallan (enum de T07 y webhook); las pruebas de Turso pasaron desde el RED (sin CHECK en la columna y `remainingAccess` no contaba estados desconocidos) y quedan como ancla; GREEN, suite 420/420 + 1 `todo`, `tsc --noEmit` limpio. Con esto queda superada la advertencia de L14 sobre EXPIRED guardado como `canceled`. Verificador independiente sobre `97807aa..HEAD` (riesgo items 2 y 3): L14 1-5 y 'expired' PASS. (a) Diferencial contra `c9a927d` del webhook de MercadoPago y de `verify.ts` con Turso real en memoria, 7 casos cada uno: idéntico byte a byte (estado HTTP, `users.role`, filas, argumentos de Clerk). (b) Casos hostiles de `remainingAccess` (mismo plan con fechas distintas, `null` frente a fecha, `canceled` sin fecha, `past_due` con `suspended`, fila de otro usuario, mismo id con otro proveedor, `canceled` con fin igual a ahora): todos según la regla. (c) **Regresión c1, latente:** el orden es plan antes que vigencia, así que una fila `colaborador` `past_due` con `currentPeriodEnd` vencido gana a una `lector` recién pagada → Clerk `{colaborador, accessUntil pasado}` (antes: `lector` con fecha futura); hoy no niega acceso porque el paywall solo lee el rol. Igual con una fila de MercadoPago `active` con fin vencido (c4). Arreglo propuesto, sin aplicar: ordenar primero las filas con fin `null` o futuro, luego plan, luego fecha. **Decisión pendiente (c2):** `past_due` da acceso sin límite de fecha según la regla de L14, lo que choca con el paywall por fecha de L7; opciones: escribir `accessUntil: null` si la fila ganadora es `past_due` vencida, o refrescar `currentPeriodEnd` desde `next_billing_time` en el camino `past_due`. Advertencias: (c3, ya en la base) ACTIVE con `next_billing_time` en el pasado escribe un `accessUntil` vencido; las filas de MercadoPago canceladas o pausadas siguen `active` (MercadoPago no procesa esos estados), así que ahora impiden que un SUSPENDED/EXPIRED de PayPal quite el rol: la política de cancelación de MercadoPago debe llegar antes del lanzamiento; el cálculo del rol no va en una transacción; MercadoPago no escribe `accessUntil` (ya en la base). Sin commit de esta entrada.
- **L16 (2026-10-21):** decisiones del usuario sobre L15 (literal):
  > 1. c2: 'past_due' da acceso solo si currentPeriodEnd es null o > ahora, igual que 'canceled'. 'active' sigue sin límite de fecha. Actualiza la regla en el comentario de remainingAccess y en la bitácora.
  > 2. c1/c4: en remainingAccess ordena primero las filas sin fecha de fin o con fin futuro, después por plan (colaborador > lector) y después por fecha (null primero, luego la más tardía).
  > 3. RED → GREEN con las pruebas de c1 (past_due colaborador vencido + lector ACTIVE nuevo → lector con fecha futura), c2 (suspender A con B past_due vencida → sin rol) y c4 (MercadoPago active con fin vencido + lector PayPal → lector con fecha futura). Suite completa y tsc --noEmit.
  > 4. En la bitácora, como requisito antes de producción (no de staging): la política de cancelación de MercadoPago (cancelled/paused), porque hoy esas filas quedan 'active' y bloquean la revocación de PayPal. c3 queda como advertencia.
  > 5. Commit aparte junto con L15 (sin commitear) y L16. Sin push.

  **Regla vigente de `remainingAccess`:** da acceso `active` (sin límite de fecha), `past_due` con `currentPeriodEnd` null o futuro, y `canceled` con `currentPeriodEnd` futuro. Orden: primero las filas con fin null o futuro, después el plan (colaborador > lector), después la fecha (null primero, luego la más tardía). **Interpretación del agente, a confirmar:** "igual que 'canceled'" se leyó como la misma cota de fecha, sin ampliar `canceled`: un `canceled` sin fecha de fin sigue sin dar acceso (regla de L14; la prueba existente lo fija). Al aplicar la condición "null o futuro" también a `canceled`, esa prueba falló, y se dejó `canceled` como en L14. RED 4 fallan / 22 pasan (c1, c4 y los dos casos de c2) → GREEN; suite 15 archivos, 426/426 + 1 `todo`; `tsc --noEmit` limpio. c3 (ACTIVE con `next_billing_time` en el pasado escribe un `accessUntil` vencido; ya en la base) queda como advertencia. Requisito antes de producción anotado en el punto 4 de Siguiente paso.
