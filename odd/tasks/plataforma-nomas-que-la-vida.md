# Feature: plataforma-nomas-que-la-vida

> **Mirror**: Engram topic `odd/plataforma-nomas-que-la-vida/tasks` (project: `plocos_astro`)
> **Created**: 2026-10-02
> **Workflow**: ODD (gentle-ai v4 default)
> **Delivery**: stacked-to-main, 7 chained PRs
> **TDD Mode**: Strict ON
> **RDD Mode**: ON (default, decided by default)

## Objective

Pivot completo de Plocos de "archivo histórico de blog con comentarios moderados" a "plataforma de libro digital No más que la Vida" con suscripciones pagadas, paywall por iteración/capítulo, anotaciones topográficas al PDF, motor de triaje con LLM, Repositorio público, Habeas Scriptum y aprobación por correo.

## Problem

El cliente (Michel Saer) cambió el modelo de negocio y el producto entero. La nueva spec elimina blog/categorías/posts y agrega 3 roles (Lector/Colaborador/Auditor), integración de pagos duales (PayPal + Wompi), auth (Clerk), DB relacional (Turso), motor LLM (Google Gemini), cumplimiento de Ley 1581/2012 (Habeas Data) y protección de propiedad intelectual vía Habeas Scriptum.

## Why

El pivote sostiene un ecosistema dialéctico de doble núcleo donde los suscriptores pueden alterar el canon de la obra a través de anotaciones aprobadas. La viabilidad económica depende de las suscripciones. La propiedad intelectual requiere un clickwrap (Habeas Scriptum) que delimite la cesión. La aprobación por correo (en vez de panel admin) escala sin contratar moderadores.

## Constraints (no negociables)

- **Strict TDD Mode ON**: cada tarea con lógica de negocio lleva ciclo RED→GREEN→REFACTOR con TDD Cycle Evidence table.
- **ODD workflow**: tasks tracked en este documento + Engram mirror. NO crear SDD artifacts.
- **RDD ON (default)**: cada work-unit commit pasa por `gentle-ai review assess`. Para medium/high candidates, presento envelope de consentimiento antes de reviewers.
- **Bilingüe ES + EN**: cualquier texto público o legal tiene versión EN con marcadores `[EN: TODO legal review by Colombian attorney]`.
- **Habeas Scriptum clickwrap**: ninguna interfaz de Colaborador se habilita sin aceptación explícita.
- **SHA-256 verified**: `pnpm verify:pacto` corre en prebuild. Cuidado al reescribir `pacto.es.json`.
- **drizzle.config.ts**: actualizar de `driver: 'turso'` (obsoleto) a `dialect: 'turso'`.
- **Stack fijo**: Clerk (auth) + Turso (DB) + PayPal+Wompi (pagos) + Gemini Pro/Flash (LLM) + Netlify Blobs (PDF) + Resend (email) + bundle monolítico `src/lib/i18n.ts` con parity compile-time.
- **Spec `robots-anti-ia` REUSE íntegra**: cerco anti-IA ratificado por el cliente. 8 user-agents bloqueados + meta `noai, noimageai`.
- **Splash de Pacto de Ingreso**: texto verbatim "Los textos y obras aquí expuestos transitan sin censura con contenido sensible. Si decide continuar, asume los términos de nuestros <Términos del Sitio>."

## Tasks

24 tareas en 7 PRs encadenados (stacked-to-main). Cada tarea con ID estable, descripción, líneas estimadas (~400 heurístico, no cap) y acceptance criteria.

### PR 1 — Foundation cleanup

- [ ] **T01** Borrar routes legacy y contenido histórico (~400 líneas, refactor puro sin TDD).
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

