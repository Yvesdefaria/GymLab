# F108 — Pasos: permiso al inicio y sync al abrir (diseño)

> Fecha: 2026-09-27 · Estado: aprobado (brainstorming con el usuario, opción A) · Fuente: Fase 108 de `PLAN.md` (nota #14)
> **Supersede** dos decisiones de F84c: la #4 (permiso just-in-time solo en `/pasos`, «no se pide nada al abrir la app») y parte de la #5 (background diferido a F84d) — ahora la sync corre a nivel app sin servicio nativo.

## Problema

`useHealthSync` pide el permiso de Health Connect **al entrar a `/pasos`** y cada vez que la página se remonta; la sync solo corre con esa página montada. No hay memoria de «ya pedido» ni sync global: si el usuario no entra a `/pasos`, los pasos nunca se leen, y el permiso se vuelve a pedir en cada visita (o queda denegado sin un camino claro). Nota original del usuario: «el permiso debe pedirse al iniciar la app, una sola vez… y que funcione en segundo plano consumiendo poca batería; si cada vez que querés registrarlo tenés que entrar a su apartado es tedioso».

## Estado actual (evidencia, 2026-09-27)

- **Permiso**: `useHealthSync.ts:52-57` llama a `connect()` al montar `/pasos`; `stepsSync.ts:24` pide permiso **en cada sync** (incluso ya concedido). Sin flag de «ya pedido» en `meta` ni localStorage.
- **Sync**: solo con `/pasos` montada (mount + `appStateChange` si `granted`, `useHealthSync.ts:61-63`). No hay nada global en `AppShell`/`providers`.
- **No se pierde nada**: Health Connect acumula pasos a nivel sistema aunque la app esté cerrada; la app solo **lee**, con sync incremental desde `meta.healthLastSyncAt` (`stepsSync.ts:27-32`).
- El plugin (`capacitor-health` ^8.2.0) expone **`checkHealthPermissions`** (consulta sin diálogo; Android `HealthPlugin.kt:220-243`, iOS `HealthPlugin.swift:30`, README §`checkhealthpermissions`) — hoy sin usar.
- `requestHealthPermissions` lanza la activity de consentimiento **aunque el permiso ya esté concedido** (`HealthPlugin.kt:268-288`) → sin chequeo previo el arranque normal abriría un viaje innecesario.
- Sin capacidad de background en app/plugin: no hay servicios/WorkManager ni `READ_HEALTH_DATA_IN_BACKGROUND`.

## Decisiones (aprobadas por el usuario, 2026-09-27)

1. **«Segundo plano» = sync al abrir/volver a primer plano** (opción A). Servicio nativo real (foreground service/WorkManager + permiso de background) **descartado**: su valor real son notificaciones proactivas, no «pasos al día» — lo que importa se recupera al abrir; costo de batería ~0.
2. **Permiso al inicio, una sola vez**: en el primer arranque «usable» (wizard de onboarding ya fuera de pantalla) se hace **un** pedido; se persiste `meta.healthPermissionAskedAt`; después **nunca más automático**. El reintento queda manual (botón del banner en `/pasos`).
3. **Chequeo previo sin diálogo** (`checkPermission`) para no abrir el consentimiento cuando ya está concedido.
4. **Controlador único** compartido por `AppShell` y `/pasos`: una sola sync, un solo pedido, un solo estado (hoy dos montajes = doble diálogo/doble sync).
5. **iOS fuera de alcance** (sin Info.plist/entitlements de salud; requiere macOS). Web degrada igual que hoy (`unavailable`, sin listeners).
6. **Sin sección de salud en Ajustes** en esta fase (YAGNI: el banner ya ofrece reintento).
7. **Local-first intacto**: ningún fallo del sistema de salud toca datos locales ni rompe la UI (misma regla de F84c).

## Diseño

### WP1 — `healthBridge.checkPermission()` (sin diálogo)

- `HealthBridge` gana `checkPermission(): Promise<boolean>`:
  - nativa: `Health.checkHealthPermissions({ permissions: ['READ_STEPS'] })` → `isPermissionGranted(permissions, 'READ_STEPS')`;
  - nula (web): `false`.
- Antes de implementar, verificar la forma real de la respuesta en `node_modules/capacitor-health` (Android/Kotlin + defs JS). El plugin devuelve el **mapa** `{ READ_STEPS: true }`; `isPermissionGranted` ya acepta mapa y array (regresión F84c).

### WP2 — `stepsSync`: modos `auto | interactive`

- `syncStepsFromHealth(bridge?: HealthBridge, mode: 'auto' | 'interactive' = 'interactive')`:
  - `interactive` (default, uso manual): pide permiso como hoy (`requestPermission`).
  - `auto`: usa `checkPermission()`; si no está concedido → `{ status: 'denied' }` **sin abrir diálogo**; si sí → flujo normal.
- Sin cambios en rango/backfill/fusión/telemetría. El default `interactive` mantiene compatibilidad con los tests actuales y con el `connect()` del banner.

### WP3 — Controlador `src/data/healthSyncController.ts` (singleton, sin React)

- Estado de módulo: `status` + `listeners: Set` + `inFlight` único (dedupe global de syncs).
- API:
  ```ts
  export type HealthSyncStatus = 'idle' | 'syncing' | 'granted' | 'denied' | 'unavailable' | 'error'
  export const mapSyncStatus = (status: SyncStatus): HealthSyncStatus
  export const startupAction = (available: boolean, granted: boolean, askedAt: string): 'sync' | 'ask' | 'none'
  export const getHealthSyncStatus = (): HealthSyncStatus
  export const subscribeHealthSync = (listener: (s: HealthSyncStatus) => void) => () => void
  export const refreshHealthSync = (): Promise<void>   // modo auto: NUNCA abre diálogo
  export const connectHealthSync = (): Promise<void>   // modo interactive: puede pedir (banner)
  export const runStartupHealthSync = (): Promise<void> // decide y actúa + persiste flag
  ```
- `runStartupHealthSync`: no nativo → `unavailable`; no disponible → `unavailable` (no tiene sentido pedir sin ecosistema); concedido → sync auto; no concedido sin flag → `connectHealthSync()` (**pedido único**) y persiste `healthPermissionAskedAt` (solo si el resultado fue `granted`/`denied`; en `error` no se persiste, para poder reintentar en el próximo arranque); no concedido con flag → `denied` sin diálogo.
- El fix de loop de F84c (`shouldResyncOnForeground`) pasa a ser **estructural**: `refresh` nunca pide, así que el foreground puede refrescar siempre sin realimentarse. El test de regresión se reemplaza por «refresh nunca llama a requestPermission (modo auto)».

### WP4 — Hooks + montaje

- `src/hooks/useHealthSync.ts`:
  - `useHealthSync()` (página `/pasos`): se suscribe al controlador; al montar llama `refreshHealthSync()` (auto, sin pedir); devuelve `{ status, connect: connectHealthSync }`. La API que consume el banner no cambia.
  - `useHealthSyncHost()` (global, nuevo): montado en `AppShell`; cuando el onboarding ya no está visible (`useOnboardingStatus`: `done === true || workouts.length > 0`) dispara `runStartupHealthSync()` **una vez** (ref); registra `appStateChange` → `refreshHealthSync()` al volver a foreground.
- `AppShell.tsx`: monta `useHealthSyncHost()` (junto a `useNotificationScheduling`).
- `StepsPage.tsx`: sin cambios de render (sigue con `useHealthSync` + `HealthSyncBanner`).

### WP5 — Docs

- `CHANGELOG.md` bajo `[Unreleased]` → `Added`/`Changed`.
- `PLAN.md`: marcar F108 (checkbox 108.1) con el detalle del cierre.

## Tareas (TDD, un commit por tarea; review de Gentle AI ANTES de cada commit de código)

1. **T1 — bridge `checkPermission`**: test primero en `tests/unit/data/healthBridge.test.ts` (mapa concedido, array concedido, denegado/ausente, web → false). Commit `feat: checkHealthPermissions sin dialogo en el bridge de salud (F108)`.
2. **T2 — modos de sync**: tests en `tests/unit/data/stepsSync.test.ts` (auto con permiso → sincroniza sin `requestPermission`; auto sin permiso → `denied` sin `requestPermission`; interactive default intacto). Commit `feat: modo auto/interactive en el sync de pasos (F108)`.
3. **T3 — controlador**: tests nuevos `tests/unit/data/healthSyncController.test.ts` (patrón de mocks de `stepsSync.test.ts`): `startupAction` (3 ramas + no disponible), concedido → sync sin pedir, no concedido sin flag → pide **una vez** y persiste flag, con flag → no pide (`denied`), `refresh` nunca pide, error del pedido no persiste flag, dedupe `inFlight`. Commit `feat: controlador global de health sync con permiso unico al inicio (F108)`.
4. **T4 — hooks + AppShell + tests actualizados**: `useHealthSync` (subscriber) + `useHealthSyncHost` + montaje en `AppShell`; `tests/unit/hooks/healthSync.test.ts` (se retira `shouldResyncOnForeground` → cubierto por modo auto) y `useHealthSync.test.ts` (import de `mapSyncStatus` desde el controlador); imports de `HealthSyncStatus` donde haga falta. Commit `feat: sync de salud global al abrir y primer plano (F108)`.

> Cualquier ajuste de i18n: **no se esperan claves nuevas** (el banner no cambia). Si aparece una clave, va en es + en.

## Verificación

- `npm test` — suite completa verde (base actual + nuevos; reportar conteo exacto).
- `npm run build` — **gate real de tipos** (`tsc -b`) + build limpio. (`npx tsc --noEmit` es vacuo en este repo.)
- e2e regresión: `python tests/e2e/scripts/with_server.py tests/e2e/test_f84b_pasos.py` → ALL OK (web sin banner, como hoy).
- **Emulador** (cambio de arranque nativo): receta de AGENTS.md; criterio `root.children.length > 0`, body con texto, **0 `pageerror`**; en emulador sin Health Connect con datos se espera degradación a `unavailable` (banner silencioso en `/pasos`).
- **Diferido a dispositivo físico (gate de release)**: diálogo de consentimiento **una sola vez** al primer arranque y pasos actualizados al abrir/volver sin entrar a `/pasos`.

## Fuera de alcance

- iOS (config de salud completa; requiere macOS/entitlements) — anotado.
- Servicio en segundo plano real (foreground service / WorkManager / `READ_HEALTH_DATA_IN_BACKGROUND`) — descartado por decisión #1.
- Sección de salud en Ajustes.
- F84d widget nativo (sigue bloqueado por toolchain).

## Riesgos

- **Forma de respuesta de `checkHealthPermissions`** (mapa vs array): mitigado por `isPermissionGranted` (acepta ambas) + tests; verificar en `node_modules` antes de T1.
- **Flag no persistido si la app muere durante el diálogo** → un re-pedido adicional en el siguiente arranque (aceptable, raro).
- **Emulador sin Health Connect**: no se puede validar end-to-end el pedido real; queda smoke de no-regresión + validación en dispositivo físico.
