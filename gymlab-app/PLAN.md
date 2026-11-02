# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/`.

> **Fases totalmente cerradas → `COMPLETED.md`** (no requieren revisión).
> **Este archivo contiene SOLO lo pendiente o por revisar.**

---

## Pendientes de release (validación física + firma)

> El snapshot «Estado verificado — 2026-10-04» se archivó en `COMPLETED.md` (2026-10-11): sus pendientes quedaron resueltos o con hogar propio; los únicos abiertos de su tabla final (F94 y F118) viven en sus secciones de este plan. Acá quedan los parkings de release:

### Solo validación física (no verificable en este entorno)
F73 · F84c (frescura real de Health Connect) · F84d (widgets en teléfono real) · F93 #15 (foto en móvil real) · F101 (teclado IME).

### Anotado para fase futura (pedido del usuario, 2026-10-09)

- [ ] **Firma release propia + APK compartible con actualización limpia** — decisión tomada: clave release **propia** (no la debug). Ejecutar cuando el usuario quiera: (1) crear keystore `android/gymlab-release.jks` (NUNCA commitear; `*.jks` ya está ignorado) + credenciales en `android/keystore.properties` (agregar al `android/.gitignore`; guardar COPIA DE SEGURIDAD del keystore — sin él no hay actualizaciones futuras); (2) cablear `signingConfigs.release` en `android/app/build.gradle` leyendo `keystore.properties` con fallback a debug si no existe (los builds de desarrollo siguen igual); (3) `assembleRelease` → APK firmado para compartir (reemplaza al `GymLab-F84d-debug.apk` del Escritorio); (4) **migración única** (~2 min, datos se conservan): en cada teléfono que tenga la versión actual (debug de esta máquina) → Ajustes → exportar backup (JSON, 28 tablas) → desinstalar → instalar la release → importar backup. De ahí en más: toda versión nueva se instala ENCIMA sin borrar nada (tu teléfono y los que compartas) y la firma queda apta para Play Store. Nota: la build release no es inspeccionable por CDP — el emulador sigue siendo el banco de pruebas con builds debug.
  - [x] Keystore + signingConfig + AAB/APK release firmados y verificados (2026-10-30).
  - [ ] Migración debug → release en los teléfonos.

> **Estado 2026-10-30**: keystore + signingConfig + AAB firmado + **APK release firmado** listos. AAB `jar verified`; APK verificado con `apksigner` (v2, certificado `CN=GymLab`) y copiado a `Escritorio\GymLab-1.0.0-release.apk`. Falta la migración debug → release en los teléfonos.

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

### Fase 124 — Telemetría móvil activa: Sentry + PostHog — EN CURSO (falta verificación de red del build release)

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
- [ ] Verificar el build release (AAB firmado) con `chrome://inspect` → Network: hits a ambos hosts; toggle OFF en Ajustes → sin requests nuevos y `sentry.close()`.
- [x] CHANGELOG bajo `[Unreleased] → Changed`.

**Trampa de verificación (2026-10-22)**: `posthog-js` descarta eventos si el user-agent parece un bot, y `HeadlessChrome` está en esa lista. Con Chrome headless se ve `config.js` y `surveys.js` pero **cero POST**, aunque todo funcione. Hay que falsear el UA (`Network.setUserAgentOverride`) antes de concluir que la telemetría está rota.

**Criterio de aceptación**: con el toggle ON hay eventos visibles en ambos paneles; con OFF no sale ningún request nuevo. Sin claves, los builds de desarrollo siguen sin descargar ningún SDK (comportamiento actual, que no debe cambiar).

### Fase 126 — Legal y Play alineados con el código — EN CURSO (política lista; faltan declaraciones Play e iOS)

**Objetivo**: que política, términos y declaraciones digan lo que el código hace, y nada más.

