# F84d — Widget nativo Android (contador de pasos)

- **Estado**: ✅ COMPLETA (2026-10-09) — 8 commits (`503758f`…`26429cb`), E2E en emulador, reviews completos; workspace SDD archivado en `~/.gentle-ai/sdd-archive-f84d/`.
- **Fase del PLAN**: Fase 84 — Wearables / contador de pasos (único resto: 84d; iOS sigue bloqueado sin macOS)
- **Directorio**: `gymlab-app` (directorio normal, sin worktree — regla del repo: aislamiento solo a pedido)
- **Alcance**: `gymlab-app` (puente web + hooks, recursos nativos Android, plugin Capacitor, manifest, tests unit) + verificación en emulador

## Objetivo

Dos widgets de pantalla de inicio que muestren los pasos de la app: **"GymLab · Steps"** (2×2: label STEPS, número, "of 10,000", barra, %) y **"GymLab · Steps mini"** (2×1: solo el número). Empuje instantáneo (<1 s) cuando la app escribe datos (plugin nativo chico) + respaldo del sistema cada ~30 min. Verde `#22C55E` al cumplir la meta (pasos ≥ meta). Tap abre la app en `/pasos`. Copy del widget en inglés (decisión de producto); la app sigue en es-ES.

## Problema / contexto (verificado por exploración 2026-10-09)

1. No existe NADA de widget/receivers/prefs nativas; `android/` es Java-only (sin toolchain Kotlin).
2. Dexie/IndexedDB no es legible desde nativo → hace falta un puente web→nativo (snapshot).
3. No existe deep link alguno (`custom_url_scheme` declarado pero sin uso; sin `appUrlOpen`).
4. `updatePeriodMillis` tiene piso de 30 min en Android → para ≤30 s hace falta push (plugin).
5. F108: la sync de salud corre solo con la app abierta/en primer plano; app cerrada = último snapshot (límite aceptado).
6. No hay UI para cambiar la meta de pasos (`setGoal` sin consumidor) → fuera de alcance, follow-up.

## Diseño aprobado (usuario, 2026-10-09 — brainstorming + grill)

- **Spec**: `docs/superpowers/specs/2026-10-09-f84d-widget-nativo-design.md` (commit `d448d18`, inglés).
- **Plan**: `docs/superpowers/plans/2026-10-09-f84d-widget-nativo.md` (commit `cbf5164`, 8 tareas).
- Decisiones clave: layout A (2×2) + mini 2×1; estilo fijo dark `#121214` / dorado `#D9B384`; verde al cumplir; tamaños fijos; sin preview images; push plugin (SharedPreferences + `updateAppWidget`) + fallback 30 min; day-guard (fecha vieja → 0); deep link `com.gymlab.app://pasos`; números `Locale.US` (`8,432`).
- Follow-ups anotados como futuros (no en esta fase): editor de meta de pasos; widget que se adapte al tema/paleta del usuario.

## Checklist (ruta por tarea)

- [x] **T1** — `src/data/widgetBridge.ts` + tests (TDD) · ruta: delegado (writer único) · trigger: archivo nuevo + tests.
- [x] **T2** — `src/hooks/useWidgetSyncHost.ts` + wiring en `AppShell` · ruta: delegado.
- [x] **T3** — deep links web (`widgetDeepLinks` + hook + tests) + wiring · ruta: delegado.
- [x] **T4+T5 (fusionadas)** — recursos nativos + WidgetRender + providers + receivers: UN candidato (el slice solo-recursos fue rechazado por el RDD — R3-001 sin consumidores; lineage abandonada) · ruta: delegado.
- [x] **T5** — (fusionada con T4 en un solo candidato) · ruta: delegado.
- [x] **T6** — plugin Capacitor + `MainActivity` + intent-filter deep link · ruta: delegado.
- [x] **T7** — verificación E2E en emulador (vacío/push/verde/broadcast/day-guard/deep link) · ruta: delegado + inline.
- [x] **T8** — cierre docs (PLAN.md, CHANGELOG.md, COMPLETED.md, spec amended) · ruta: inline (orquestador).
- [ ] **Review RDD por candidato** (candidate = workspace diff, antes de cada commit) · ruta: inline (orquestador).

