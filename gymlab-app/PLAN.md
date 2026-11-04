# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/`.

> **Fases totalmente cerradas → `COMPLETED.md`** (no requieren revisión).
> **Este archivo contiene SOLO lo pendiente o por revisar.**

---

## Play Store — revisión de políticas (2026-10-19 · código cerrado 2026-10-21)

Contexto: la web ya publica la política de privacidad y los términos en `https://gymlab.dev/privacidad` y `/terminos` (repo `WebGymLab`, T9/T10). Estado de cada punto para la revisión de Play Console:

> Detalle completo, specs y evidencia por tarea: `odd/tasks/play-store-revision.md`.

- [x] **Health Connect — link de privacidad roto** — `strings.xml` → `https://gymlab.dev/privacidad`. Verificado en emulador-5554: `PermissionsRationaleActivity` carga `https://gymlab.dev/privacidad/` (title «Política de Privacidad — GymLab»); el dominio viejo `gymlab.app/privacidad` responde **404** (comprobado con fetch).
- [x] **Divulgación de Health Connect en la política web** — sección 6 «Salud y actividad física» en `WebGymLab/src/pages/privacidad.astro` (12 secciones) y en la política in-app (`privacidad.secciones.salud` + `permisos`, es/en). Deployada primero (`329ecb3`) y actualizada el 2026-10-30 (política 29/10, región UE y retención): `https://gymlab.dev/es/privacidad/` y `/en/privacidad/` verificados en producción.
- [ ] **Health apps declaration** en Play Console (App content → Health apps) — **acción del usuario**. Declarar: acceso a Health Connect, tipo «Activity / steps», lectura diaria de pasos + lectura en segundo plano para el widget; uso solo en el dispositivo, sin publicidad, sin venta; permiso revocable por el usuario.
- [ ] **Data safety** — **acción del usuario**. Respuestas listas en `docs/PLAY-STORE-DATA-SAFETY.md`:
  - `App activity → App interactions` — recogido · **opcional** (toggle `telemetry`, **OFF por defecto**) · no compartido · cifrado.
  - `App info and performance → Crash logs` (Sentry) — recogido · opcional · no compartido · cifrado.
  - `Device or other IDs` (distinct_id pseudónimo de PostHog) — recogido · opcional · no compartido · cifrado.
  - **No** se declara `Diagnostics`: PostHog tiene `capture_performance` y `capture_performance_opt_in` en `false`.
  - `Health and fitness`, `Location`, `Personal info`, `Financial info`, `Photos` — **no recogidos** (todo queda en IndexedDB; PostHog no usa autocapture y el `before_send` borra texto, valores, hrefs y atributos).
  - Ads: **No** (AdMob no instalado). IAP: **No**.
  - Sentry y PostHog son encargados del tratamiento bajo DPA; ambos tienen IP descartada. Sin `Approximate location`.
- [x] **Política live 29/10** — desplegada en WebGymLab “datos pseudónimos” + telemetría OFF por defecto (ES/EN verificados en producción, 2026-10-30).
- [x] **Permisos/divulgación** — `PermissionsRationaleActivity` + alias declarados en el manifest y apuntando a la política correcta (verificado en emulador).
- [x] **Email de contacto** — código unificado a `gymlab@gymlab.dev` (`src/config/contact.ts`). Buzón resuelto el 2026-10-21 con **Cloudflare Email Routing (gratis)**: `gymlab@gymlab.dev` → destino personal verificado; MX, SPF y DKIM propagados (verificados desde 1.1.1.1 y 8.8.8.8) y **prueba real de recepción OK**. Sin buzón pago. Nota: Email Routing es solo recepción; las respuestas salen desde el Gmail personal.
- [ ] **Titular** — no bloquea Play; sí GDPR. Requiere nombre/razón social y NIF del responsable en la política (dato del usuario, no del código).
- Términos: no son requisito de Play; no bloquean.

**Hallazgo fuera de alcance — RESUELTO (2026-10-22):** `SITE_URL` (`src/hooks/useSeo.ts`) e `index.html` (canonical + `og:url` + `og:image`) apuntaban a `https://gymlab.app`, que no es propiedad del proyecto. Con el deploy en `app.gymlab.dev` pasaron a ese host y `wrangler.jsonc` declara el custom domain.

**Hallazgo fuera de alcance — RESUELTO (2026-10-23):** `app.gymlab.dev` se declaraba `robots: index, follow` y su `/robots.txt` respondía el HTML del SPA con `text/html`, así que competía con la landing sin aportar contenido. `index.html` pasa a `noindex, nofollow` y `public/robots.txt` (nuevo) responde como texto con `Allow: /`; el rastreo queda permitido **a propósito**, porque un `Disallow` impediría leer el `noindex` y la URL terminaría indexada sin contenido. La superficie indexable queda entera del lado de `gymlab.dev`. Verificado: `npm run build` limpio, `dist/robots.txt` presente, `dist/index.html` con el meta nuevo, `npm test` **167 archivos / 1666 tests**; review Gentle AI `review-11db9ea7edece812` (medium, 1 lente) **approved con 0 hallazgos**, autoridad quemada. Commit `d735a532`. Contexto y seguimiento SEO: repo `WebGymLab`, `odd/tasks/seo-copy-indexable.md` (T15.4).

---

## Fases 124 y 126 — Telemetría móvil y legal (2026-10-22)

> **Fase 125 — Salida de datos que la app no decide:** completada y archivada en `COMPLETED.md` (2026-10-29). Backup del sistema desactivado + reglas de exclusión, avatares locales y allowlist remota eliminada.

> Origen: verificación del build publicado en `app.gymlab.dev` y del contenedor Android. Hallazgos: (1) el build de producción corre **sin** `VITE_SENTRY_DSN` ni `VITE_POSTHOG_PROJECT_KEY`, así que la telemetría está apagada y la declaración de Data safety redactada no coincide con el código; (2) `android:allowBackup="true"` sin reglas permite que Android Auto Backup suba el almacenamiento del WebView al Drive del usuario; (3) los avatares predefinidos se piden a `images.unsplash.com`, el único request a un tercero en runtime; (4) iOS es solo scaffolding de Capacitor y no implementa HealthKit, aunque la política lo menciona.

### Fase 124 — Telemetría móvil activa: Sentry + PostHog — EN CURSO (queda la verificación de red del release, reformulada)

**Objetivo**: que el APK y el build web envíen telemetría pseudónima de verdad, con el gate de consentimiento intacto y verificable por red.

**Contexto técnico (verificado en código, 2026-10-22)**

- `src/lib/telemetry.ts`: gate `producción && claves && consentimiento`. Los SDK se importan dinámicamente **dentro** del gate (`import('posthog-js')`, `import('@sentry/react')`): sin claves no se descargan.
- PostHog: `api_host: 'https://eu.i.posthog.com'`, `capture_pageview: false`, `autocapture: false`, `capture_performance: false` y `before_send` que borra `text`, `innerText`, `value`, `href`, `name`, `$el_text` y `attr__*`.
- Sentry: `tracesSampleRate: 0` y replays 0 — solo excepciones con contexto etiquetado.
- Transporte en Android: JS del WebView (origen `https://localhost`, default de `androidScheme`) → `fetch`/`XHR` de Chromium → permiso `INTERNET` → TLS a `eu.i.posthog.com` / `ingest.de.sentry.io`. **Sin SDK nativo, sin plugin Capacitor intermedio, sin servicio en background.**
- Identidad: `distinct_id` = UUID pseudónimo en `localStorage` del origen; sin GAID/AAID ni huella de dispositivo.

**Tareas**

- [x] Proyectos creados (2026-10-22): Sentry **EU** (`ingest.de.sentry.io`) y PostHog **EU Cloud** (proyecto 316300). Claves cargadas en `.env` local.
- [x] Cloudflare → Worker `gymlab-app` → Builds → **Build variables** (`VITE_SENTRY_DSN`, `VITE_POSTHOG_PROJECT_KEY`) + **Retry build** (2026-10-22). Verificado en producción: `index-XXlCnQlq.js` lleva el DSN y la clave, y salen `POST https://eu.i.posthog.com/e/` y `/i/v0/e/`.
- [x] `gymlab-app/.env` local con las mismas dos variables para el build del APK (`.env` está gitignoreado).
- [x] Verificado con el build de producción servido en local: el gate abre y salen `POST https://eu.i.posthog.com/e/` y `/i/v0/e/`.
- [ ] **Verificar la red del build release** — *reformulada 2026-11-03*: `chrome://inspect` **no aplica** (la build release no es inspeccionable por CDP, comprobado en la validación física). En el APK release instalado: activar el toggle de telemetría → **Ajustes → Datos → Backup → Exportar** (emite `data_exported`) → el evento debe aparecer en **PostHog EU (proyecto 316300)**. Apagar el toggle, repetir el gesto → sin eventos nuevos (`telemetry.ts` ya expone `close()` para Sentry).
- [x] CHANGELOG bajo `[Unreleased] → Changed`.