- [x] `/privacidad` + `/terminos` (ES/EN, repo `WebGymLab`): “datos pseudónimos” y telemetría OFF por defecto desplegados y verificados en producción; Sentry/PostHog declarados.
- [x] **Región y retención**: Sentry/PostHog como encargados en la UE (`ingest.de.sentry.io`, `eu.i.posthog.com`); Sentry errores hasta 30 días y PostHog eventos hasta 1 año; sin publicidad ni venta.
- [x] **Backup del sistema**: Fase 125 lo dejó en `false` (`allowBackup="false"` + `dataExtractionRules`); no hay backup que declarar en la política.
- [ ] **Data safety**: respuestas en `docs/PLAY-STORE-DATA-SAFETY.md` (App interactions, Crash logs, Device IDs; **sin Diagnostics**; telemetría **OFF por defecto**; Ads/IAP: no; eliminación: reset/desinstalar/email). Falta cargar en Play Console.
- [ ] **Health apps declaration**: sin cambios por estas fases (pasos + Health Connect); la declaración está en `docs/PLAY-STORE-DATA-SAFETY.md`; falta cargarla en Play Console.
- [ ] **iOS**: corregir la mención de HealthKit en la política (el build iOS no lo implementa) o implementarlo antes de etiquetar en App Store.
- [ ] **Cuentas (Fase 133)**: política + Data safety + App Privacy con datos de cuenta vinculados a la identidad y borrado in-app + URL web.

**Criterio de aceptación**: una fila de Data safety por cada dato que sale del dispositivo y ninguna que declare algo que el código no hace; la política nombra los hosts externos reales (`eu.i.posthog.com`, `ingest.de.sentry.io`) y el backup del sistema está desactivado.

## Fase 128 — Crashes nativos con `@sentry/capacitor` — FUTURO (decidido 2026-10-22)

> La numeración salta 127 a propósito: esa fase pertenece a la sesión de onboarding/perfil (`test_f127_tour_logros.py`).

**Objetivo**: que Sentry vea también los crashes del **contenedor nativo**, no solo los errores de JS del WebView.

**Contexto y por qué queda para después**

- Hoy la integración es `@sentry/react` dentro del WebView (Fase 124): ve excepciones de JS, nada más.
- Quedan invisibles: crashes de Kotlin/Java (el `WidgetSyncWorker`, `HealthStepsReader`, el plugin de Health Connect), ANR, y la muerte del WebView por memoria. En una app que se distribuye como APK eso es justamente lo que más duele, porque el error de JS suele ser reproducible en escritorio.
- `@sentry/capacitor` envuelve `@sentry/react` y suma el SDK nativo (Android `io.sentry:sentry-android`, iOS vía SPM/CocoaPods). Usa el **mismo DSN y el mismo proyecto**: no hace falta crear otro.
- El problema real no es instalar el paquete, es el **consentimiento**: el SDK nativo arranca con la app, antes de que el JS lea el toggle. Sin resolverlo, un usuario con telemetría apagada igual enviaría crashes nativos.

**Tareas**

- [ ] Decidir la estrategia de consentimiento: `Sentry.init` nativo diferido hasta que el JS confirme, o arrancar con `setEnabled(false)` y habilitar al leer el toggle.
- [ ] Instalar `@sentry/capacitor` + `@sentry/react`; `Sentry.init(opts, sentryCapacitorInit)`; `npx cap sync` (dependencia nativa en Gradle y en el proyecto iOS).
- [ ] Verificar con un crash nativo provocado en device: aparece en Sentry con stack legible, y con el toggle OFF no se envía.
- [ ] Actualizar política (el contenedor nativo ahora reporta) y revisar que Data safety siga en `Crash logs`, sin filas nuevas.

**Criterio de aceptación**: un crash nativo provocado en el dispositivo llega al mismo proyecto; con telemetría apagada no sale ningún evento nativo.

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

## Fase 134 — Estado persistente entre pantallas (memoria de navegación) — PLANIFICADA (2026-11-01)

**Objetivo**: que la app deje de «olvidar dónde estabas». Salir de una pantalla y volver no debe borrar la búsqueda, los filtros, el día elegido, el scroll ni un borrador a medio armar.