## Criterios de aceptación

1. `npx vitest run` dirigido de los tests nuevos: verde; `npm test` completo verde; `npm run build` exit 0.
2. Emulador: widgets colocados muestran el estado vacío correcto (0 / of 10,000 / 0%).
3. Emulador: registrar pasos en la app → widgets actualizados en <1 s (sin esperar 30 min).
4. Emulador: pasos ≥ meta → barra+% (grande) y número (mini) en verde `#22C55E`; % real (ej. 120%).
5. Emulador: broadcast `com.gymlab.app.action.REFRESH_WIDGETS` re-renderiza sin crash (respaldo).
6. Emulador: tap en cualquier widget abre la app en `/pasos` (app corriendo y cold start).
7. Cada candidato pasó el ciclo de review RDD antes de su commit; commits sin push.

## Verificación (comandos)

- `npx vitest run tests/unit/data/widgetBridge.test.ts tests/unit/data/widgetDeepLinks.test.ts`
- `npm test` · `npm run build`
- Emulador: receta del plan (sync → gradlew assembleDebug → install → CDP) + broadcast + `am start` VIEW.

## Review RDD

- **4 candidatos RDD, todos approved + acknowledged (authority burned)**: T1 `review-1c436c16d7d0384f`; T2 `review-b9e73dd365f98314` + fix `review-0f350da44f59dfcb`; T3 `review-b6453837505c50ce` (CRITICAL inferencial R3-NAV-RERUN corroborado por refuter → corrección acotada → targeted validator passed); T4+T5 combinado `review-2270e55d2cfd926a`; T6 `review-0eaeec6bf3c2d2ef`. T4 solo-recursos: `review-b6727710f4bda8f4` **abandonada** (operator_disposition; quarantine).
- **Skill**: reviews de tarea Approved (T1–T6; T4+T5 como candidato combinado), re-reviews escopeados OK, **review final de branch** «ready with fixes» (0 críticos) → obligaciones de cierre cumplidas (day-guard ejecutado + spec amended; re-review escopeado: all addressed) → endurecimientos diferidos a `84d.followups` del PLAN.

## Progreso / evidencia

