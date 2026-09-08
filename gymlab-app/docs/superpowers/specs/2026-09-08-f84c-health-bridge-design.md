# F84c — Puente de salud: Background Sync (HealthKit / Health Connect) (diseño)

> Fecha: 2026-09-08 · Estado: aprobado · Fuente: Fase 84c de `PLAN.md` · «sincronizar pasos en segundo plano usando Capacitor + HealthKit/Google Fit»

## Contexto

GymLab ya tiene el contador de pasos funcional en web/PWA (F84b): entrada manual con upsert diario en Dexie (`stepRepo`), `useStepData` que expone hoy/semana/mes/racha/heatmap/logros, y el tipo `StepSource = 'manual' | 'phone' | 'watch'` ya modelado en `domain/types.ts`.

Capacitor 8.5 ya está en `package.json` (core, android, ios, cli, app, haptics, status-bar, splash-screen) con scripts `android:sync`/`android:open`, pero **no hay carpetas `android/` ni `ios/`** (`cap add` nunca corrió). La fase 84c del plan original asumía «leer acelerómetro cada 15 min + Google Fit API v2 vía custom plugin» — ese enfoque quedó **obsoleto**:

1. En 2026, **Google Fit legacy está deprecado**; el estándar actual de Android es **Health Connect**.
2. El plugin vigente es **`@capacitor-community/health`** (HealthKit en iOS + Health Connect en Android), con API `isHealthAvailable()`, `requestHealthPermissions(['READ_STEPS'])` y `queryAggregated({ dataType: 'steps', bucket: 'day' })`.
3. Si el sistema de salud es la fuente de verdad, **el sistema ya cuenta los pasos siempre**; la app solo lee. El «background fetch cada 15 min» solo tiene sentido real cuando exista el widget nativo (F84d) — leer en background sin widget no aporta nada visible al usuario.

## Decisiones (aprobadas por el usuario en brainstorming 2026-09-08)

1. **Fuente de verdad = sistema de salud** (HealthKit iOS / Health Connect Android). La entrada manual NO es fuente de producción: queda como **herramienta de testeo/dev y respaldo en web** (donde no hay ecosistema). En la fase final nativa no se podrá añadir pasos manualmente.
2. **Regla de fusión por día** (domain puro): un sync de health **nunca pisa con 0**; si trae `steps > 0`, reemplaza el registro del día **siempre** (es la fuente de verdad: «lo que cuente el teléfono o reloj, eso es»). La entrada manual solo rige donde no hay ecosistema (web/dev/test) o cuando health no reporta ese día. No hay caso «manual posterior pisa a health» en nativo: el manual es herramienta de testeo, no producción.
3. **Alcance de esta fase: bridge listo, activación diferida.** Se instala el plugin npm, se implementa adapter + orquestador + hook + banner, y el registro ejecutable queda **condicional al runtime nativo** (`Capacitor.isNativePlatform()`). En web/dev/PWA todo degrada a `unavailable` y nada se rompe. **NO** se corre `cap add` en esta fase; el manifest de Android (queries + uses-permission), los entitlements de HealthKit y los pasos de `cap add` quedan **documentados** para la activación (F84d).
4. **Permisos just-in-time en `/pasos`**: la primera vez que se entra en runtime nativo se pide permiso de lectura de pasos ahí mismo; si se rechaza, la página funciona con banner «Sin acceso a pasos del sistema» + botón «Conectar salud». No se pide nada al abrir la app.
5. **Forward-sync de `registerBackgroundSync()`**: queda el esqueleto comentado/diferido, NO ejecutado hasta F84d (widget).
6. **Local-first, fail-open**: cualquier fallo del sync (sin Health Connect instalado, sin permiso, error de API) no toca los datos locales; la UI nunca crashea por ausencia de salud.

## Paquetes de trabajo

### WP1 — Fusión de dominio (puro, TDD)
- `src/domain/stepsFusion.ts`:
  - `mergeHealthSample(localDate: string, day: DailyStepsEntry | undefined, healthSteps: number, strideLengthCm: number, appliedAt: string): DailyStepsEntry | null`.
  - Regla: `healthSteps > 0` → día = health (steps, distancia/calorías recalculadas con la zancada vigente recibida); `healthSteps <= 0` → `null` = no escribir (no pisa). Sin registro y sin health → `null`. Cuando health no está disponible (web), la fuente es la manual existente.
  - Sin imports de runtime; inputs/salidas planos.

### WP2 — Adapter de salud (`src/data/healthBridge.ts`)
- Interfaz `HealthBridge`:
  - `isAvailable(): Promise<boolean>` (web → `false`).
  - `requestPermission(): Promise<'granted' | 'denied'>` (web → `'denied'`).
  - `fetchStepsByDay(from: string, to: string): Promise<HealthDaySample[]>` donde `HealthDaySample = { localDate: string; steps: number }` (web → `[]`, no lanza).