**Trampa de verificación (2026-10-22)**: `posthog-js` descarta eventos si el user-agent parece un bot, y `HeadlessChrome` está en esa lista. Con Chrome headless se ve `config.js` y `surveys.js` pero **cero POST**, aunque todo funcione. Hay que falsear el UA (`Network.setUserAgentOverride`) antes de concluir que la telemetría está rota.

**Criterio de aceptación**: con el toggle ON hay eventos visibles en ambos paneles; con OFF no sale ningún request nuevo. Sin claves, los builds de desarrollo siguen sin descargar ningún SDK (comportamiento actual, que no debe cambiar).

### Fase 126 — Legal y Play alineados con el código — EN CURSO (faltan las declaraciones de Play y el texto de HealthKit)

**Objetivo**: que política, términos y declaraciones digan lo que el código hace, y nada más.

- [x] `/privacidad` + `/terminos` (ES/EN, repo `WebGymLab`): “datos pseudónimos” y telemetría OFF por defecto desplegados y verificados en producción; Sentry/PostHog declarados.
- [x] **Región y retención**: Sentry/PostHog como encargados en la UE (`ingest.de.sentry.io`, `eu.i.posthog.com`); Sentry errores hasta 30 días y PostHog eventos hasta 1 año; sin publicidad ni venta.
- [x] **Backup del sistema**: Fase 125 lo dejó en `false` (`allowBackup="false"` + `dataExtractionRules`); no hay backup que declarar en la política.
- [ ] **Data safety**: respuestas en `docs/PLAY-STORE-DATA-SAFETY.md` (App interactions, Crash logs, Device IDs; **sin Diagnostics**; telemetría **OFF por defecto**; Ads/IAP: no; eliminación: reset/desinstalar/email). Falta cargar en Play Console.
- [ ] **Health apps declaration**: sin cambios por estas fases (pasos + Health Connect); la declaración está en `docs/PLAY-STORE-DATA-SAFETY.md`; falta cargarla en Play Console.
- [ ] **iOS / HealthKit en la política**: el build iOS no implementa HealthKit y la política lo menciona en 4+ cadenas es/en (`privacidad.secciones.salud`, `permisos` y sus equivalentes de Términos). **Decisión 2026-11-03: ajustar el texto** — iOS no se publica — en vez de implementarlo.
- **Cuentas (Fase 133)**: no pertenece a este bloque; lo cubre **133.4** (política, Data safety y App Privacy con identidad + borrado).

**Criterio de aceptación**: una fila de Data safety por cada dato que sale del dispositivo y ninguna que declare algo que el código no hace; la política nombra los hosts externos reales (`eu.i.posthog.com`, `ingest.de.sentry.io`) y el backup del sistema está desactivado.

## Fase 129 — Monetización — PROPUESTA (2026-10-22)

**Objetivo**: definir e implementar un modelo de ingresos que no rompa el local-first ni el posicionamiento de privacidad.

**Detalle completo**: `odd/tasks/monetizacion.md` — canales evaluados uno por uno, requisitos técnicos, esfuerzo, ingreso esperado, riesgos, fiscalidad (merchant of record vs IVA propio), legal por opción, métricas y preguntas abiertas.

**Decisión pendiente del owner**: qué opción se ejecuta primero. El documento recomienda afiliados → pack digital → Pro de pago único, y **no** anuncios antes de validar pago.

- [ ] **M1 — Afiliados + apoyo** (0 infraestructura): divulgación de enlaces, 5–10 enlaces contextualizados, página de apoyo, eventos `affiliate_click` / `support_click`.
- [ ] **M2 — Pack digital con merchant of record** (Lemon Squeezy/Paddle): un programa de 12 semanas, página de venta, entrega automática, términos de venta y reembolso.
- [ ] **M3 — Pro de pago único con Play Billing**: 3–5 extras (nunca el catálogo, las calculadoras ni el registro), restauración de compras, pruebas con licencia de prueba.
- [ ] **M4 — Suscripción**: bloqueada hasta la Fase 133 (cuentas + sync); el único argumento honesto es backup/sync en la nube. Necesita fase propia de billing (entitlement, restore, compra anónima → reclamar; ver C9).
- [ ] **M5 — Anuncios AdMob**: condicional, solo si M3 falla y con revisión explícita del costo de marca (contradice la banda de privacidad).
- [ ] **Fase 126 absorbe el legal** de la opción elegida: términos de venta, reembolsos, renuncia al desistimiento, ID de publicidad si aplica.

## Fase 130 — Publicación en Play Store — PRIORIDAD ACTUAL (2026-10-22)

**Objetivo**: publicar en el track de producción desde una cuenta **de organización**.

**Detalle completo y check-list de salida**: `odd/tasks/play-publicacion.md`.

**Prioridad declarada por el owner**: esta fase pasa delante de la 125 y la 129, que quedan documentadas pero no urgentes.

**Estado (2026-10-30)**: keystore + properties + signingConfig + **AAB y APK release firmados** (`jarsigner`/`apksigner` OK). La ficha está preparada en `release/play-store/`; la subida a testing interno sigue bloqueada por la cuenta de organización/D-U-N-S y por las declaraciones.

**Bloqueadores actuales**: (1) cuenta de organización/D-U-N-S; (2) declaraciones (Health apps/Data safety/content rating/público); (3) subida y verificación desde testing interno. La política live 29/10 ya está desplegada.

- [x] **Keystore + signingConfig**: `android/gymlab-release.jks` + `android/keystore.properties` (gitignoreados) + `signingConfigs.release`; `bundleRelease` firmado y `jarsigner` verificado.
- [x] **Backup del keystore en KeePass**: el owner confirmó la copia en KeePass (2026-10-30). Falta una segunda copia fuera de KeePass.
- [ ] **Play App Signing**: activar/decidir al subir el AAB.
- [x] **AAB firmado**: `app-release.aab` (111,7 MB) con `jar verified`.
- [x] **APK release firmado**: `app-release.apk` verificado con `apksigner` (v2, `CN=GymLab`); copia en `Escritorio\GymLab-1.0.0-release.apk`.
- [ ] **AAB probado desde testing interno**: instalación desde Play y verificación en dispositivo real.
- [x] **Ficha**: feature graphic, screenshots PNG, textos ES/EN (la app ya arranca en inglés; la ficha no puede quedar solo en español) → `release/play-store/` (2026-10-30); falta subirla a Play Console.
- [ ] **Declaraciones**: Health apps, Data safety con la telemetría activa, content rating, público objetivo.
- [ ] **Cuenta de organización** verificada (D-U-N-S si aplica): exime del closed testing con 12 testers que se exige a las cuentas personales nuevas.
- [x] **Fase 126**: región de tratamiento (UE) y plazos de retención agregados a la política in-app/estática y web.
- [ ] **Verificación final** en dispositivo real desde producción: instalación, onboarding, entreno completo, export de backup.
- [ ] **Cuentas (Fase 133)**: declaraciones de Play (account data, deletion) y verificación final de login/sync además de onboarding + entreno + export.

## Fase 131 — Endurecimiento de Cloudflare — CASI CERRADA (quedan MFA/DNSSEC/Bot Fight Mode)

**Objetivo**: cerrar los hallazgos del audit de la zona `gymlab.dev` (incluye `app.gymlab.dev`), la cuenta y la landing.

**Detalle, evidencia y comandos de verificación**: `odd/tasks/cloudflare-endurecimiento.md`.

**Resumen**: 2 Moderate (MFA de la cuenta, Bot Fight Mode apagado), 2 de transporte (HSTS apagado, TLS mínimo 1.0), 3 de DNS/correo (DMARC y CAA ausentes, DNSSEC deshabilitado), 2 de código web (`security.txt` y headers en la landing) y 2 que no aplican o son decisión (Turnstile sin formularios, AI Labyrinth). **Aplicados 2026-10-24:** HSTS, TLS 1.2, DMARC, CAA, `security.txt` y headers.

- [ ] **MFA** en la cuenta de Cloudflare — detrás de ese login están DNS, Workers, certificados y el dominio. **(Requiere dashboard + teléfono; sigue abierto.)**
- [x] **HSTS** y **Minimum TLS 1.2** en SSL/TLS → Edge Certificates — aplicados y verificados (`odd/tasks/cloudflare-endurecimiento.md`).
- [x] **DMARC** (`_dmarc` TXT con `p=none` + `rua`) y **CAA** restringiendo las CAs — aplicados y verificados.
- [ ] **DNSSEC**: activar en Cloudflare **y** cargar el DS en DonDominio (sin DS el dominio deja de resolver). **(Sigue abierto: falta el DS en DonDominio.)**
- [x] **`security.txt`** y **headers de seguridad** en la landing (repo `WebGymLab`) — cerrados (`b61a333` + `public/_headers`), 200 en producción.
- [ ] **Decidir** Bot Fight Mode y AI Labyrinth (el primero puede desafiar scrapers y previews). **(Decisión de producto pendiente.)**
- [x] **Verificar** cada fix con los comandos del task doc — verificados los aplicados; MFA/DNSSEC/Bot Fight Mode siguen abiertos.

