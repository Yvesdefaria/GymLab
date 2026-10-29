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

> **Estado 2026-10-29**: keystore + signingConfig + AAB firmado listos (`jarsigner` OK). Falta el APK compartible + la migración en los teléfonos.

---

## Play Store — revisión de políticas (2026-10-19 · código cerrado 2026-10-21)

Contexto: la web ya publica la política de privacidad y los términos en `https://gymlab.dev/privacidad` y `/terminos` (repo `WebGymLab`, T9/T10). Estado de cada punto para la revisión de Play Console:

> Detalle completo, specs y evidencia por tarea: `odd/tasks/play-store-revision.md`.

- [x] **Health Connect — link de privacidad roto** — `strings.xml` → `https://gymlab.dev/privacidad`. Verificado en emulador-5554: `PermissionsRationaleActivity` carga `https://gymlab.dev/privacidad/` (title «Política de Privacidad — GymLab», body 5.244 chars); el dominio viejo `gymlab.app/privacidad` responde **404** (comprobado con fetch).
- [x] **Divulgación de Health Connect en la política web** — sección 6 «Salud y actividad física» en `WebGymLab/src/pages/privacidad.astro` (12 secciones) y en la política in-app (`privacidad.secciones.salud` + `permisos`, es/en). Deployado (`329ecb3`): la página live ya muestra «Health Connect» y fecha 21-oct, y la rationale del emulador carga esa misma versión (verificado por CDP).
- [ ] **Health apps declaration** en Play Console (App content → Health apps) — **acción del usuario**. Declarar: acceso a Health Connect, tipo «Activity / steps», lectura diaria de pasos + lectura en segundo plano para el widget; uso solo en el dispositivo, sin publicidad, sin venta; permiso revocable por el usuario.
- [ ] **Data safety** — **acción del usuario**. Respuestas listas en `docs/PLAY-STORE-DATA-SAFETY.md`:
  - `App activity → App interactions` — recogido · **opcional** (toggle `telemetry`, **OFF por defecto**) · no compartido · cifrado.
  - `App info and performance → Crash logs` (Sentry) — recogido · opcional · no compartido · cifrado.
  - `Device or other IDs` (distinct_id pseudónimo de PostHog) — recogido · opcional · no compartido · cifrado.
  - **No** se declara `Diagnostics`: PostHog tiene `capture_performance` y `capture_performance_opt_in` en `false`.
  - `Health and fitness`, `Location`, `Personal info`, `Financial info`, `Photos` — **no recogidos** (todo queda en IndexedDB; PostHog no usa autocapture y el `before_send` borra texto, valores, hrefs y atributos).
  - Ads: **No** (AdMob no instalado). IAP: **No**.
  - Sentry y PostHog son encargados del tratamiento bajo DPA; ambos tienen IP descartada. Sin `Approximate location`.
- [ ] **Política live 29/10** — desplegar en WebGymLab “datos pseudónimos” + telemetría OFF por defecto; la copia in-app/estática ya está actualizada.
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

### Fase 126 — Legal y Play alineados con el código — PENDIENTE

**Objetivo**: que política, términos y declaraciones digan lo que el código hace, y nada más.

- [ ] `/privacidad` + `/terminos` (ES/EN, repo `WebGymLab`): la copia in-app/estática ya dice “datos pseudónimos” y telemetría OFF por defecto; Sentry/PostHog ya están declarados. Falta desplegar el mismo texto en WebGymLab.
- [x] **Backup del sistema**: Fase 125 lo dejó en `false` (`allowBackup="false"` + `dataExtractionRules`); no hay backup que declarar en la política.
- [ ] **Data safety**: respuestas en `docs/PLAY-STORE-DATA-SAFETY.md` (App interactions, Crash logs, Device IDs; **sin Diagnostics**; telemetría **OFF por defecto**; Ads/IAP: no; eliminación: reset/desinstalar/email). Falta cargar en Play Console.
- [ ] **Health apps declaration**: sin cambios por estas fases (pasos + Health Connect); la declaración está en `docs/PLAY-STORE-DATA-SAFETY.md`; falta cargarla en Play Console.
- [ ] **iOS**: corregir la mención de HealthKit en la política (el build iOS no lo implementa) o implementarlo antes de etiquetar en App Store.

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
- [ ] **M4 — Suscripción**: bloqueada por la Fase 100 (cuentas + sync). El único argumento honesto es backup/sync en la nube.
- [ ] **M5 — Anuncios AdMob**: condicional, solo si M3 falla y con revisión explícita del costo de marca (contradice la banda de privacidad).
- [ ] **Fase 126 absorbe el legal** de la opción elegida: términos de venta, reembolsos, renuncia al desistimiento, ID de publicidad si aplica.