- [ ] **T07** Schema DB redesign (~400 líneas, TDD para schema invariants).
  - Reescribir `src/lib/db/schema.ts`: drop `Comments`, agregar `users`, `subscriptions`, `iterations`, `bookChapters`, `bookParagraphs`, `bookAnnotations`, `auditorProfiles`, `notificationQueue` (ver §Schema).
  - Crear migración `drizzle/0002_pivot_plataforma.sql`.
  - Actualizar `drizzle.config.ts` de `driver: 'turso'` a `dialect: 'turso'`.
  - Aplicar migración manualmente a Turso vía libsql client.
  - **Acceptance**: `pnpm verify:schema` corre; FKs y enums válidos; tests RED para invariants (status enum, FK, etc.) pasan antes de cualquier endpoint que las use.

### PR 2 — Auth + legal docs

- [ ] **T08** Wire Clerk auth (~400 líneas, TDD para middleware y webhook).
  - Añadir `@clerk/astro` a deps.
  - Configurar `PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` env vars.
  - Middleware `src/middleware.ts` injecta `Astro.locals.auth`.
  - Páginas `/sign-in`, `/sign-up/*` con `<SignIn />` y `<SignUp />` de Clerk.
  - Página `/cuenta` con `<UserProfile />` de Clerk.
  - Webhook `/api/webhooks/clerk` para `user.created`, `user.updated`, `user.deleted` (esencial para ARCO).
  - **Acceptance**: registro funciona; sesión persiste en SSR; webhook borra fila en `users` local en `user.deleted` (ARCO derecho de cancelación).

- [ ] **T03** Spec splash-contenido-sensible update (~30 líneas).
  - Actualizar `src/lib/i18n.ts` `splash.body` al texto verbatim del cliente.
  - **Acceptance**: splash muestra nuevo texto, link a Términos funciona.

- [ ] **T04** Spec pacto-lectura rewrite 11 secciones (~400 líneas, TDD para SHA-256 invariant).
  - Reescribir `src/content/_data/pacto.es.json` con las 11 secciones del doc maestro (I. Pacto Cognitivo, II. Naturaleza Transaccional, III. Propiedad Intelectual, IV. Anti-IA, V. Pagos, VI. Éticas, VII. Simbiosis Algorítmica, VIII. Soberanía Digital, IX. Jurisdicción + secciones III/IV del doc: Habeas Scriptum, Términos y Condiciones de Auditoría).
  - Crear `pacto.habeas-scriptum.es.json` y `pacto.habeas-scriptum.en.json` (con marcador TODO legal).
  - Crear `pacto.terminos-auditoria.es.json` y `pacto.terminos-auditoria.en.json` (con marcador TODO legal).
  - Crear `pacto.simbiosis-algoritmica.es.json` y `pacto.simbiosis-algoritmica.en.json` (con marcador TODO legal).
  - Páginas nuevas: `src/pages/terminos/habeas-scriptum.astro`, `src/pages/terminos/auditoria.astro`, `src/pages/terminos/simbiosis-algoritmica.astro`. Y sus espejos `src/pages/en/terms/habeas-scriptum.astro`, etc.
  - **Acceptance**: SHA-256 del cuerpo del pacto actualiza; `pnpm verify:pacto` verde; las 3 nuevas páginas muestran el contenido legal; enlaces cruzados entre pacto y sub-secciones funcionan.

- [ ] **T05** Spec politica-privacidad update (~150 líneas).
  - Reescribir `src/pages/privacidad/index.astro` y `src/pages/en/privacy/index.astro`: añadir finalidades de suscriptores/colaboradores/auditores, datos del Repositorio público, mención al responsable (Plocos) y encargados (PayPal, Wompi, Netlify, Resend, Clerk).
  - **Acceptance**: cubre Ley 1581/2012 + Decreto 1377/2013 + datos del Repositorio + ARCO + delegado de protección de datos.

- [ ] **T06** Spec politica-cookies update (~100 líneas).
  - Actualizar `src/pages/politica-de-cookies/index.astro` y `src/pages/en/cookie-policy/index.astro`: añadir cookies de auth (Clerk `__session`, `__client`), preferencia (locale, theme), paywall (iteración visitada), anotaciones en curso.
  - **Acceptance**: 4 categorías de cookies cubiertas, todas declaradas con propósito y duración.

### PR 3 — Payments integration