**Verificación 2026-10-24**: el MCP se re-autenticó con escritura y aplicó HSTS, TLS 1.2, DMARC, CAA y el WAF/rate limiting; el RUM de la zona sí está instalado (`siteTag 59ae492f…`). Los builds fallidos siguen sin un endpoint útil. MFA, DNSSEC y Bot Fight Mode quedan como acciones del owner/decisión.

---

## Fase 133 — Cuentas + sync multi-dispositivo — PLANIFICADA (2026-10-31)

**Objetivo**: que el usuario pueda crear una cuenta (Google, Apple o email) y ver **los mismos datos en cualquier dispositivo**, sin romper el local-first: la app sigue funcionando sin cuenta y sin red, y el servidor no es requisito para usarla.

**Origen (verbatim)**: «activa multisesion, vamos a pensar como implementar el backend y cuentas con oauth con gmail, etc, vamos a planificar».

**Diseño**: `docs/superpowers/specs/2026-10-31-cuentas-sync-design.md` (rama `cuentas-oauth`, worktree `.worktrees/cuentas-oauth`). Estado: diseño propuesto; **no se escribe código hasta cerrar los conflictos C1–C14** en la próxima sesión.

**Decisiones base**: Supabase (Postgres + Auth) región EU/Frankfurt; login Google + Apple + email link mágico; cuenta opcional con prompt después del primer entreno; sync bidireccional por outbox + cursor + LWW + tombstones; identidad global `uid` (UUID) con ids numéricos locales; referencias al catálogo por `slug`/`foodKey`; servidor con tabla genérica `sync_records` + RLS; privado por defecto; fotos, social y Watch/Wear fuera de esta fase.

### Subtareas

- [ ] **133.0 — Cerrar decisiones abiertas** (próxima sesión): resolver C1–C14 (C1–C8 son las 8 preguntas del builder check). Sin código hasta que estén cerradas.
- [ ] **133.1 — Preparación local (sin backend)**: Dexie v19; `uid`/`updatedAt` en las tablas que faltan; `exerciseSlug` en sets/ítems/notas; `visibility` default private; tablas `syncOutbox`, `syncTombstones`, `syncState`; hooks de creating/updating/deleting; tests de merge. Se puede mergear sin cambiar el comportamiento visible.
- [ ] **133.2 — Supabase + Auth**: proyecto EU; Google, Apple y email; deep links `gymlab://auth/callback`; sesión en almacenamiento seguro; UI de cuenta en Ajustes; logout; borrado de cuenta (Edge Function + limpieza local/PostHog/Sentry).
- [ ] **133.3 — Motor de sync**: RPC `sync_push`/`sync_pull`; outbox + cursor; merge LWW + unión; tombstones; estado visible y “forzar sync”; primer login con merge sin pérdida.
- [ ] **133.4 — Endurecimiento + legal**: refresh de token y `needs_reauth`; backoff; export/import con sync; identidad en telemetría (con gate de consentimiento); política/Data safety/App Privacy; prueba en emulador con deep links.
- [ ] **133.5 — Cierre**: verificación completa (build, tests, e2e de dos dispositivos, RLS, emulador), CHANGELOG, PLAN, merge `--ff-only` cuando las otras sesiones estén idle.

### Impacto en otras fases

| Ítem de PLAN.md | Qué pasa |
|---|---|
| 100.2 — Sync local ↔ nube | Implementado por 133.3 |
| 100.3 — Identidad en telemetría | Decidido en 133.4: `identify` con `user.id` solo con consentimiento; Data safety pasa a “vinculado a la identidad” (C10) |
| 100.4 — Borrado a pedido | Implementado en 133.2/133.4 (nube + local + PostHog + Sentry) |
| 100.6 — Región del backend | Implementado en 133.2: Supabase EU (Frankfurt) |
| 100.1 — Mapa de calor | Sigue después de 133; es analytics, no sync |
| 100.5 — Warehouse de PostHog | Sigue después de 133; recién tiene sentido con Postgres |
| M4 — Suscripción (Fase 129) | Desbloqueada por 133; necesita fase propia (billing, entitlement, restore, compra anónima → reclamar) |
| Fase 126 — Legal | Suma datos de cuenta vinculados y borrado in-app + URL web |
| Fase 130 — Play | Suma declaraciones de cuenta y verificación final de login/sync |
| Sección Producto — “Supabase en fase social” | Queda vieja: Supabase entra ahora para cuentas/sync; social lo reutiliza |
| Modelo Dexie (sección Producto) | Actualizado a las 29 tablas reales |
| AGENTS.md — “no auth/backend en MVP sin pedirlo” | Cumplido: esta fase lo pide explícitamente |

### Conflictos / decisiones abiertas (resolver en la próxima sesión)

- **C1 — Cambio de cuenta en el mismo dispositivo**: la spec conserva lo local al hacer logout (S8) y sube todo en el primer login (S6). Entrar con otra cuenta subiría los datos de A a B, y el cursor de A saltearía los de B. Decidir: particionar Dexie/outbox/cursor por cuenta, o bloquear el cambio hasta borrar lo local.
- **C2 — FKs al seed**: `workoutSets.workoutId`, `routineDays.routineId`, `routineItems.routineDayId` y `sessionJournals.workoutId` son ids numéricos locales; `workouts.routineId`/`routineDayId` y `activeProgram.routineId` apuntan a rutinas del seed, que no viajan y cuyo `uid` se regenera en cada `SEED_VERSION`. Decidir: traducir todo a uid o usar `slug` + `dayIndex` para el seed.
- **C3 — Singletons**: `profile` (id=1), `activeProgram` (id=1), `meta` (PK=key) y `exerciseNotes` (PK=exerciseId). `activeProgramRepo.set` hace `clear()`+`add`, así que cada activación genera un `uid` nuevo. Decidir: uid determinístico por singleton/clave, o apply por clave ignorando el uid.
- **C4 — Tablas por día**: `dailySteps` tiene índice único `&localDate`; `bodyWeight`, `bodyMeasurements`, `skinfolds` y `mealEntries` también son por día. La spec los trata como hechos que se suman, pero dos dispositivos el mismo día chocan con el índice único. Decidir: merge por día (LWW) o unión por uid quitando el índice.
- **C5 — Restore de backup con sync**: `importBackup` hace `clear()`+`bulkAdd`; `clear()` no dispara hooks `deleting`, así que no hay tombstones y `bulkAdd` encola todo. Decidir: restore solo local (y el pull revive lo borrado), “verdad local” (push + tombstones de lo que falta) o exigir logout/wipe antes.
- **C6 — Contrato de revisión/cursor**: el `revision` del push no debe avanzar el cursor (saltearía registros de otros dispositivos), y un UPDATE debe generar revisión nueva (hoy el default `nextval` solo aplica en INSERT). Definir el RPC y el loop.
- **C7 — Tombstone vs edición posterior**: la spec define la regla solo para series. Para workouts, rutinas y notas: ¿una edición posterior resucita? Es la garantía central de S5.
- **C8 — `periodizationPlans.isActive`**: dos dispositivos activan planes distintos → dos filas `isActive: true`; el LWW por fila no lo resuelve. Decidir si activar uno desactiva el resto.
- **C9 — Compra anónima (M4)**: si la cuenta es opcional, un usuario puede comprar sin cuenta. Definir el flujo de “reclamar compra” al registrarse.
- **C10 — Identidad en telemetría**: `identify` con `user.id` cambia Data safety de “pseudónimo” a “vinculado a la identidad”. Confirmar la decisión y el gate de consentimiento.
- **C11 — Stub social obsoleto**: `socialProfiles`/`posts`/`postMedia` con `remoteId`/`syncedAt` no se sincronizan en esta fase; no construir sobre ese stub.
- **C12 — Auto Backup apagado**: la Fase 125 dejó `allowBackup="false"`; los anónimos no tienen respaldo. Mitigación: prompt de cuenta + export. Confirmar que se mantiene.
- **C13 — Titular de la política**: el titular de la Fase 126 sigue pendiente; con cuenta pasa a ser más urgente (GDPR).
- **C14 — Borrado de cuenta en Play**: requiere URL web además del flujo in-app.

### Fuera de alcance

Fotos de progreso, feed social, Watch/Wear OS, tiempo real, CRDT, cuenta obligatoria y billing.

---

> **Fase 134 — Estado persistente entre pantallas:** completada y archivada en `COMPLETED.md` (2026-11-02).

---

## Fase 135 — Widget en tiempo real (podómetro + notificación) — PLANIFICADA (2026-11-02)

**Objetivo**: que el widget de pasos (y, más adelante, una notificación) se actualice casi al instante, como una app de podómetro, sin abrir la app.

**Origen (verbatim)**: «no se puede actualizar mas seguido? tengo una app que se llama podometro y se actualiza con cada paso detectado del healt connect, cada que se refresca el dato se refresca la app, por lo que me gustaria que fuera asi, dime que limitaciones tenemos y cuales son las posibles soluciones para que se refresque el wifget/notificacion(en un futuro) cada vez que healt connect actualiza el dato».

**Estado**: planificada para otra sesión. No se escribe código hasta cerrar 135.0.