## Fase 130 — Publicación en Play Store — PRIORIDAD ACTUAL (2026-10-22)

**Objetivo**: publicar en el track de producción desde una cuenta **de organización**.

**Detalle completo y check-list de salida**: `odd/tasks/play-publicacion.md`.

**Prioridad declarada por el owner**: esta fase pasa delante de la 125 y la 129, que quedan documentadas pero no urgentes.

**Estado (2026-10-29)**: keystore + properties + signingConfig + AAB firmado listos (`jarsigner` OK). La publicación sigue bloqueada por la cuenta de organización/D-U-N-S, la ficha (feature graphic/screenshots/textos) y las declaraciones; la subida a testing interno queda para cuando la cuenta esté disponible.

**Bloqueadores actuales**: (1) cuenta de organización/D-U-N-S; (2) ficha de Play incompleta (feature graphic 1024×500 y screenshots PNG/JPEG ≤2:1; las WebP 375×812 no sirven); (3) declaraciones (Health apps/Data safety/content rating/público); (4) política live 29/10 pendiente de deploy.

- [x] **Keystore + signingConfig**: `android/gymlab-release.jks` + `android/keystore.properties` (gitignoreados) + `signingConfigs.release`; `bundleRelease` firmado y `jarsigner` verificado.
- [ ] **Backup del keystore + Play App Signing**: guardar copia en dos lugares y activar/decidir Play App Signing al subir.
- [x] **AAB firmado**: `app-release.aab` (111,7 MB) con `jar verified`.
- [ ] **AAB probado desde testing interno**: instalación desde Play y verificación en dispositivo real.
- [ ] **Ficha**: feature graphic, screenshots PNG, textos ES/EN (la app ya arranca en inglés; la ficha no puede quedar solo en español).
- [ ] **Declaraciones**: Health apps, Data safety con la telemetría activa, content rating, público objetivo.
- [ ] **Cuenta de organización** verificada (D-U-N-S si aplica): exime del closed testing con 12 testers que se exige a las cuentas personales nuevas.
- [ ] **Fase 126**: agregar a la política la región de tratamiento (UE) y el plazo de retención.
- [ ] **Verificación final** en dispositivo real desde producción: instalación, onboarding, entreno completo, export de backup.

## Fase 131 — Endurecimiento de Cloudflare — AUDIT HECHO, FIXES PENDIENTES (2026-10-22)

**Objetivo**: cerrar los hallazgos del audit de la zona `gymlab.dev` (incluye `app.gymlab.dev`), la cuenta y la landing.

**Detalle, evidencia y comandos de verificación**: `odd/tasks/cloudflare-endurecimiento.md`.

**Resumen**: 2 Moderate (MFA de la cuenta, Bot Fight Mode apagado), 2 de transporte (HSTS apagado, TLS mínimo 1.0), 3 de DNS/correo (DMARC y CAA ausentes, DNSSEC deshabilitado), 2 de código web (`security.txt` y headers en la landing) y 2 que no aplican o son decisión (Turnstile sin formularios, AI Labyrinth).

- [ ] **MFA** en la cuenta de Cloudflare — detrás de ese login están DNS, Workers, certificados y el dominio.
- [ ] **HSTS** y **Minimum TLS 1.2** en SSL/TLS → Edge Certificates.
- [ ] **DMARC** (`_dmarc` TXT con `p=none` + `rua`) y **CAA** restringiendo las CAs.
- [ ] **DNSSEC**: activar en Cloudflare **y** cargar el DS en DonDominio (sin DS el dominio deja de resolver).
- [ ] **`security.txt`** y **headers de seguridad** en la landing (repo `WebGymLab`).
- [ ] **Decidir** Bot Fight Mode y AI Labyrinth (el primero puede desafiar scrapers y previews).
- [ ] **Verificar** cada fix con los comandos del task doc.

