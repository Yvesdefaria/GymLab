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

| ID | Tarea | Specs | Estado |
|----|-------|-------|--------|
| T1 | DSN en Gradle (`buildConfigField` leyendo `.env`) y verificación en `BuildConfig` | S3 | pendiente |
| T2 | `io.sentry:sentry-android` (última 8.x, confirmar en Maven Central) | S1 | pendiente |
| T3 | Init en el contenedor (`MainActivity`/`Application`) con las opciones de S3 | S3, S4 | pendiente |
| T4 | Flag de consentimiento JS→nativo (`@capacitor/preferences` → SharedPreferences), leído antes del init | S2 | pendiente |
| T5 | Crash nativo provocado en device con toggle ON/OFF | S4 | pendiente |
| T6 | Política + Data safety | S5 | pendiente |

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