**Punto de partida (ya resuelto, 2026-11-02)**: el refresco best-effort con la app cerrada funciona y está verificado en teléfono real (worker de WorkManager cada ~15 min + tick del widget cada 30 min; commit `d63b3620`). Esta fase baja la latencia de 15–60 min a segundos.

**Orden decidido por el usuario (2026-11-02)**: **Plan A como principal, Plan B como alternativa.**

### Plan A — Podómetro (principal)

Servicio en primer plano con `Sensor.TYPE_STEP_COUNTER`: un evento por paso, la misma vía que usa una app de podómetro. La notificación permanente del servicio **es** el vehículo de la notificación futura.

- **Latencia**: por paso (con throttle de render).
- **Costo**: notificación permanente, permiso `ACTIVITY_RECOGNITION`, declaración de foreground service de salud en Play Console.
- **Limitación**: cuenta solo el sensor del teléfono; Health Connect agrega reloj y otras apps → reconciliar cada 15 min.
- **Throttle**: actualizar widget/notificación cada 30–60 s o cada N pasos; nunca un `RemoteViews` por paso.

### Plan B — Servicio en primer plano + polling a Health Connect (alternativa)

Servicio en primer plano que consulta `aggregate` cada 30–60 s y actualiza el widget.

- **Latencia**: ~1 min.
- **Costo**: notificación permanente + batería (IPC a Health Connect cada minuto) + declaración de FGS.
- **Ventaja**: refleja todas las fuentes (reloj + teléfono), no solo el sensor del teléfono.
- **Cuándo usarlo**: si el Plan A no cubre pasos de reloj/otras apps, o si el dispositivo no expone el sensor.

### Límites de plataforma (no negociables)

- Health Connect **no tiene push**: `aggregate`/`getChanges` son consultas; nada despierta la app cuando entra un paso.
- WorkManager periódico: mínimo **15 min**, best-effort (Doze / App Standby / gestores OEM).
- `updatePeriodMillis` de widget: mínimo **30 min**.
- Alarmas exactas (<15 min): restringidas por Play desde Android 14; no fiables para esto.
- **Solo Android**. En iOS, WidgetKit no permite refresco continuo (15–60 min); Live Activities no es equivalente.

### Subtareas

- [ ] **135.0 — Cerrar decisiones** (próxima sesión): Plan A vs B definitivo, throttle de render, regla de reconciliación con Health Connect, alcance/texto de la notificación permanente, comportamiento si el usuario apaga el servicio.
- [ ] **135.1 — Servicio en primer plano** (`FOREGROUND_SERVICE_HEALTH`): ciclo de vida, `START_STICKY`, arranque desde Ajustes, parada explícita, sobrevivir a reinicio si quedó activo.
- [ ] **135.2 — Sensor** (`TYPE_STEP_COUNTER` + `ACTIVITY_RECOGNITION`): baseline del día, delta desde el arranque del servicio, throttle, batería.
- [ ] **135.3 — Reconciliación**: `aggregate` de Health Connect cada 15 min para no perder pasos de reloj/apps; Health Connect manda como fuente de verdad.
- [ ] **135.4 — Widget + notificación**: render throttled, estados (activo / inactivo / sin permiso), deep link a `/pasos`, copy es/en.
- [ ] **135.5 — Ajustes → Permisos**: sumar `ACTIVITY_RECOGNITION` y el estado del servicio al lugar único ya existente.
- [ ] **135.6 — Play Console**: declaración de FGS de salud y de `ACTIVITY_RECOGNITION`; actualizar Data safety.
- [ ] **135.7 — Cierre**: verificación en teléfono real (app cerrada, pantalla apagada, Doze), CHANGELOG, PLAN, commit.

### Criterios de aceptación (borrador)

- Con el servicio activo, el widget refleja un cambio de pasos en ≤60 s con la app cerrada y la pantalla apagada.
- El número del widget converge con `/pasos` (Health Connect) después de la reconciliación.
- Apagar el servicio devuelve el comportamiento best-effort de 15–30 min sin romper nada.
- Consumo: el servicio no aparece en el top de batería en 24 h.

---

> **Fase 136 — Hallazgos de la validación física de release:** completada y archivada en `COMPLETED.md` (2026-11-04).

---

## Fase 137 — Volumen muscular y balance con ventana mensual (v1) y señales avanzadas (v2) — PLANIFICADA (2026-11-04)

**Objetivo**: reemplazar la semántica de «frecuencia muscular» (días tocados en 7 días contra una cuota fija) por un modelo de **volumen semanal por músculo** sobre **28 días móviles**, con **separación real de los grupos grandes** (pierna, hombro, espalda), **volumen efectivo** (directo + sinérgico) y alertas accionables de desbalance, consistencia y abandono.

**Origen (verbatim)**:
- «verifica como funciona frecuencia muscular en stats, creo que necesita un cambio de comportamiento ya que como esta ahora no le veo sentido» (2026-11-04).
- «creo que para tener mas datos, debe ser mensual, dame ideas para que de informacion relevante en cuanto a los posibles desbalances que hay en el entreno» (2026-11-04).
- «habria que separar mejor los grupos musculares» / «para que un grupo dan grande como piernas este separado» (2026-11-04).
- «es multiple no? no deberia contar en varios? si es peso muerto rumano seria isquios pero el convencional trabaja varios musculos, verificalo» (2026-11-04).

**Estado**: planificada. No se escribe código hasta cerrar 137.0.

### Diagnóstico del comportamiento actual (verificado en código)

- Ventana móvil de 7 días (`EntrenoTab.tsx:34-40`) y conteo de **días distintos** con al menos una serie (`muscleFrequency.ts:48-73`).
- Objetivo fijo por grupo (`muscleFrequency.ts:6-17`): 2/semana salvo abdomen 3 y trapecios/antebrazo 1; **ignora la rutina, el programa y `weeklyGoal`**.
- Alerta si `|actual − objetivo| / objetivo > 20%` (`muscleFrequency.ts:79-88`), **sin dirección** (sobre y bajo se ven igual).
- Con objetivo 2, el único estado sin alerta es exactamente 2 días: 1 = −50 %, 0 = −100 %, 3 = +50 %. Una semana perfecta y constante oscila en alerta y cualquier composición de rutina dispara el banner.
- La etiqueta dice «sesiones» pero cuenta **días**, y una serie cuenta igual que una sesión completa.
- F136.1 corrigió el inicio de la ventana (domingo → 7 días móviles); **no** cambió qué se compara.

### Decisiones

1. **Ventana de 28 días móviles (4 semanas) por defecto**, con toggle a 7 días. Se descarta el mes calendario: 28 móviles siempre compara 4 semanas completas.
2. **Eje = series semanales por músculo** (`series ÷ semanas de datos`), no días tocados.
3. **La banda se mide en series directas; el aporte sinérgico se informa como volumen efectivo**. La tabla del usuario está expresada en series directas («bíceps 8–12 directas»), así que la alerta usa esa moneda y el volumen efectivo (`directas + 0,5 × sinérgicas`) se muestra aparte. Fundamento: la meta-regresión de dosis-respuesta (Pelland et al., 2024/2025) encontró que el conteo **fraccional** —directas 1,0, indirectas 0,5— predice mejor hipertrofia y fuerza que contar todo al 100 % (infla los grupos chicos) o solo las directas (las subestima).
4. **Bandas, no puntos**: se alerta fuera de la banda; dentro, sin alerta.
5. **Datos insuficientes se dicen**: con menos de 4 semanas de historial se divide por las semanas reales y se muestra «datos parciales», nunca una alerta.
6. **Rangos confirmados por el usuario (2026-11-04)**: pierna 12–16 por músculo (cuádriceps e isquios por separado), abdomen 8–12, trapecios 4–8 (alerta solo si la rutina los programa) y antebrazo 0–6 sin alerta.

### Separación de grupos grandes (medido 2026-11-04)

Hoy `MuscleGroup` tiene 10 grupos y `MuscleZone` agrega una segunda capa, pero la medición sobre el catálogo real (821 filas de `public/catalog/exercises-v2.json`) muestra que **la separación no existe en los datos**:

| Grupo | Ejercicios | Sin zona inferida | Zonas detectadas |
|---|---|---|---|
| pierna | 266 | **222 (83 %)** | cuádriceps 7, femoral 16, gemelo 19, aductor 3, abductor 1 |
| hombro | 120 | **120 (100 %)** | ninguna regla de hombro |
| espalda | 101 | 61 (60 %) | dorsal 40 |
| glúteo | 21 | 21 (100 %) | la regla `glute` no matchea «glúteo» por el acento |

Causa: `muscleZoneInference.ts` solo tiene reglas para pierna (extensión/cuádriceps, femoral, gemelo, aductor/abductor), pecho, glúteo y dorsal. `sentadilla`, `prensa`, `hack`, `zancada` y `búlgara` no matchean, y **hombro no tiene ninguna regla**. Además, `muscleZones` es **multivaluado** (un press de banca toca pecho + tríceps + hombro), así que no sirve tal cual para atribuir volumen: se necesita un **primario único** más los **sinérgicos** con su factor.

**Diseño: capa derivada `volumeGroup` + sinérgicos** (dominio, sin tocar el catálogo, los filtros ni las rutinas):