- Impl nativa sobre `capacitor-health`:
  - `isHealthAvailable()` → `available`.
  - `requestHealthPermissions({ permissions: ['READ_STEPS'] })` → mapeo a `granted`/`denied`.
  - `queryAggregated({ startDate, endDate, dataType: 'steps', bucket: 'day' })` → cada sample mapea `startDate` (ISO) → `localDate` vía helper existente de `domain/dates`; suma buckets si el plugin devuelve múltiples por día (robustez).
- Factory `getHealthBridge()`: `Capacitor.isNativePlatform()` → impl nativa; si no → impl nula (`available: false`).

### WP3 — Orquestador (`src/data/stepsSync.ts`)
- `syncStepsFromHealth(bridge?: HealthBridge): Promise<SyncResult>` (DI: sin arg usa `getHealthBridge()`):
  - Guard: bridge no disponible → `{ status: 'unavailable' }`.
  - Permiso: `requestPermission()` no concedido → `{ status: 'denied' }`.
  - Pull: `fetchStepsByDay(from, to)` → `stepsFusion` por día → `stepRepo.upsert({ localDate, steps, distanceKm, calories, source: 'phone' })` (source `'watch'` queda reservado para F84e).
  - Incremental: fecha guardada en meta `healthLastSyncAt` (vía `metaRepo.setJson`); el primer sync hace backfill de **últimos 90 días** (`addLocalDays(toLocalDateStr(), -89)`), los siguientes desde `healthLastSyncAt`. El `from` se normaliza a `YYYY-MM-DD` con `toLocalDateStr(new Date(lastSync))` porque el bridge construye `new Date(from + 'T00:00:00')` (un ISO con hora rompería el parse).
  - Telemetría: `track('steps_synced', { days })` / `track('steps_sync_failed', { reason })` (no-op en dev sin gating).
  - `registerBackgroundSync(handler)`: esqueleto documentado, no registrado en esta fase (YAGNI hasta F84d).
- `SyncResult = { status: 'unavailable' | 'denied' | 'synced' | 'error'; days?: number }`.

### WP4 — Hook de UI (`src/hooks/useHealthSync.ts`) + banner
- Montado en `StepsPage`:
  - En nativo: al montar, `syncStepsFromHealth` una vez y re-sync al volver a foreground (`App.addListener('appStateChange')` → `active`).
  - Expone `{ status, connect }` con estados `idle | syncing | granted | denied | unavailable | error`; `mapSyncStatus: SyncStatus → HealthSyncStatus` es pura y exportada (convención de tests del repo: sin `@testing-library/react`).
  - `connect()` reintenta el flujo completo (banner → botón «Conectar salud»).
  - `StepsPage` no cambia su lógica de presentación; el hook solo se suma.
- `src/components/steps/HealthSyncBanner.tsx`:
  - Estados visibles: sincronizando (spinner con `aria-live`), «Sin acceso a pasos del sistema» + botón «Conectar salud» (denied, variante `outline`), error con botón «Reintentar». `idle`/`granted`/`unavailable` → `null` (silencioso: en web no molesta).
  - Mobile-first, en español, accesible, sin scrollbar, tono GymLab.

### WP5 — i18n + dependencia + docs de activación
- Claves nuevas es/en: `steps.healthSyncing`, `steps.healthDenied`, `steps.healthDeniedAction`, `steps.healthError`, `steps.healthRetry` (solo las que el banner usa; no añadir claves muertas).
- Dependencia: `npm i @capacitor-community/health` (solo npm; **sin** `cap add`).
- `PLAN.md` F84c: marcar las 7 tareas `[x]` + redactar la sección de activación nativa (manifest `queries`/`uses-permission READ_STEPS`, entitlements HealthKit, pasos `cap add android/ios`, Health Connect en Play Store) como referencia para F84d.
- `CHANGELOG.md` bajo `[Unreleased]` → `Added`.

### WP6 — Verificación
- TDD dominio: `tests/unit/domain/stepsFusion.test.ts` (~6 casos: health>0 reemplaza; health=0 no pisa; sin registro+health null; health>0 reemplaza incluso si existe manual; web→manual; recálculo distancia/calorías).
- Adapter: `tests/unit/data/healthBridge.test.ts` con mock de `capacitor-health` (mapeo grant/denied, muestras → localDate, web → unavailable).
- Orquestador: `tests/unit/data/stepsSync.test.ts` con bridge mock (backfill 90 días, incremental desde lastHealthSyncAt, denied/unavailable no tocan datos, telemetría).
- Verificación completa: `tsc -b` (gate real; `tsc --noEmit` es vacuo en GymLab), `npm run build`, vitest completo (483+), e2e F84b sigue verde (regresión).
- **Sin verificación nativa posible en este entorno** (no hay Xcode/dispositivo): queda documentado como tarea de activación.

## Dependencia externa (usuario)

- **Ninguna para esta fase.** La activación nativa real (F84d) requerirá: Android con Google Play Services + Health Connect instalado, cuenta iOS con HealthKit entitlements, y `cap add android/ios` + pruebas en dispositivo físico. Se documenta, no se ejecuta.