**No verificable desde la API**: 4XX/5XX por código de estado (Zone Analytics sunset, el MCP no expone GraphQL y no hay RUM instalado) y builds fallidos (el endpoint devolvió 0). El token del MCP es de solo lectura: los cambios de zona los aplica el dueño o un token con escritura.

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

**NOTA: hacerlo más adelante.** Depende de crear cuentas/backend (hoy la app es 100% local-first: Dexie/IndexedDB, PWA, Capacitor; AGENTS.md prohíbe backend en MVP — Supabase futuro sería "nueva impl del mismo interface"). Esta fase se retoma cuando exista el modelo de cuentas.

Notas origen: **#3, #5**

- [ ] **100.1 — Mapa de calor de uso (#3)**: telemetría de qué usan los usuarios para saber en qué mejorar/enfocarse.
- [ ] **100.2 — Sync local ↔ nube (#5)**: al crear la cuenta real, sincronizar la base local con la nube (Supabase) manualmente o periodizado (tipo WhatsApp).

### Qué cambia en telemetría y datos cuando exista backend (decidido 2026-10-22)

> Con cuentas, la telemetría deja de ser anónima por definición y aparecen obligaciones nuevas. Nada de esto se hace ahora; queda registrado para que la Fase 124 no se diseñe como si el backend no fuera a existir.

- [ ] **100.3 — Identidad en telemetría**: hoy `distinct_id` es un UUID anónimo en `localStorage`. Con cuentas hay que decidir si se manda el id de usuario (y entonces la política y Data safety pasan a «recogido y **vinculado a la identidad**») o si se mantiene un pseudónimo por dispositivo con `identify` separado. Cambia la redacción legal, no el SDK.
- [ ] **100.4 — Borrado a pedido**: al eliminar la cuenta hay que borrar también la persona en PostHog y el contexto de usuario en Sentry. Sin eso, la vía de eliminación de Play queda a medias aunque la base propia esté limpia.
- [ ] **100.5 — Warehouse de PostHog**: recién con backend tiene sentido conectar Supabase/Postgres como fuente para cruzar producto con datos de cuenta. Hoy no hay nada que conectar: los datos viven en el IndexedDB de cada teléfono.
- [ ] **100.6 — Región del backend**: elegir la región de Supabase a la par de Sentry y PostHog, que ya están en EU (Sentry `ingest.de.sentry.io`). Un backend en US obligaría a declarar transferencia internacional en la política.


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

- **Tres e2e afirman la barra de acciones durante el descanso** (deuda del 2026-10-22): al ocultar la barra mientras corre el timer, quedan en rojo `test_f105.py:133-135` (marca serie y hace click en «Finalizar entreno»), `test_f93_t22_quick.py:152-160` (afirma 1 «Añadir ejercicio» + «Finalizar entreno» visibles) y `test_f123_selector_alfa.py:35` (abre el selector con «Añadir ejercicio»). Con `autoStartRest` activo esas rutas están en descanso. A decidir por test: detener el descanso antes de tocar la barra, o reescribir la aserción para el contrato nuevo.

- **Nombres de día de rutina sin localizar**: `EntrenarPage` renderiza `routineDays[todayIndex].name` directo desde el seed, que está en español (`Pull (Espalda/Bíceps)`). Con la app arrancando en inglés, cualquier usuario ve el nombre del día del entreno en español. Detectado el 2026-10-22 al capturar la demo (hubo que elegir una rutina con días en inglés para que la captura no mezclara idiomas). Requiere decidir si el seed guarda claves i18n o si se traduce en render.

- **Notificaciones — permiso bloqueado sin salida**: en Ajustes, con el permiso denegado («no volver a preguntar») sólo se muestra el aviso; falta un botón «Abrir ajustes del sistema» (requiere un plugin nativo de settings). Identificada en la verificación de F111 (2026-09-27); sin implementar.

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

Datos: **local-first (Dexie)**. Repositorios desacoplados → Supabase en fase social.

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
socialProfiles, posts, postMedia   # social stub
dailySteps, mealEntries, progressPhotos, benchmarkResults   # fases 76/79/82 + F84
```

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