- Un **primario** por ejercicio: cuádriceps, isquios, gemelos, glúteo, pecho, espalda, hombro lateral, hombro posterior, bíceps, tríceps, abdomen, trapecios, antebrazo. Se deriva de `muscleZones` cuando hay zona válida y cae al `muscleGroup` cuando no: nunca se pierde la serie.
- **Sinérgicos** por ejercicio con factor **0,5**: se cargan con una tabla curada para los compuestos que concentran el solapamiento (sentadilla, prensa, peso muerto, rumano, hip thrust, press banca, press militar, remo, jalón/dominada, fondos, curl, extensión) y, para el resto, por patrón (compuesto vs aislamiento). Los ejercicios sin datos de sinérgicos cuentan solo como directos.
- Reglas nuevas de inferencia para pierna y hombro: sentadilla/prensa/hack/zancada/búlgara/step → cuádriceps; femoral/rumano/good morning/curl femoral → isquios; gemelo/pantorrilla → gemelos; elevación lateral → hombro lateral; face pull/pájaros/reverse fly → hombro posterior; press militar → hombro anterior (informativo, sin banda).
- `coverageReport()` en dominio: % de series que caen en un `volumeGroup` con banda y % con sinérgicos resueltos. **Sin cobertura suficiente no se alerta**: se muestra «sin clasificar».
- Propagación: `inferZones` corre al cargar el catálogo (`catalogLoader.ts`), así que las reglas nuevas aplican sin migración; la curaduría manual se publica con `SEED_VERSION`/`CATALOG_VERSION` y el reseeder preserva rutinas y datos del usuario.

**Consecuencia**: piernas y hombros se separan en **v1**, porque sin separación los rangos del usuario no son aplicables. Lo que queda para v2 es lo que no depende de la separación.

**Medición después de 137.1 (2026-11-04)**: hombro **102/120 con banda y 18 excluidos por diseño** (100 % de lo que tiene banda; los excluidos son presses y elevaciones frontales), pierna **120/266 atribuidos y 140 sin datos** (mayormente plyometría, cardio y movilidad). El resto es el alcance de la Fase 138.

### Volumen efectivo: por qué el peso muerto cuenta en varios

La evidencia no respalda ni «un solo grupo» ni «sumar 1 a todos»:

- **EMG del peso muerto** (revisión sistemática, PLOS One 2020, 19 estudios): en el convencional, **erector spinae y cuádriceps muestran más activación que glúteo y femoral**; el rumano reduce el erector spinae y queda más femoral. Es un patrón de cadera multi-músculo, no un ejercicio de isquios.
- **Conteo**: la meta-regresión de dosis-respuesta (Pelland et al., 2024/2025) favorece el conteo **fraccional** (indirectas 0,5) frente a «todo 1,0» y «solo directas».
- **Asignación**: peso muerto convencional → primario **isquios** (es donde se programa el hinge) y sinérgicos **glúteo, espalda (erectores), cuádriceps y antebrazo a 0,5**. Rumano → primario isquios, sinérgicos glúteo y espalda a 0,5.
- **UI**: cada fila muestra **«12 directas · 18 efectivas»**; la banda y la alerta usan las directas, el efectivo da contexto y evita que un grupo chico parezca abandonado cuando recibe mucho trabajo indirecto.

### Rangos de volumen (referencia del usuario, 2026-11-04)

| Músculo (nivel) | Series directas/semana | Nota |
|---|---|---|
| Espalda | 14–18 | Tracciones verticales y horizontales |
| Pierna — cuádriceps | 12–16 | Dominantes de rodilla (sentadilla, prensa) |
| Pierna — isquios | 12–16 | Dominantes de cadera (peso muerto, curl femoral) |
| Pecho | 12–16 | Plano, inclinado y aperturas |
| Hombro — lateral y posterior | 10–14 | El anterior se cubre con presses de pecho |
| Bíceps | 8–12 | Series directas de flexión de codo |
| Tríceps | 8–12 | Series directas de extensión |
| Glúteo | 8–12 | Trabajo enfocado (hip thrust, zancadas) |
| Gemelos | 6–10 | Frecuencia alta (3×/sem), pesado y estiramiento controlado |

**Grupos que la tabla no cubre (confirmados por el usuario el 2026-11-04)**: **abdomen 8–12**; **trapecios 4–8** con alerta solo si la rutina los programa; **antebrazo 0–6 sin alerta por defecto**. Aductores/abductores y hombro anterior quedan sin objetivo propio.

### v1 — Volumen por `volumeGroup`

- Ventana 28 días móviles + toggle 7/28.
- Bandas por grupo de volumen, incluidos **cuádriceps 12–16**, **isquios 12–16**, **gemelos 6–10** y **hombro lateral+posterior 10–14**; el resto según la tabla.
- **Volumen efectivo** por grupo (directas + 0,5 × sinérgicas) como dato secundario, sin banda propia.
- Señales: **volumen** (alerta), **abandono** (alerta: última serie hace >10 días), **semanas en cero** (alerta: alguna de las 4 semanas sin series en un grupo con objetivo), **antagonistas** (alerta: pecho/espalda y bíceps/tríceps con ratio >1,5), **distribución de reps** (informativo: 1–5 / 6–15 / 16+).
- Grupos con cobertura insuficiente: fila informativa con «sin clasificar» y sin alerta.
- UI: máximo **3 tarjetas accionables** priorizadas y con la acción escrita; filas con la banda del grupo; fila expandible con las 4 semanas, las reps y el desglose directo/sinérgico.
- Se retira el banner «Grupos musculares con desbalance (>20%)» y la etiqueta «sesiones».

**Por qué primero**: no requiere migración (las reglas corren al cargar), usa datos que ya existen y es la única forma de aplicar los rangos por músculo que pidió el usuario.

### v2 — Señales avanzadas

- **Descanso entre exposiciones**: mediana de días entre días con series del mismo grupo (<2 = sin recuperación; >10 = desentrenamiento).
- **Referencia al objetivo del perfil**: los mismos 15 series/semana no significan lo mismo en fuerza que en hipertrofia (`profile.objective`).
- **Curación fina**: resolver a mano los ejercicios ambiguos que la regla no clasifica (peso muerto convencional, sentadilla frontal, variantes de hombro) y medir el efecto en la cobertura.
- **Factores de sinérgico por ejercicio** (opcional): hoy 0,5 fijo; se podría diferenciar por variante (rumano vs convencional) si la evidencia lo justifica.

**Por qué después**: son señales que necesitan más historia, datos curados o una decisión de producto; no bloquean el valor de v1.

### Posible rediseño visual (mockups, Nocturno Minimal) — propuesta

La sección actual es una lista de filas con barras y un banner de alerta. Con el modelo nuevo (bandas, 4 semanas, señales, 13 grupos y doble número) esa información no entra en el formato actual: **antes de implementar la UI se decide con mockups en el navegador** (compañero visual del `brainstorming`, como en la Fase 132): 2–4 variantes por pantalla, el usuario elige y recién ahí se escribe código.

Ideas a explorar en los mockups:

- **Mapa de volumen**: grilla de grupos con el color categórico de cada uno y el estado de la banda (bajo / dentro / alto) sin texto por fila; el detalle aparece al expandir.
- **Banda por fila**: barra horizontal con la banda dibujada como **zona**, no como un punto, y el valor de series/sem encima; el exceso se dibuja fuera de la banda (hoy `min(100, actual/objetivo)` oculta el sobre-entrenamiento).
- **Doble número**: directas grande y efectivas chica (o al revés), para que se lea la diferencia sin explicar la fórmula.
- **Triage de 3 tarjetas**: lo accionable arriba (déficit, abandono, antagonista) con la acción escrita; el resto queda como referencia.
- **4 semanas**: sparkline o barras semanales dentro de la fila expandible, para ver consistencia y semanas en cero.
- **Estados honestos**: «datos parciales» con menos de 4 semanas, «sin datos» sin historial y «sin clasificar» cuando la cobertura no alcanza, con la línea punteada de `StepEmptyState`.

Restricciones del design system (Nocturno Minimal):

- Sin tarjetas ni `panel-*` (retirados en 132.10): hairlines `border-border/40`, kickers en mayúsculas y el color del grupo como único acento.
- Mobile-first 390×844; touch targets ≥44 px; `prefers-reduced-motion` respetado.
- Reusar `muscleColor`/`useDataColors`, `StepChartSection` y `InfoTip`; el número grande va en el header de la sección.
- El toggle 7/28 se lee como segmentado, no como dos botones sueltos.

Flujo: mockups estáticos en `content/` servidos por el compañero visual → el usuario elige → spec en `docs/superpowers/specs/` → implementación. **No se escribe UI sin esa aprobación.**

### Subtareas

