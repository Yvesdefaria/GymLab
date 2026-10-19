# F84d-followup — Refresco del widget sin abrir la app

- **Objetivo**: que los widgets de pasos se actualicen solos, con la app cerrada, leyendo Health Connect desde código nativo cada 15 min.
- **Rama**: `main` (directo, sin worktree — regla del repo).
- **Entrega**: commits work-unit locales, sin push (el usuario pushea a mano).
- **Test runner**: Vitest (`npm test`) para la capa web; JUnit (`gradlew test`) para helpers puros; `assembleDebug` + emulador para lo nativo.

## Specs

- **S1** — Con la app cerrada (proceso muerto con `am kill`, no `force-stop`) y Health Connect conectado, ambos widgets se actualizan solos con el total de pasos de hoy, sin abrir la app.
- **S2** — Cadencia elegida por el usuario: **cada 15 min** (mínimo de WorkManager). Es best-effort: Doze/App Standby pueden atrasarlo.
- **S3** — Con la app abierta se conserva el push actual (debounce 1 s, re-push al volver a foreground); el refresco nativo no lo reemplaza.
- **S4** — Si Health Connect no está disponible o el permiso `READ_STEPS` no está concedido, el worker no hace nada y deja el último snapshot intacto.
- **S5** — Si Health Connect devuelve 0 pasos para hoy, el worker **no** escribe: no pisa un registro manual positivo que ya esté en el widget.
- **S6** — Al colocar un widget (o cuando el sistema dispara `APPWIDGET_UPDATE`) se encola un refresco inmediato, para no esperar 15 min.
- **S7** — Ambos widgets (grande 2×2 y mini 2×1) se redibujan juntos desde el mismo snapshot.
- **S8** — La meta mostrada es la última que empujó la app; si no hay, 10.000.
- **S9** — La guarda de día se conserva: fecha del snapshot ≠ hoy → 0 pasos / 0 %.
- **S10** — No se agrega notificación permanente ni foreground service.
- **S11** — Health Connect exige `READ_HEALTH_DATA_IN_BACKGROUND` (disponibilidad `FEATURE_READ_HEALTH_DATA_IN_BACKGROUND`) para leer con la app cerrada: se declara en el manifest y se pide una sola vez desde la UI nativa (`GymLabHealth`). Sin ese permiso el worker no lee y el widget se queda con el último snapshot (degradación silenciosa).

## Tasks

- [x] **T1** — Build: Kotlin en el módulo `app` + `androidx.work:work-runtime` + `connect-client` explícito. Verificar `assembleDebug` — ✅ `compileDebugKotlin` + `assembleDebug` OK.
- [x] **T2** — Helpers puros + JUnit (`shouldPersistNativeSteps`, gate del sync debug). RED→GREEN — ✅ `WidgetRenderTest` 11/11.
- [x] **T3** — `HealthStepsReader` + `WidgetSyncWorker` + `WidgetSyncScheduler` (Kotlin) — ✅.
- [x] **T4** — Wiring: `MainActivity`, providers (`onEnabled`/`onUpdate`/`onDisabled`) + hook debug de E2E — ✅.
- [x] **T5** — Verificación: `npm test` (163/1646), `npm run build` limpio, `gradlew test` (11/11), `assembleDebug` OK, E2E en emulador con la app matada — ✅.
- [x] **T6** — Docs: `CHANGELOG.md` + este doc — ✅.
- [x] **Review RDD** del candidato antes del commit (riesgo alto: permisos de salud + trabajo en background) — lineage `review-80e63af1c76532e6`: reviewer + refuter corroboraron **R3-002 CRITICAL** (faltaba el permiso de background); corrección aplicada. Sucesor `review-e0ee33d682fc4c9d`: re-review **escalada** por **R3-001 BLOCKER** (`unknown_causality`: falta cobertura automática del camino real de Health Connect). Decisión del usuario (2026-10-19): **entregar ahora** y dejar la cobertura como follow-up.

## Log

- **L1** — Pedido del usuario (verbatim): «el widget no se actualiza a no ser que entre a la app, debe actualizarse solo sin necesidad de entrar ni una vez en la app, el tiempo de refresco lo podemos discutir».
- **L2** — Decisión del usuario (2026-10-19): cadencia **cada 15 min**.
- **L3** — Diagnóstico verificado: el widget solo lee `SharedPreferences`; el snapshot lo escribe únicamente el WebView (`useWidgetSyncHost` → `GymLabWidgetPlugin`); Health Connect solo se lee desde `stepsSync.ts` con la app viva. El `updatePeriodMillis=1800000` redibuja el mismo snapshot viejo.
- **L4** (2026-10-19) — Implementado y verificado. Evidencia E2E: app muerta (PID vacío), job periódico real de WorkManager (WorkSpec `1f5b9b43…`, `interval_duration=900000`) ejecutado por JobScheduler a las 17:49:02; `WidgetSyncWorker` → `Worker result SUCCESS`; snapshot `steps=12345` (`updatedAt=1792432142565`) y `uiautomator` muestra `12,345` en los dos widgets con `MainActivity` ausente. El camino sin override ni datos de salud dejó el snapshot intacto (`12,345`). La lectura real de Health Connect no se pudo ejercitar en el emulador (sin fuente de pasos); queda validación física en teléfono real.
- **L5** (2026-10-19) — Nota de operación: `am force-stop` y `am kill` hacen que `ForceStopRunnable` de WorkManager trate el cierre como force-stop y posponga un período; para la E2E se mató el proceso con `run-as … kill -9` (motivo `SIGNALED`) y así corrió el job periódico real.
- **L6** (2026-10-19) — Review RDD (lineage `review-80e63af1c76532e6`, lens reliability): el refuter corroboró **R3-002 CRITICAL** — faltaba `READ_HEALTH_DATA_IN_BACKGROUND` y el chequeo de `FEATURE_READ_HEALTH_DATA_IN_BACKGROUND`; sin eso `aggregate` falla en un dispositivo real y el worker no refresca. Corrección acotada (125 líneas de forecast): permiso en `AndroidManifest.xml`; checks en `HealthStepsReader`; plugin `GymLabHealth` (Kotlin) que pide el permiso una vez (`asked` en prefs nativas); `healthBackgroundBridge` + llamada desde `healthSyncController` cuando el sync quedó `granted`; 4 tests nuevos. Verificado: `npm test` 163/1650, `assembleDebug` OK, emulador con `READ_HEALTH_DATA_IN_BACKGROUND: granted=true` tras el diálogo.
- **L7** (2026-10-19) — Commit `fb712a74` — «feat: refresca el widget de pasos con la app cerrada (F84d-followup)» (17 archivos, +488/−2). Sin push.