**Origen (verbatim)**: «quiero que verifiques por que pasa que cuando estoy en la app por ejemplo buscando un rutina entro y salgo , no se mantiene el estado, por ejemplo no vuelve a donde estaba, sino que se resetea y empiezo desde el comienzo, otro caso es cuando estoy creando una rutina y si le doy a otro apartado se borra todo lo que llevaba construyendo, otro caso seria tambien cuando busco un ejercicio y entro para ver, cuando salgo estoy al inicio de la pagina de busqueda, se resume que no guarda el estado donde estaba, dame opciones de como se podria solucionar sin que la optimizacion peligre».

**Orden de ejecución aprobado (2026-11-01)**: back de Android (134.1) → borradores (134.2) → URL como fuente de verdad (134.3) → scroll (134.4).

**Doc de feature / specs**: `odd/tasks/134-estado-persistente.md` (fuente de verdad para las tareas; este bloque del PLAN es el resumen). Runner: `vitest` (`npm test`), `npm run build` (typecheck real), e2e Playwright Python, emulador para lo nativo.

### Diagnóstico verificado en código (2026-11-01)

No es un bug: son **cinco causas** con el mismo síntoma.

| # | Causa raíz | Evidencia |
|---|---|---|
| 1 | Estado de lista/pestaña en `useState` de la página; `<Routes>` desmonta al navegar (`src/app/router.tsx:63-118`) | `EjerciciosPage.tsx:106-107`, `RutinasPage.tsx:41-47`, `RutinaDetailPage.tsx:36`, `EstadisticasPage.tsx:61-62`, `GuiasPage.tsx:22`, `PapersPage.tsx:21`, `CuerpoPage.tsx:21-22`, `StepsPage.tsx:49-50`, `AchievementsPage.tsx:38`, `SupplementsPage.tsx:40`, `CalculadorasPage.tsx:17` |
| 2 | Borradores solo en memoria | `useRoutineDraft.ts:1,16-24`, `PlanificadorPage.tsx:99-106`, `ObjetivosPage.tsx:43-44`, `FoodAdder.tsx:31-35`, `OnboardingWizard.tsx:82,175`, `ProfileUserCard.tsx:27` |
| 3 | Nadie guarda la posición de scroll; `BackLink` hace `push` nuevo en vez de volver | `BackLink.tsx:21-25` (+ usos en `EjercicioDetailPage.tsx:108,129`, `GuiaDetailPage.tsx:31,49`), `RoutineDayPanel.tsx:24-31`, `ExercisePicker.tsx:180` |
| 4 | El back físico de Android no cierra overlays: el listener `backButton` solo existe en `/entrenamiento/active` | `useActiveSession.ts:114-136`, `EntrenamientoPage.tsx:94`. En el resto Capacitor aplica su default (`history.back()`) → te saca de la pantalla con el sheet abierto |
| 5 | Sin restauración de ruta al arrancar en frío (Android puede matar el WebView) | `main.tsx:38-44`; no hay ruta persistida. Precedente del mismo problema ya resuelto: `usePhotoRestore.ts:17-42` |

**Contraste**: la sesión activa, los objetivos y el equipamiento **sí** sobreviven porque son stores Zustand con `persist` (`activeWorkoutStore.ts:219-220,556,593`; `goalStore.ts:13`; `equipmentStore.ts:18`). El patrón correcto ya existe en el repo.

### Cobertura por tarea

| Caso encontrado | Sev | Lo arregla |
|---|---|---|
| Back de Android te saca de la pantalla con un sheet/picker abierto | Alta (Android) | 134.1 |
| Borrador de rutina (nueva/editar) se pierde al cambiar de tab, al inspeccionar un ejercicio o con el back | Alta | 134.1 (back) + 134.2 |
| Wizard del planificador (paso, nivel, objetivo, días, duración, plan generado) se reinicia | Alta | 134.2 |
| Día seleccionado de una rutina vuelve a 0 | Alta | 134.3 |
| Búsqueda/filtros de `/ejercicios` y `/rutinas` se pierden al entrar y salir | Alta | 134.3 |
| Scroll de cualquier lista se pierde | Media | 134.4 |
| Tab/rango de `/estadisticas`, mes de `/pasos`, vista de `/cuerpo`, categoría de `/guias` y `/papers`, filtros de `/logros` y `/suplementos` | Media | 134.3 |
| Sheet de objetivo, alimento propio y nombre de perfil a medio llenar | Media | 134.2 (solo builder/planner) · resto follow-up |
| Onboarding se reinicia si la app muere a mitad | Media | Follow-up (ver «Fuera de alcance») |
| Carrusel de sesión vuelve al primer grupo incompleto | Media | Decisión de producto, no se toca acá |
| Arranque en frío vuelve a `/` | Media | Follow-up (ver «Fuera de alcance») |