- [ ] **T10** Integración PayPal (~400 líneas, TDD para webhook signature verification).
  - Añadir `@paypal/paypal-js` + `@paypal/checkout-server-sdk`.
  - Crear plan de suscripción PayPal (price ID Lector + Colaborador; Auditor honorífico sin plan).
  - Endpoint `/api/payments/paypal/checkout` redirige a PayPal.
  - Webhook `/api/webhooks/paypal` para `BILLING.SUBSCRIPTION.CREATED`, `.CANCELLED`, `.PAYMENT.FAILED`. Verificación de signature.
  - **Acceptance**: subscription se crea en checkout; webhook actualiza `subscriptions.status`; tests RED para verificación de signature.

- [ ] **T11** Integración Wompi (~400 líneas, TDD para webhook integrity).
  - Configurar `WOMPI_PUBLIC_KEY` + `WOMPI_PRIVATE_KEY` + `WOMPI_INTEGRITY_SECRET` env vars.
  - Endpoint `/api/payments/wompi/checkout` genera link de pago con tokenización para suscripciones recurrentes.
  - Webhook `/api/webhooks/wompi` para `transaction.updated`. Verificación con integrity secret.
  - **Acceptance**: subscription se crea; webhook actualiza `subscriptions.status`; tests RED para integrity verification.

### PR 4 — Book section + paywall

- [ ] **T12** Paywall middleware (~200 líneas, TDD para enforcement).
  - Middleware `src/middleware/paywall.ts` chequea: auth (Clerk), subscription activa, iteración/capítulo permitido por plan.
  - Si no pasa: redirige a paywall con CTA de suscripción.
  - **Acceptance**: rutas `/libro/[year]/[iteration]/[chapter]` redirigen a paywall si usuario no es Lector+Colaborador+Auditor con subscription activa.

- [ ] **T14** Sec Nomás que la Vida (~400 líneas, TDD para content rendering).
  - `src/pages/libro/index.astro` (intro al ecosistema dialéctico) + `src/pages/en/book/index.astro`.
  - `src/pages/libro/[year]/index.astro` (listado de iteraciones) + `src/pages/en/book/[year]/index.astro`.
  - `src/pages/libro/[year]/[iteration]/index.astro` (capítulos + intro de la iteración) + EN.
  - `src/pages/libro/[year]/[iteration]/[chapter].astro` (render del capítulo + visor PDF + anotaciones) + EN.
  - **Acceptance**: navegación funciona, paywall se aplica, visor PDF renderiza, anotaciones topográficas se pueden crear y persisten.

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

- [ ] **T13** Sec Inicio landing (~200 líneas).
  - Reescribir `src/pages/index.astro` y `src/pages/en/index.astro` con el contenido verbatim del doc maestro: filosofía + manifiesto del Ploco + pregunta del guionista + oferta de valor + categorías de suscripción + enlaces a 5 secciones.
  - **Acceptance**: landing muestra el contenido verbatim; splash se muestra antes que el contenido profundo.

- [ ] **T15** Sec Auditores (~200 líneas).
  - `src/pages/auditores/index.astro` y `src/pages/en/auditors/index.astro` lista `auditorProfiles` con `publicVisible = true`.
  - **Acceptance**: lista muestra CV + foto + email (si toggle público activo); respeta `publicVisible = false`.

- [ ] **T16** Sec Repositorio (~300 líneas).
  - `src/pages/repositorio/index.astro` y `src/pages/en/repository/index.astro` con índice de aportes por año y periodo de iteración.
  - Filtros: año (2026+), iteración (1-6), estado (aprobados/todos).
  - Click en un aporte → modal/page con razón de aprobación (`approvalReason`).
  - **Acceptance**: index funciona; drill-down muestra razón; respeta visibilidad pública de email según toggle.