- [x] **137.0 — Cerrar decisiones**: rangos confirmados (2026-11-04); defaults fijados: rumano → espalda 0,5 (mismo factor, menos erector), ratio de antagonistas **1,5**, cobertura mínima para alertar **90 %**.
- [x] **137.1 — `volumeGroup` + sinérgicos (domain)**: `exercisePattern` (predicado compuesto/aislamiento compartido con descanso), `volumeGroup` (`attributeVolume` en tres estados —atribuido, excluido por diseño, sin datos— y sinérgicos al 0,5) y `volumeModel` (directas/efectivas en 28 días, cobertura por grupo, filtro de fuerza). Reglas nuevas de pierna y hombro. Commit `594f09b7`; assess **medium / under_budget**. Cobertura medida: hombro 102/120 con banda + 18 excluidos; pierna 120/266 (insumo de F138).
- [x] **137.2 — Bandas y estados**: `buildVolumeStats` con `sin-datos`, `datos-parciales` (<4 semanas), `sin-clasificar` (cobertura del grupo <90 %), `bajo/dentro/alto` (límites inclusivos) y `alert` que respeta `always` / `only-if-trained` / `never`. Commit `a89b390a`; assess **medium / under_budget**.
- [x] **137.3 — Señales**: `lastTrainedByVolumeGroup` + `isAbandoned` (>10 días), `weeklyDirectByGroup` (4 semanas y semanas en cero), `antagonistRatios` (pecho/espalda y bíceps/tríceps, ratio >1,5 con mínimo de 6 series) y `repDistributionByVolumeGroup` (1–5 / 6–15 / 16+). Commit `a89b390a`.
- [ ] **137.4 — Mockups (Nocturno Minimal)**: 2–4 variantes de la sección en el navegador y elección del usuario; spec en `docs/superpowers/specs/`.
- [ ] **137.5 — UI v1**: toggle 7/28, filas con banda, doble número (directas/efectivas), tarjetas accionables y expandible con 4 semanas + reps. Tests de componente.
- [ ] **137.6 — Copy/help/tour (es/en)**: retirar «sesiones» y el banner de ±20 %, explicar series directas, volumen efectivo, la ventana de 28 días y «sin clasificar».
- [ ] **137.7 — Cierre v1**: build, suite, validación en teléfono con datos reales, CHANGELOG y PLAN.
- [ ] **137.8 — Descanso y objetivo (v2)**: mediana entre exposiciones y rangos según `profile.objective`.
- [ ] **137.9 — Curación fina (v2)**: resolver los ambiguos y ajustar factores por variante si la evidencia lo justifica.
- [ ] **137.10 — Cierre v2**: igual que 137.7.

### Criterios de aceptación (borrador)

- Cuádriceps, isquios y gemelos se muestran y se alertan **por separado**; nunca como un total de «pierna».
- El peso muerto convencional suma a isquios como directo y a glúteo, espalda, cuádriceps y antebrazo como sinérgicos (0,5); el rumano no suma cuádriceps.
- Un grupo dentro de su banda **no** genera alerta aunque la ventana móvil se mueva.
- Un grupo con 0 series en una de las 4 semanas se marca aunque el promedio esté dentro.
- Un grupo entrenado por última vez hace más de 10 días se marca.
- Un grupo sin cobertura suficiente se muestra «sin clasificar» y **nunca** alerta.
- `npm run build` limpio y suite verde; validación en teléfono real con datos reales.

### Fuentes

- Pelland et al. (2024/2025), *The Resistance Training Dose-Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gain* — el conteo fraccional (indirectas 0,5) predice mejor que «total» (1,0) y «directo» (0).
- *Electromyographic activity in deadlift exercise and its variants. A systematic review* (PLOS One, 2020) — erector spinae y cuádriceps con más activación que glúteo/femoral en el convencional; el rumano reduce erector spinae.

### Fuera de alcance

- **Objetivos derivados de la rutina** (cuántos días programa cada grupo): otra fase; esta mide contra evidencia.
- Renombrar o reemplazar `MuscleGroup` en el catálogo, filtros o rutinas: la separación se resuelve en la capa `volumeGroup`.
- **Segmentación por evidencia de los 821 ejercicios** (primario + factores diferenciados por variante): **Fase 138**.
- Push/pull/legs: ya existe (`PushPullBalanceView`) y no se toca.


## Fase 138 — Segmentación por evidencia de los ejercicios restantes — PLANIFICADA (2026-11-04)

**Origen (verbatim)**: «para otra fase debemos buscar como segmentar los demas ejercicios que quedan con evidencia cientifica al igual que este, anotalo y seguimos con esta» (2026-11-04).

**Objetivo**: completar la atribución de volumen de los 821 ejercicios del catálogo con el mismo estándar que el peso muerto: **primario + sinérgicos con factor**, justificado por evidencia (EMG, biomecánica, consenso) y no solo por reglas de nombre.

**Punto de partida**: la Fase 137 deja `volumeGroup` (primario), una tabla curada para los compuestos que concentran el solapamiento y `coverageReport()`. Todo lo que quede sin clasificar o con el factor 0,5 por defecto es el insumo de esta fase.

**Alcance**:

- Revisar los ejercicios sin zona inferida (hoy 222/266 de pierna y 120/120 de hombro) y los ambiguos: peso muerto convencional, sentadilla frontal, variantes de hombro, remos y dominadas.
- Definir factores por ejercicio o patrón donde la evidencia permita diferenciar (por ejemplo, rumano vs convencional para erector spinae).
- Documentar la fuente de cada decisión (paper, EMG o consenso) en una tabla del catálogo.
- Medir el efecto en la cobertura y en las alertas antes y después.

**Dependencias**: 137.1 (`volumeGroup` + `coverageReport`) y 137.9 (curación fina) como entrada. No bloquea la Fase 137.

**Fuera de alcance**: renombrar `MuscleGroup` en el catálogo, los filtros o las rutinas.

## Deuda declarada — auditoría de `/domain` (2026-11-04)

> Pendiente para otra sesión: revisar `src/domain/` buscando lógica duplicada (el caso 1RM `prs`/`benchmark`), fuentes de verdad solapadas y oportunidades de optimización (una pasada por serie, mapas memoizados, evitar copias). La Fase 137 deja `exercisePattern`, `volumeGroup` y `volumeModel` con una sola responsabilidad cada uno, como base de esa auditoría. No se toca ahora.

## Fase 94 — Imágenes generadas por IA (sustituir emojis y símbolos de la UI) — PENDIENTE

**Objetivo**: eliminar de la UI renderizable todos los emojis/símbolos decorativos y sustituirlos por **assets estáticos generados con IA**, coherentes con el design system GymLab, manteniendo la app 100% offline-first (sin backend, sin API keys en runtime, sin costo por llamada).

**Decisión de pipeline (aprobada)**: assets estáticos en build. Las imágenes se generan fuera de la app (herramienta/prompt de IA), se guardan en `public/`, y se bundlan con Vite. La app nunca llama a una API de imágenes en runtime.

### Inventario (evidencia recolectada 2026-09-12)

Escaneo de `src/` + `public/` con rango Unicode de emojis/símbolos (fé1f0–fé1faff, 2600–27bf, 2b00–2bff, fe0f, etc.):
- Archivos escaneados: **474** (src) — archivos con emoji: **8** — total emojis: **10**
- `src/data/**` (seeds de ejercicios, rutinas, guías, logros): **0 emojis**

| Emoji/símbolo | Dónde | Renderiza | Acción propuesta |
|---|---|---|---|
| `💪` Flexed Biceps | `src/i18n/locales/es/features.ts` L77 — `footer: 'Entrena con GymLab 💪'` | Sí — footer de la app | Sustituir por imagen/marca IA o eliminar (marca limpia) |
| `💪` Flexed Biceps | `src/i18n/locales/en/features.ts` L77 — `footer: 'Train with GymLab 💪'` | Sí — footer (EN) | Ídem |
| `✓` Check mark | `src/components/workout/WorkoutExerciseBlock.tsx` L80 | Sí — marca de serie completada | Sustituir por icono lucide (`Check`) o image asset; **decisión pendiente en brainstorm de implementación** |
| `↔` Left Right Arrow | `src/i18n/locales/es/core.ts` L185, L216; `en/core.ts` L185, L216 | Sí — título del conversor (texto, no icono) | **Mantener** — es símbolo tipográfico de texto (flecha), no emoji; no renderiza como glifo emoji |
| `↔` (comentarios) | `src/domain/calculators/converter.ts` L1, `src/lib/duration.ts` L1, `src/pages/ConversorPage.tsx` L1 | No — comentarios | No tocar |

**Re-verificación 2026-10-08:** los 3 puntos renderizables siguen presentes (líneas actualizadas en la tabla); no se agregaron emojis nuevos en `src/`.

### Contexto de la convención

- `AGENTS.md` ya exige **"Iconos: lucide-react (nunca emoji como icono)"** — esta fase ejecuta esa regla donde aún hay huecos.
- El resto de la UI usa iconos lucide (la norma); no se reemplazan iconos lucide, solo emojis/símbolos residuales.
- **No confundir**: los 431 emojis que aparecen globalmente en el repo viven en `PLAN.md`, docs de auditoría y skills (`.agents/`, `.opencode/`) — **no son UI** y **no** entran en esta fase.

### Tareas