- 2026-10-09: brainstorming + grill + spec (`d448d18`) + plan (`cbf5164`) cerrados; ejecución iniciada en modo subagentes (ledger SDD en `.superpowers/sdd/2026-10-09-f84d-widget-nativo/progress.md`).
- 2026-10-09: **T1 completa** — `src/data/widgetBridge.ts` + tests TDD (RED→GREEN 6/6; suite 142 archivos/1435 tests; build EXIT 0); review RDD approved + acknowledged, authority burned (lineage `review-1c436c16d7d0384f`; advisories R3-001..003 diferidos a PLAN); reviewer del skill Approved; commit `503758f` sin push.
- 2026-10-09: **T2 completa** — `src/hooks/useWidgetSyncHost.ts` + wiring en `AppShell` (commit `a5ec72e`); review RDD approved + acknowledged authority burned (lineage `review-b9e73dd365f98314`); reviewer del skill Approved con 1 Important plan-mandated (re-push de medianoche) → fix round 1 (`14b994c`, re-lectura de `getByDate(today)` al foreground; RDD lineage `review-0f350da44f59dfcb` burned) re-revisado: all addressed, 0 nuevos bloqueantes. Minors diferidos: `.catch` del fresh read, ventana ~1s del path debounced, advisories RDD R3-001..005.
- 2026-10-09: **T3 completa** — `widgetDeepLinks` + `useWidgetDeepLinks` + tests + wiring en AppShell (commit `7760328`); RDD: CRITICAL inferencial `R3-NAV-RERUN` corroborado por refuter → `correction_required` → corrección acotada (ref pattern, 7 líneas de plan) → targeted validator passed → approved + acknowledged, authority burned (lineage `review-b6453837505c50ce`); reviewer del skill Approved (0 críticos/importantes; minors: matcher permisivo plan-mandated, `WIDGET_PASSOS_URL` sin acoplar, ref-write en render, cleanup sin catch, CHANGELOG en T8).
- 2026-10-09: **T4 (recursos) rechazada por el RDD** — R3-001 CRITICAL determinístico: recursos sin receivers/providers → sin efecto en runtime (budget de corrección 57; el fix real excede). **Ruling**: abandonar la lineage (`review-b6727710f4bda8f4`, quarantine committed) y recortar **T4+T5 fusionadas** en UN candidato (recursos + consumidores juntos).
- 2026-10-09: **T4+T5 (combinadas) completas** — commit `3a5ac0f` (11 archivos, +311): recursos + `WidgetRender` + providers + receivers; RDD approved + acknowledged, authority burned (lineage `review-2270e55d2cfd926a`; advisories R3-001..004 diferidos); reviewer del skill Approved (0 críticos/importantes; desvío divulgado verificado: `setProgressTintList` no existe → `setColorStateList` API 31+ con fallback).
- 2026-10-09: **T6 completa** — plugin `GymLabWidgetPlugin` + `registerPlugin` en MainActivity + intent-filter deep link (commit `8f505a1`, 3 archivos, +33); RDD approved + acknowledged, authority burned (lineage `review-0eaeec6bf3c2d2ef`); reviewer del skill Approved; el implementer además instaló en emulator-5554 y verificó boot + deep link (`/pasos` por CDP). Queda la E2E completa (T7).
- 2026-10-09: **T7 completa** — E2E en emulador (sin cambios de código): colocación automatizada de ambos widgets OK; estado vacío OK; push 8,432 → render OK (prefs `steps=8432 goal=10000 date=2026-10-09`); meta 12,000 → barra/+% verdes y mini verde OK; broadcasts de refresco OK (result=0, sin crash); deep link warm + cold start → `/pasos` OK; **day-guard ejecutado** (fecha reescrita a ayer → `0`/`0%`; restaurada → `12,000`/`120%` verde). 21 screenshots + `task-7-report.md`. Concerns: latencia de medición ~2–8 s con round-trips de adb (debounce 1 s; requisito ≤30 s — cumple) y SIGILL de WebView `onTrimMemory` (ambiente API 37 16KB; pre-existente).

## Próximo paso

Ninguno de la fase: F84d completa. Pendiente manual del usuario: **push** cuando quiera (commits nuevos en `main`, sin pushear); validación física de los widgets en teléfono real (lista del PLAN); y los follow-ups `84d.followups` («Seguimiento de reviews») cuando los quiera encarar.

- 2026-10-09 (post-cierre): F84 movida formalmente a `COMPLETED.md` (fila Era 7 completa + nota; commit `416f074`) y su sección retirada del PLAN; `npm run android:sync` ejecutado (assets web copiados al proyecto Android, 10 plugins, ruido de gradle revertido).
- 2026-10-14 (cierre de cola): los endurecimientos `84d.followups` (a–g) quedaron **resueltos** en los lotes 27–29 y 32 (`84d.followups` a,b,c,f → `329efed`; d,e → `7793536`; residuales de esos reviews → lote 29 `4b946ff` + lote 32 `01ba2ea`; (g) descartado). El **SIGILL de WebView `onTrimMemory`** (concern de T7) se caracterizó y archivó en el **lote 33**: es Chromium nativo del emulador preview API 17/16KB — `com.android.chrome` crashea idéntico en el mismo emulador (2×) y el **device real** (realme RMX5085, Android 16) pasó trims ×7 + background + tour con 0 crashes ⇒ **ajeno a la app**. La sección «Seguimiento de reviews» del PLAN quedó **CERRADA (cero residuales)** y archivada en `COMPLETED.md`. Pendiente manual del usuario: el **push**.