- [ ] **T17** Sec Contacto (~200 líneas).
  - Reescribir `src/pages/contacto/index.astro` y `src/pages/en/contact/index.astro`: formulario con campos para ARCO (nombre, cédula, tipo de solicitud) + consultas generales.
  - Eliminar botón PayPal duplicado y referencias a client-id.
  - **Acceptance**: Netlify Forms recibe el form con `name="contact"`; se notifica al admin; no quedan referencias a PayPal en el código.

- [ ] **T25** Header, Suscripción y Footer legales (~400 líneas, TDD para route assembly).
  - Reescribir `src/components/SiteHeader.astro` (ES+EN): navegación a las 5 secciones (Inicio / Nomás Que La Vida / Auditores / Repositorio / Contacto) + link a Blog legacy (`plocos.blogspot.com`) + CTA "Suscripción" + íconos de redes (`src/data/contact.json`).
  - Crear `src/pages/suscripcion.astro` y `src/pages/en/subscription.astro`: página donde el visitante elige Lector vs Colaborador e inicia el flujo de pago (decide PayPal o Wompi según geografía, con selector manual).
  - Reescribir `src/components/SiteFooter.astro` (ES+EN): añadir enlaces a `/habeas-scriptum`, `/terminos/auditoria`, `/terminos/simbiosis-algoritmica` además de los actuales.
  - **Acceptance**: el header enlaza las 5 secciones + Blog + Suscripción + redes; el footer enlaza los sub-documentos legales; `/suscripcion` muestra opciones de plan con pre-selección geográfica o selector manual.

### PR 7 — i18n + automation

- [ ] **T18** i18n extension (~600 líneas).
  - Añadir a `src/lib/i18n.ts` (interface `Translation`): `subscription`, `auditores`, `repositorio`, `bookChapter`, `annotation`, `paywall`, `auth`, `habeasScriptum`, `terminosAuditoria`, `simbiosisAlgoritmica`. Versiones EN con marcadores TODO legales en secciones legales.
  - **Acceptance**: `astro check` verde; parity compile-time enforced; sin secciones top-level nuevas sin design review (REQ-i18n-7).

- [ ] **T22** Auditor ascention logic (~200 líneas, TDD para counting).
  - Endpoint `/api/cron/auditor-check` (Netlify Scheduled Function) corre diariamente: cuenta aportes del usuario con `status = 'elevated'` y `triajeLevel = 3`; si >= 4 y no es Auditor, ascender; si es Auditor y pasó 1 año, renovar solo si >= 2 nuevos aportes.
  - **Acceptance**: logic funciona, role updates correctamente, renewal con gracia de 30 días.

- [ ] **T23** Iteration cycle automation (~200 líneas).
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

// subscriptions (PayPal o Wompi)
subscriptions: {
  id: integer PRIMARY KEY AUTOINCREMENT,
  userId: text REFERENCES users(clerkUserId),
  provider: text ENUM('paypal' | 'wompi'),
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
| PR 2 | T08, T03, T04, T05, T06 | ~1080 | main | `feature/pr-2-auth-legal` |
| PR 3 | T10, T11 | ~800 | main | `feature/pr-3-payments` |
| PR 4 | T12, T14, T24 | ~750 | main | `feature/pr-4-book-paywall` |
| PR 5 | T19, T20, T21 | ~1100 | main | `feature/pr-5-triaje` |
| PR 6 | T13, T15, T16, T17, T25 | ~1300 | main | `feature/pr-6-public` |
| PR 7 | T18, T22, T23 | ~1000 | main | `feature/pr-7-i18n-automation` |

**Total**: ~6.860 líneas (con TDD + i18n + tests). Por encima del trigger 400 de ODD — por eso se particiona en 7 PRs stacked-to-main.

## Verification Evidence

(Se actualiza por tarea en su commit message con el SHA. Cada PR se cierra con `gentle-ai review status` mostrando allow + receipt.)

## Progress

(Se actualiza por tarea con su commit SHA y estado del review.)

## Next Step

Empezar por PR 1 → T01 (remove legacy routes). Cada work-unit commit pasa por `gentle-ai review assess`. Si RDD marca medium/high, presento envelope de consentimiento antes de reviewers. Espero tu OK para arrancar.