- [ ] **94.1 — Inventario definitivo por componente** (detalle fino)
  - [ ] Verificar con grep/script el estado de los 3 puntos de emoji reales (footer es/en, check set), confirmando que no haya nuevos emojis añadidos desde este inventario.
  - [ ] Decidir caso a caso: (a) sustituir por asset IA, (b) sustituir por icono lucide, (c) mantener (símbolo tipográfico).
  - [ ] Documentar la lista final en esta sección (checkboxes).

- [ ] **94.2 — Generación de assets IA** (fuera de la app, una sola vez)
  - [ ] Definir prompt y estilo: coherente con tema GymLab (`#121214`, acento `#D9B384`/`#FDDDB4`), trazo simple, fondo transparente o SVG, para uso en icono de footer y check.
  - [ ] Generar los assets necesarios (mínimo: marca/footer + check de set), formato WebP/SVG, nombres descriptivos en `public/images/` (p. ej. `public/images/brand/footer-mark.webp`).
  - [ ] Registrar en esta sección qué herramienta/prompt se usó (reproducibilidad) y licencia de uso.

- [ ] **94.3 — Integración en la UI**
  - [ ] Footer: reemplazar `💪` en los strings i18n (`features.ts` es/en) por el componente de imagen/marca (con `alt` accesible o `aria-hidden` según sea decorativo).
  - [ ] Check de set (`WorkoutExerciseBlock.tsx`): sustituir `✓` por icono lucide `Check` (alineado con la norma del repo) o por el asset IA según decisión de 94.1.
  - [ ] i18n: si el emoji vive en strings, mover el asset fuera del texto traducible (la imagen no se traduce).
  - [ ] Accesibilidad: `alt` descriptivo para imágenes informativas; `aria-hidden` + rol decorativo si es puramente decorativo; preservar estados `aria-pressed`/`aria-live` existentes.

- [ ] **94.4 — Verificación y cierre**
  - [ ] `npx tsc --noEmit` → 0 errores.
  - [ ] `npm run build` → exit 0.
  - [ ] Escaneo de regresión: repetir el inventario de emojis y confirmar 0 emojis/símbolos residuales renderizables (salvo los decididos como tipográficos tipo `↔`).
  - [ ] Playwright (Python): smoke visual del footer y de la sesión activa (check de set) según `tests/e2e/` — sin regresiones, 0 errores de consola.
  - [ ] `CHANGELOG.md` bajo `[Unreleased] → Added/Changed`.
  - [ ] Commit sin push (`feat: imágenes IA sustituyen emojis de footer y check (F94)` o similar; separado por tarea según convención).

### Criterio de aceptación

1. **0 emojis renderizables** en la app (escaneo fuente repetible, excluyendo símbolos tipográficos acordados).
2. Accesibilidad preservada o mejorada (alt/aria correctos, touch targets intactos).
3. Peso acotado: assets pequeños (< 50 KB cada uno salvo justificación), sin afectar el bundle crítico (lazy/`preload` según criterio de 91).
4. Offline-first intacto: sin llamadas de red en runtime para imágenes; todo en `public/` bundlado.
5. CHANGELOG al día y build limpio.

### Riesgos / decisiones abiertas

- Decidir si el footer conserva alguna marca visual IA o queda texto limpio (la marca «GymLab 💪» es copy histórica — validar con el usuario si quiere mantener el gesto visual).
- Decidir el reemplazo del `✓`: probablemente lucide `Check` es lo correcto (norma del repo), y el asset IA se reserva para elementos de marca — confirmar en el brainstorm de implementación.
- Los `↔` del conversor son flechas tipográficas en strings (no iconos); mantenerlos salvo que el usuario pida pasarlos a icono lucide `ArrowLeftRight`.
- Herramienta de generación IA: elegir y fijar en 94.2 (reproducibilidad) — fuera de este repo, no requiere backend.

---

## Fase 100 — Con cuentas: telemetría + sync nube (post-cuentas)

*(Origen: 26 notas de prueba ordenadas y agrupadas en 6 clusters. La exploración de cada fase puede reestructurar estos ítems en tareas concretas; cuando una fase se cierra, marcar sus checkboxes y actualizar CHANGELOG.md.)*

**NOTA: hacerlo más adelante.** Depende de crear cuentas/backend (hoy la app es 100% local-first: Dexie/IndexedDB, PWA, Capacitor; AGENTS.md prohíbe backend en MVP — Supabase futuro sería "nueva impl del mismo interface"). Esta fase se retoma cuando exista el modelo de cuentas. **Actualización 2026-10-31:** el modelo de cuentas se diseña en la **Fase 133** (`docs/superpowers/specs/2026-10-31-cuentas-sync-design.md`); 100.2/100.3/100.4/100.6 se implementan ahí; 100.1 y 100.5 siguen después.

Notas origen: **#3, #5**

