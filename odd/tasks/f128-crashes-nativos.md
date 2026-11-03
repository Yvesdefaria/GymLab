# Fase 128 — Crashes nativos con el SDK de Sentry

Objetivo: que Sentry capture también los crashes del **contenedor nativo** (Kotlin/Java, ANR, muerte del WebView), no solo las excepciones JS del WebView.
Rama: `main`. Entrega: commits work-unit (el push lo decide el owner). Runner: `assembleRelease` + dispositivo real RMX5085 (Android 16).

## Specs

- **S1 — Camino: SDK nativo directo.** Se descarta `@sentry/capacitor`: su versión 4.5.0 fija `@sentry/react` en **exactamente `10.76.2`** (peer) y el repo corre **`11.6.0`** desde F121.2. No se revierte la migración. Se agrega `io.sentry:sentry-android` al contenedor; las numeraciones son líneas independientes (SDK web 11.x, SDK Android 8.x) y no se acoplan.
- **S2 — Consentimiento: init nativo condicionado.** El contenedor lee un flag persistido (escrito por el JS al arrancar y al cambiar el toggle) y **solo** llama a `SentryAndroid.init` si está ON. Sin consentimiento no hay SDK nativo ni crash handler. La telemetría es opt-in y OFF por defecto.
- **S3 — Mismo destino.** Mismo DSN y proyecto que la web; `tracesSampleRate = 0`, `sendDefaultPii = false`, sin session tracking.
- **S4 — Criterio de aceptación.** Un crash nativo provocado en el dispositivo llega al mismo proyecto con stack legible; con el toggle OFF no se envía nada.
- **S5 — Legal.** La política debe indicar que el contenedor nativo reporta; Data safety sigue en `Crash logs`, sin filas nuevas.

## Lo que se asume perder

- Breadcrumbs y trazas unificadas JS↔nativo: eso solo lo aporta el plugin. No es requisito de la fase.
- Si `@sentry/capacitor` soporta v11 en el futuro, migrar es chico: quitar el init nativo y agregar el plugin.

## Tareas

| ID | Tarea | Specs | Ruta | Estado |
|----|-------|-------|------|--------|
| T1 | DSN en Gradle (`buildConfigField` leyendo `.env`) y verificación en `BuildConfig` | S3 | inline | hecho |
| T2 | `io.sentry:sentry-android` (última 8.x, confirmar en Maven Central) | S1 | inline | hecho (8.62.0) |
| T3 | Init en el contenedor (`Application`) con las opciones de S3 + `auto-init=false` | S3, S4 | inline | hecho |
| T4 | Flag de consentimiento JS→nativo (plugin local `GymLabSettings` → SharedPreferences), leído antes del init | S2 | inline | hecho |
| T5 | Crash nativo provocado en device con toggle ON/OFF | S4 | owner | hecho (RMX5085, 2026-11-03) |
| T6 | Política + Data safety | S5 | inline | hecho |

Ruta `inline` para todo el código: el trabajo es un cambio entendido por archivo, sin unidades paralelas
ni presión de contexto; no dispara ningún trigger de escritor.

## Detalles de implementación (evitan re-explorar)

- `.env` vive en `gymlab-app/.env`; el root de Gradle es `gymlab-app/android` → usar `rootProject.projectDir.parentFile` para encontrarlo.
- **No hardcodear el DSN.** Si `.env` no existe o no tiene la clave, el build debe seguir y el DSN queda vacío ⇒ Sentry no inicializa.
- Verificación de T1: `assembleRelease` y leer `BuildConfig.SENTRY_DSN` (o volcarlo en un log de una sola línea durante la prueba).
- El gate web actual (`src/lib/telemetry.ts`) exige `producción && claves && consentimiento`; el nativo debe replicar la misma semántica, con el flag persistido como fuente de verdad.
- La build release **no** es inspeccionable por CDP: la verificación es por paneles (Sentry) y por comportamiento en el dispositivo.