### Decisiones de arquitectura

1. **No se mantienen páginas montadas.** Nada de `KeepAlive`/`display:none`: dejaría vivas todas las `useLiveQuery` de Dexie de cada página visitada y contradice el audit de performance (68 `.routine-card` con blend/blur re-compuestas). El estado se persiste o se pone en la URL, no se conserva el árbol.
2. **La URL es la fuente de verdad de la navegación de listas.** Sobrevive a deep links, al back del SO, a muerte de proceso y a recarga — sin código de persistencia propio.
3. **Los borradores van a Zustand + `persist`**, reusando el storage debounced que ya usa el entreno activo: una sola política de pérdida de datos en toda la app.
4. **Un único listener de `backButton`**, montado en el shell. Prioridad LIFO entre handlers, con la sesión activa como el handler de menor prioridad.

### Guardrails de performance (no negociables)

- Prohibido un listener de `scroll` que dispare estado de React: es el antipatrón T1 ya documentado en `docs/performance-audit-2026-10-05-features-nuevas.md:129-133`.
- Escrituras de borrador diferidas 400 ms (`PERSIST_DEBOUNCE_MS`) con flush en `pagehide`/`visibilitychange`; nunca en cada tecla.
- `useSearchParams` escribe con `replace: true` y debounce: no genera una entrada de historial por carácter.
- El scroll se guarda por navegación (click capture + `pagehide`), no por frame.
- Cero renders extra en listas: el estado migrado mantiene la misma cantidad de renders que hoy.

### Subtareas

- [x] **134.1 — Back de Android cierra el overlay, no abandona la pantalla**
  - [x] `src/lib/backHandlers.ts`: pila LIFO de handlers `() => boolean` (`true` = consumido). API `registerBackHandler(handler): unlisten`, `runBackHandlers(): boolean`.
  - [x] `src/hooks/useHardwareBack.ts`: **un solo** `App.addListener('backButton')`, montado en `AppShell` y solo en `isNativePlatform()`. Orden: handlers (último registrado primero) → si nadie consume y `canGoBack` → `history.back()` → si no → `App.exitApp()`.
  - [x] `src/hooks/useOverlayBack.ts`: `useOverlayBack(isOpen, onClose)` registra mientras está abierto. `useOverlayDismiss` lo combina con Escape.
  - [x] Migrar `useActiveSession.ts:114-136` a `registerBackHandler` (prioridad baja, sin cambiar la confirmación de salida).
  - [x] Aplicar a: `BottomSheet` (cubre 11 sheets), `ConfirmSheet`, `DaySelectorSheet`, `PhotoSourceSheet`, `AvatarPicker`, `ResetInfoSheet`, `ResetConfirmSheet`, `StepSheet`, `SessionJournalSheet`, `AchievementModal`, `ExercisePicker`, `PlateCalculatorModal`, `RoutineDestinationSheet`. **No** a `InfoTip` (popover inline) ni a `TourOverlay`.
  - [x] Test unit de la pila (`backHandlers.test.ts`, 5) y de la pila con componentes montados (`overlayBack.test.tsx`, 5, jsdom).
  - [x] Emulador Pixel_10 (`verify_back_overlay.py`): filtros de `/rutinas` y alta desde `/ejercicios` se cierran con back sin cambiar de ruta; sin overlay el back navega; 0 `pageerror`.
  - [x] Commit work-unit.