- [ ] **100.1 — Mapa de calor de uso (#3)**: telemetría de qué usan los usuarios para saber en qué mejorar/enfocarse.
- [ ] **100.2 — Sync local ↔ nube (#5)**: al crear la cuenta real, sincronizar la base local con la nube (Supabase) manualmente o periodizado (tipo WhatsApp). **→ implementado por 133.3.**

### Qué cambia en telemetría y datos cuando exista backend (decidido 2026-10-22)

> Con cuentas, la telemetría deja de ser anónima por definición y aparecen obligaciones nuevas. Nada de esto se hace ahora; queda registrado para que la Fase 124 no se diseñe como si el backend no fuera a existir.

- [ ] **100.3 — Identidad en telemetría**: hoy `distinct_id` es un UUID anónimo en `localStorage`. Con cuentas hay que decidir si se manda el id de usuario (y entonces la política y Data safety pasan a «recogido y **vinculado a la identidad**») o si se mantiene un pseudónimo por dispositivo con `identify` separado. Cambia la redacción legal, no el SDK. **→ decidido en 133.4: `identify` con `user.id` solo con consentimiento; ver C10.**
- [ ] **100.4 — Borrado a pedido**: al eliminar la cuenta hay que borrar también la persona en PostHog y el contexto de usuario en Sentry. Sin eso, la vía de eliminación de Play queda a medias aunque la base propia esté limpia. **→ implementado en 133.2/133.4.**
- [ ] **100.5 — Warehouse de PostHog**: recién con backend tiene sentido conectar Supabase/Postgres como fuente para cruzar producto con datos de cuenta. Hoy no hay nada que conectar: los datos viven en el IndexedDB de cada teléfono.
- [ ] **100.6 — Región del backend**: elegir la región de Supabase a la par de Sentry y PostHog, que ya están en EU (Sentry `ingest.de.sentry.io`). Un backend en US obligaría a declarar transferencia internacional en la política. **→ 133.2: Supabase EU (Frankfurt).**


---

## Fases 114–117 — Deuda declarada del pulido de F66/F67 (sesión 2026-09-26)

> Al cerrar el diseño del pulido (`docs/superpowers/specs/2026-09-26-f66-f67-pulido-design.md`, commit `87a4f9c`) se declararon límites explícitos. Para que no se pierdan ni se cuelen como trabajo suelto, quedan acá como fases propias: cada una necesita su diseño (brainstorming → spec) cuando se tome. Los límites que ya estaban cubiertos quedaron anotados en su fase de origen (F88: i18n del seed; F97: recomendación de pesos).

### Fase 114 — Re-autoría del contenido de las rutinas predefinidas — PENDIENTE

**Objetivo**: rediseñar el **contenido** de las rutinas del seed más allá de mover ítems: alinear día↔nombre cuando el nombre promete algo que el día no cumple (p. ej. r26 «Full Body 3 días» que no es full-body por día), rebalancear los días que el pulido dejó grandes o flacos (r43/r64) y elegir mejores ejercicios por patrón. Incluye decidir qué hacer con la cobertura de la matriz objetivo×nivel×días (hoy 30/75 con días exactos).

**Overlap:** el pulido de F66/F67 solo **mueve** ítems entre días (Anexo A de su spec) y elimina copias exactas: no agrega/quita contenido, no cambia series/reps/descanso ni renombra días. F88 clona predefinidas para editarlas, no las reescribe. Esta fase es curación de contenido, con su propio criterio y review.

- [ ] **114.1 — Criterio de calidad de programa** (bloques coherentes, balance de días, progresión) + medición del estado actual.
- [ ] **114.2 — Re-balanceo de las rutinas tocadas por el pulido** (días de 2 ítems / días de 9-13 ítems) sin perder la identidad de cada rutina.
- [ ] **114.3 — (Decisión) Cobertura de la matriz 30/75**: ¿autoría de rutinas nuevas o se acepta el gap?

### Fase 115 — Equipamiento v2: re-clasificar `otro` y ampliar la taxonomía — PENDIENTE

**Objetivo**: dejar de perder señal de equipamiento. `EQUIPMENT_OPTIONS` tiene 9 valores y ~237 ejercicios (29%, medido el 2026-09-16) están taggeados `otro` (estiramientos, movilidad, máquinas raras); fitball / pelota medicinal / rodillo no existen como valores.

**Overlap:** el pulido de F66/F67 excluyó explícitamente reclasificar `otro` y ampliar el enum (WP0 solo agregó `banco`). Consumidores a tocar: chips de `EquipmentFilter`, `filterExercises` (regla de subconjunto), i18n es/en y seed (reclasificación + `SEED_VERSION`).

- [ ] **115.1 — Medir de nuevo `otro`** y decidir los valores nuevos del enum con criterio de uso real (sin taxonomía infinita).
- [ ] **115.2 — Reclasificar los ejercicios afectados** + consumidores + migración/re-siembra.
- [ ] **115.3 — Test de cobertura** que fije que no quedan ejercicios sin clasificación real donde aplique.

### Fase 116 — Sustitución automática de ejercicios por equipamiento faltante — PENDIENTE

**Objetivo**: cuando el equipamiento declarado no cubre un grupo, hoy el generador **omite y reporta** (`coverage.omittedGroups`). Decidir e implementar si se ofrece una **sustitución** por un ejercicio equivalente disponible (mismo grupo muscular/subzona, categoría strength, equipamiento ⊆ disponible) en vez de omitir — y con qué UX (automática o sugerida en el plan).

**Overlap:** declarado fuera de alcance desde la spec original de F66/F67 y repetido en la del pulido. Toca `src/domain/routineResolution.ts` (contratos de `RoutinePlan`/cobertura) y las superficies del plan (planificador + resumen del onboarding).

- [ ] **116.1 — Decisión de producto**: automática vs sugerida; qué se reporta al usuario.
- [ ] **116.2 — Contrato de dominio + tests**: sustituto determinista, mismo grupo, sin repetir en el día.
- [ ] **116.3 — UI + e2e.**

### Fase 117 — Rediseño de flujo del planificador y onboarding (más allá de lo visual) — PENDIENTE

**Objetivo**: repensar la **estructura** del wizard del planificador y del resumen del onboarding — menos pasos, todo en una pantalla, otra secuencia de decisión — no solo su piel.

**Overlap:** el pulido de F66/F67 es **solo visual** (dirección A: cards de día, pill de duración, encabezado con músculos) y mantiene el flujo de 3 pasos. Esta fase cambia la estructura y necesita su propio diseño (con mockups en el navegador) y e2e del flujo nuevo.

- [ ] **117.1 — Diseño del flujo** (brainstorming + mockups).
- [ ] **117.2 — Implementación + e2e.**

---

## Subtareas opcionales (P3) en fases cerradas

> Archivadas en `COMPLETED.md` el 2026-10-26: `39.D`, `46.U3`, `123.F` y `123.F-2`.

## Mejoras identificadas (sin fase asignada)

- **RESUELTO (2026-10-30) — e2e de la barra de acciones:** `test_f105.py`, `test_f93_t22_quick.py` y `test_f123_selector_alfa.py` ya contemplan el descanso/idioma y dan **ALL OK**; `test_f47.py` también quedó verde. Evidencia en `odd/tasks/calculos-fase-0.md` L28 y commits `f818e42b`/`8aaaba44`.

- **RESUELTO (2026-10-31) — Nombres de día de rutina sin localizar:** se cableó `localizeRoutineDay`/`localizeRoutine` en home, selectores, plan predefinido (preview + persistencia) y clonado; sin tocar el seed ni migrar datos. Evidencia en `odd/tasks/mejoras-identificadas.md` (T1, commit `a0987779`).
- **RESUELTO (2026-10-31) — Notificaciones, permiso bloqueado sin salida:** Ajustes suma «Abrir ajustes del sistema» con plugin local Android `GymLabSettings`; verificado en emulador Pixel_10 (permiso denegado → `AppNotificationSettingsActivity`). Evidencia en `odd/tasks/mejoras-identificadas.md` (T2).
- **Follow-up iOS — Abrir ajustes del sistema:** el botón se oculta en iOS; falta el plugin Swift y la verificación en Xcode/Mac (no se puede compilar en este equipo).

---

## Referencia del proyecto

## Producto

App web mobile-first de entrenamiento:
- Seguimiento de series/reps/peso
- Catálogo de rutinas + programa activo
- Calendario (días hechos vs programados)
- Anillo de progreso (sesión + programa)
- Dummy muscular con fatiga
- Papers científicos + **Guías** (nutrición/entrenamiento)
- Perfil, calculadoras, biblioteca de ejercicios con media
- Offline PWA → Capacitor Android
- **Cimiento** de red social (schema/repos; UI feed futura)

Datos: **local-first (Dexie)**. Repositorios desacoplados → Supabase entra en la **Fase 133** (cuentas + sync); la fase social lo reutiliza.

---

## Arquitectura de carpetas

```
ProyectoGymLab/
├── content/training-library/   # fuente offline seeds/guías
└── gymlab-app/
    ├── PLAN.md, AGENTS.md, CHANGELOG.md
    ├── public/exercises/     # media free-exercise-db + SVG
    └── src/
        ├── domain/           # puro: dates, streak, calendar, fatigue, progress, social types
        ├── data/seed + repositories/
        ├── store/            # sesión activa
        ├── pages/ components/
        └── ...
```

### Capas

| Capa | Regla |
|------|-------|
| `domain/` | Sin React/Dexie |
| `data/repositories/` | Interfaces; hoy Dexie, mañana API |
| `pages/` + `components/` | Cero queries Dexie directas preferible (hooks OK) |
| `store/` | Solo sesión efímera |

---

## Site map

```
/
├── Entrenar (/)                         # stats, anillo programa, mini-calendario bajo racha, CTA
│   ├── Sesión (/entrenamiento/active)   # anillo % sesión, finalizar ejercicio
│   └── Calendario (/calendario)         # vista mes completa (comparte MonthCalendar)
├── Rutinas (/rutinas)                   # Mis rutinas (custom) + Predefinidas
│   ├── Nueva (/rutinas/nueva)           # builder rutina custom
│   ├── Editar (/rutinas/:slug/editar)   # solo custom
│   └── Detalle (/rutinas/:slug)         # play, ETA, seguir programa
├── Papers (/papers)
├── Más (/mas)
│   ├── Ajustes (/ajustes)               # toggle modo noche/día
│   ├── Perfil (/perfil)
│   ├── Guías (/guias, /guias/:slug)
│   ├── Cuerpo (/cuerpo)                 # dummy + fatiga
│   ├── Calculadoras (/calculadoras/*)
│   ├── Ejercicios (/ejercicios/*)
│   └── [futuro] Comunidad
```

Tab bar: `Entrenar · Rutinas · Papers · Más`

---

## Design system

Tema **dual** (modo noche/día), acento dorado en ambos:

| Token | Noche | Día |
|-------|-------|-----|
| `--bg` | `#121214` | `#FFFFFF` |
| `--bg-elevated` | `#242422` | `#F5F3EE` |
| `--fg` | `#F8FAFC` | `#17171A` |
| `--accent` / `--cta` | `#D9B384` | `#B07F2E` (dorado oscuro p/ contraste) |
| `--accent-soft` | `#FDDDB4` | `#8A6620` |
| `--success` | `#22C55E` | `#15803D` |
| `--danger` | `#EF4444` | `#B91C1C` |
| `--border` | `#3A352B` | `#E3DACB` |

- Se aplica vía `data-theme="night|day"` en `<html>`; gold-gradient/text se mantienen dorados.
- Persistencia: `localStorage` (primer paint sin flash) + `meta.theme` (Dexie).

Oswald + Barlow · Lucide · motion 150–300ms · `prefers-reduced-motion`

---

## Modelo Dexie (v2+)

```
meta, exercises, routines, routineDays, routineItems,
workouts, workoutSets, papers, guides, profile, activeProgram, prs,
exerciseAlias, socialProfiles, posts, postMedia,        # social stub (sin uso)
bodyWeight, bodyMeasurements, skinfolds, exerciseNotes,
dailySteps, sessionJournals, benchmarkResults,
foods, mealEntries, supplements,
progressPhotos, workoutTemplates, periodizationPlans
```

- **29 tablas**. El sync de la Fase 133 cubre las tablas de usuario + `meta`; no viajan catálogo, `prs`, `exerciseAlias`, social ni `progressPhotos`.

- Fechas de negocio en **local** `YYYY-MM-DD`.
- Seed versionado (`meta.seedVersion`).
- IDs seed < 10000; user/custom ≥ 10000 o UUID en social.

### Media ejercicios

- Fuente primaria: **free-exercise-db** (Unlicense).
- Campos: `imageUrls[]`, `externalId`, fallback SVG por grupo.
- Componente `ExerciseMedia` (2 frames inicio/fin).

---

## Verificación

| Check | Método |
|-------|--------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Types | `npx tsc --noEmit` |
| Streak/calendario | fechas locales correctas |
| Media | offline en public/exercises |
| Mobile | 375×812 |

---

## Skills

`.opencode/skills/`: frontend-design, ui-ux-pro-max, site-architecture, software-architecture, accessibility, seo, webapp-testing.

Skills remota (*installed on demand*): **`mobile-app-ui-design`** (https://github.com/ceorkm/mobile-app-ui-design) — metodología de UI/UX móvil (paleta 60/30/10, grid 8-pt, sombras tintadas, Peak-End, Trojano Horse/Vanity Mirror/Comfort Trap). Referenciada desde la Fase 31.