## Log

L1 — Pedido del usuario (2026-11-03), verbatim: «ahora vamos con Fase 128 — Crashes nativos con @sentry/capacitor — FUTURO (decidido 2026-10-22)».

L2 — Verificación de viabilidad (2026-11-03): `npm view @sentry/capacitor` → `version 4.5.0`, `peerDependencies["@sentry/react"] = "10.76.2"` (exacta). Repo: `@sentry/react@11.6.0` (actualizado en F121.2). Instalar el plugin implicaría downgrade o peer forzado con riesgo de API.

L3 — Decisión del usuario (2026-11-03): **SDK nativo directo**, sin deshacer la migración. Estrategia de consentimiento: init condicionado por flag persistido.

L4 — No se arrancó la implementación: la sesión quedó sin contexto disponible. Se documenta para retomar en una sesión nueva sin re-explorar; el primer paso es T1 (DSN en Gradle).

L5 — Implementación (2026-11-03). Desvío consciente de T4: en vez de sumar `@capacitor/preferences` (no instalado) se extendió el plugin local `GymLabSettings` con `setTelemetryConsent`. Motivos: no agrega una dependencia (regla del repo: no cambiar el stack sin acuerdo), el plugin ya está registrado y tiene wrapper tipado, y permite aplicar `init`/`close` del SDK nativo en el acto en vez de esperar al próximo arranque. El flag sigue en SharedPreferences (`gymlab_telemetry`) y lo escribe el JS con el gate completo (producción + claves + consentimiento), no el consentimiento crudo.

L6 — T1–T4 implementadas: `BuildConfig.SENTRY_DSN` desde `gymlab-app/.env`; `io.sentry:sentry-android:8.62.0`; init en `GymLabApplication` con `io.sentry.auto-init=false`; toggle JS→nativo con `Sentry.close()` al apagar. T6: política ES/EN + `legal/privacidad.html` + Data safety actualizados.

L7 — Verificación estática (2026-11-03): `npm run build` limpio; `npm test` **225 archivos / 2049 passed + 1 skipped**; `assembleRelease` BUILD SUCCESSFUL; `BuildConfig.SENTRY_DSN` con el DSN real del `.env`; manifest fusionado con `com.gymlab.app.GymLabApplication` y `io.sentry.auto-init=false`.

L8 — T5 verificado en el dispositivo real RMX5085 (Android 16, 2026-11-03), con un debug firmado con la keystore de release para no borrar datos y poder inspeccionar (`run-as` + CDP); después se reinstaló el release limpio:
- Toggle ON al arrancar ⇒ `shared_prefs/gymlab_telemetry.xml` con `consent=true` y `SentryAndroid.init` corrió (`cache/sentry/<installation-id>/{outbox,.options-cache,.scope-cache}`).
- Crash nativo con `run-as com.gymlab.app kill -SEGV <pid>` ⇒ `.sentry-native/<run>/<uuid>.envelope` de **96.590 bytes** + `last_crash`; al relanzar, el envelope desapareció (enviado) y el run dir quedó vacío.
- Toggle OFF (mismo bridge) ⇒ `consent=false`, el run dir de `.sentry-native` se limpió y un segundo `kill -SEGV` **no** generó envelope ni movió `last_crash`.
- Release limpio reinstalado sobre el debug (misma firma): la app monta y conserva los datos del usuario.

L9 — T5 cerrada. Queda como paso de entrega el push (decisión del owner).

L10 — Commits work-unit: `767d55a6` (T1+T2, build), `9c23d23a` (T3, init nativo), `d9f36920` (T4, bridge de consentimiento), `1a5102c5` (T5+T6, política/Data safety y cierre). T1 y T2 comparten commit porque son el mismo bloque de `android/app/build.gradle`; se verificaron juntos. `gentle-ai review assess` sobre el candidato: `risk: medium`, `review_due: false` (`under_budget`), sin ciclo de review.