- [ ] **134.2 — Borradores persistidos (builder + planificador)**
  - [ ] Extraer el storage debounced de `activeWorkoutStore.ts:18-88` a `src/lib/debouncedPersistStorage.ts` (mismo formato `{state, version}`, mismos eventos de flush). `activeWorkoutStore` pasa a consumirlo sin cambio de comportamiento.
  - [ ] `src/store/routineDraftStore.ts`: Zustand + `persist` (`name: 'gymLab-routineDraft'`, `version: 1`) con `{ scope: 'new' | 'edit', slug?, title, objective, level, description, days, updatedAt }`.
  - [ ] `useRoutineDraft`: leer/escribir el store; restaurar al montar; `clearDraft()` al guardar y al descartar.
  - [ ] Edición (`/rutinas/:slug/editar`): cargar de Dexie **solo** si no hay borrador pendiente de ese slug; un borrador de otra rutina no se aplica nunca.
  - [ ] Aviso de restauración: «Retomamos tu borrador» + acción «Descartar» (i18n es/en con claves tipadas).
  - [ ] `src/store/plannerStore.ts`: persistir `level`, `objective`, `daysPerWeek`, `sessionDurationMin`. `step` arranca en 0 y `generated` no se persiste (el plan se regenera).
  - [ ] Añadir las claves nuevas a `RESET_LOCAL_STORAGE_KEYS` de `factoryReset.ts:19-27` (y reset de los stores en el paso de memoria de `performFactoryReset`).
  - [ ] Tests: unit del store (restaurar, descartar, no mezclar scopes), unit del storage debounced (flush en `pagehide`), e2e builder (armar → otra tab → volver → sigue).
  - [ ] Commit work-unit.

- [ ] **134.3 — URL como fuente de verdad (listas y selección)**
  - [ ] `src/hooks/useUrlState.ts`: helper tipado sobre `useSearchParams` con schema (claves, defaults, coerción, validación). Valores inválidos caen al default sin romper. Escritura con `replace: true`.
  - [ ] `BackLink`: volver con `navigate(-1)` cuando hay historial interno (`location.key !== 'default'`), con `to` como fallback para deep link.
  - [ ] Migrar: `EjerciciosPage` (q + filtros), `RutinasPage` (q + objetivo + tipo + nivel + grupo abierto + sheet), `RutinaDetailPage` (`?dia=`), `EstadisticasPage` (`?tab=` + `?rango=`), `GuiasPage` (`?cat=`), `PapersPage` (`?tema=`), `CuerpoPage` (`?vista=`), `StepsPage` (`?mes=`), `AchievementsPage` (`?filtro=`), `SupplementsPage` (`?filtro=`), `CalculadorasPage` (`?q=`).
  - [ ] Tests unit del schema (defaults, valores inválidos, serialización) y e2e: filtrar → entrar al detalle → volver → filtro y resultados intactos.
  - [ ] Commit work-unit.

- [ ] **134.4 — Restauración de scroll**
  - [ ] `src/lib/scrollMemory.ts`: `Map<string, number>` de módulo, clave `pathname + search`; `saveScroll(pathKey, y)` / `readScroll(pathKey)`.
  - [ ] `src/hooks/useScrollRestoration.ts({ ready })`: guarda en click capture sobre links internos + `pagehide` + `visibilitychange`; restaura en `useLayoutEffect` cuando `ready`, clampeado al alto real y con `behavior: 'auto'`.
  - [ ] Aplicar a `EjerciciosPage` (`ready = scrollMargin > 0`), `RutinasPage`, `RutinaDetailPage`, `GuiaDetailPage`/`GuiasPage`, `PapersPage`, `EstadisticasPage`, `StepsPage`, `CuerpoPage`, `AchievementsPage`, `CalculadorasPage`.
  - [ ] Scroll interno de `RoutineDayPanel.tsx:24-31` (clave por `routineId:dayIndex`).
  - [ ] Test e2e: scrollear el catálogo, entrar a una ficha, volver → cae en la misma fila.
  - [ ] Commit work-unit.

- [ ] **134.5 — Cierre**
  - [ ] `npm run build` limpio y `npm test` verde (números exactos en el doc de feature).
  - [ ] e2e 375 y 768; emulador para el back de Android y al menos una ruta multi-segmento (`/rutinas/nueva`, `/ejercicios/:slug`).
  - [ ] `CHANGELOG.md` bajo `[Unreleased]`, PLAN marcado, doc ODD y espejo Engram.
  - [ ] Commits work-unit por tarea, sin push (convención del repo).

### Pronóstico de entrega

~800–1000 líneas authored en 4 work units. Supera la heurística de ~400: **estrategia `ask-on-risk`** — al cerrar 134.2 se avisa el conteo real y se pide decisión sobre partirlo en slices. La entrega sigue la convención del repo: commits en la rama actual, sin push; el usuario mergea.

### Criterio de aceptación

1. Con un sheet, picker o modal abierto, el back de Android lo cierra y **no** abandona la pantalla.
2. Un borrador de rutina sobrevive a: cambiar de tab, inspeccionar un ejercicio y el back físico.
3. Búsqueda, filtros, pestaña y día seleccionado sobreviven a entrar a un detalle y volver, **y** sobreviven a recargar la app (están en la URL).
4. Volver de un detalle restaura la posición de scroll de la lista.
5. `npm run build` limpio, `npm test` verde, 0 `pageerror` en e2e y emulador.
6. Ningún cambio introduce listeners de `scroll` que re-rendericen ni páginas ocultas montadas.

### Riesgos

| Riesgo | Mitigación |
|---|---|
| Doble listener de `backButton` (sesión + shell) → el back cierra dos cosas o nada | Un único listener; la sesión se migra a `registerBackHandler`. Test unit de la pila |
| Restaurar un borrador viejo pisa datos recién cargados de Dexie | Borrador con `updatedAt`; en edición se ignora si es de otro slug o ya se guardó |
| URL compartida con filtros inválidos rompe la pantalla | Schema con defaults y coerción; test de valores basura |
| Restaurar scroll antes de que la lista tenga altura → salto a 0 | `ready` explícito + clamp al alto real; alturas fijas del virtualizador permiten restaurar antes del paint |
| El storage debounced extraído cambia el formato del entreno activo | Mismo formato `{state, version}`; tests existentes del entreno activo deben seguir verdes |

### Fuera de alcance (follow-ups con razón)

- **Onboarding parcial** (`OnboardingWizard.tsx:82`): una vez por instalación y requiere tocar el flujo de guardado por paso. Fase propia.
- **Arranque en frío / restauración de ruta** (`main.tsx`): requiere decidir si abrir en la última ruta es deseable (un deep link de widget compite con ella). Fase propia.
- **Carrusel de sesión** (`SessionCarousel.tsx:99,120-126`): puede ser intencional arrancar en el primer grupo incompleto. Es decisión de producto, no un fix.
- **Formularios sueltos** (`ObjetivosPage`, `FoodAdder`, `ProfileUserCard`): sheets de un solo uso; el costo/beneficio no justifica persistirlos todavía.
- **Picker del builder reabierto en el mismo punto** tras inspeccionar: requiere persistir `pickingDay` y su scroll interno.

---

## Tareas de Fase 93 pendientes

#### [x] #30 — Crear correo de la app
- [x] **Correo operativo**: `gymlab@gymlab.dev` recibe correo vía **Cloudflare Email Routing** (gratis, 2026-10-21) → destino personal verificado. Es un alias de reenvío, no un buzón con envío propio; las respuestas salen desde el Gmail personal.
- [x] Añadir el correo como contacto en Ajustes / T&C (`/terminos`) / reporte de errores (#29) — `src/config/contact.ts` unificado a `gymlab@gymlab.dev` (usado en Términos, Privacidad y ReportBug).
- [x] Verificación + CHANGELOG + commit (`7c1f858b`, `b370f98e`).

#### [ ] #22 — Revisión futura: sesión rápida
- [ ] Validar con el usuario que la sesión rápida mantiene el valor/contexto esperado tras su uso real.

#### [ ] #8 — Guías: imágenes
- [ ] Ranura hero en `GuiaDetailPage`; requiere `imageUrl` opcional en `Guide` + assets.

---

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


