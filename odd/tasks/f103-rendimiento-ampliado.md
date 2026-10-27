# F103 ampliada — Rendimiento y estabilidad: fixes de auditoría + re-auditoría F91 en features nuevas

**Estado:** **FASE COMPLETA** (T0–T11; cierre 2026-10-05) — 11 fixes implementados/revisados + re-auditoría con informe accionable; **merge fast-forward a main (`e7123e4`)**; worktree deregistrado y rama `f103` borrada. **Push: HECHO (2026-10-07, junto con F120: `88e5b06..b20d9b0`).** Único resto físico: la carpeta `.worktrees/f103` quedó en disco (vacía, 0 archivos — todo mergeado en main, `e7123e4` es ancestro de HEAD) con un lock externo de Windows que ningún proceso vivo admite; **borrado automático programado vía RunOnce (`GymLab-CleanF103Worktree`) para el próximo inicio de sesión** (2026-10-07). Fase archivada en `COMPLETED.md` (Era 11).
**Worktree:** `.worktrees/f103` (rama `f103`). Commits de la fase: `c4fc5ba` (docs/plan), `2fce948` (smoke), `23e5800` (fuentes).
**Autorización del usuario (2026-10-05):** «ok, amplíala, haz lo que pide + repetimos F91 ampliando a las features nuevas».
**Regla de implementación (preferencia del usuario, 2026-10-05):** extraer componentes reutilizables cuando algo se use —o pueda usarse— en más de un sitio (DRY de componentes).

---

## Decisiones del usuario (ronda de grilling, 2026-10-05)

- **Q1 — Alcance de fixes:** los **11 hallazgos**, priorizados (los 4 de mayor impacto primero).
- **Q2 — Primer arranque:** **(a)** shell al instante + seeding en background, con loader por superficie (wrapper de ruta + estado de seeding; reusar `ui/Loader`).
- **Q3 — Fuentes:** **(a) self-host** (Oswald + Barlow en woff2 dentro de `public/fonts/` con `@font-face` + swap; se elimina `@import` y preconnects). **HECHO (`23e5800`).**
- **Q4 — Precache SW:** **(a)** podar a shell + runtime cache + sin SW en nativo (confirmado 2026-10-05).
- **Q5 — Splash:** quitar el mínimo artificial de 800 ms (auto-hide nativo).
- **Q6 — Re-auditoría:** **completa**, todas las superficies del inventario (orden por superficie más usada).
- **Q7 — Hallazgos de la re-auditoría:** **(b) no se arreglan en esta fase**; documentación accionable completa por hallazgo.
- **Q8 — Validación en teléfono físico (103.2):** **resuelta**.
- **Supuestos técnicos aceptados:** rest timer sin tick en el store; capa de datos de logros unificada en provider; hero sin preload incondicional; deferral compartido post-paint; home/tabs/getAll fixes técnicos; flujo worktree `f103` con review RDD por candidato; regla de componentes.

---

## Contexto — Auditoría F103 (2026-09-28, read-only, worktree f103)

### 103.2/103.3 — Estabilidad (cerrado, sin reproducción)
- El cuelgue reportado coincide con el bug histórico de `/suplementos` (`ReadOnlyError` de Dexie), corregido el 15/09: `b3ce311` + ErrorBoundary `117714f`.
- Barrido web de las 43 entradas del router (DB vacía) con `tests/e2e/test_f103_smoke.py`: 0 crashes / 0 errores (validado 2026-10-05 sobre main: 43/43 OK).
- Emulador (APK de entonces): `/suplementos` OK; arranques 8,9 s → 2,7/2,9 s; 0 ANR. Teléfono real: resuelto (Q8).

### 103.1 — Lentitud: 11 hallazgos (read-only)
**Arranque/update**
1. Reseed bloqueante en install/update (~2.294 filas + 520 KB de chunks + JSON 218 KB sin precachear; `providers.tsx`); primer arranque ~9 s.
2. Google Fonts `@import` render-blocking (`index.css`). **→ RESUELTO (`23e5800`).**
3. Precache del SW ~2.010 archivos / ~100 MB (`vite.config.ts`), también en WebView nativo.
4. Splash fijo de 800 ms (`capacitor.config.ts`).
5. Preload incondicional de `home-hero.jpg` (`index.html`).
6. Trabajo post-paint: logros / notificaciones / telemetría.

**Uso diario**
7. `workoutSets` 2× full scan por navegación + por guardado (`useAchievements.ts` + `EntrenarPage.tsx`).
8. Home: 8 tarjetas recomputando sobre el historial crudo por visita.
9. Rest timer F96 persiste la sesión completa ~1×/s (`RestTimer.tsx` + `activeWorkoutStore.ts`). **→ EN EJECUCIÓN (T5).**
10. `/estadisticas` sin lazy por tab (recharts + 4 tabs en el chunk de ruta).
11. `workouts.getAll()` ×3-5 en shell + N+1 del selector de día (F99).

---

## Hechos del recon (2026-10-05, read-only, worktree)

- **Reseed:** `Providers` bloquea en `ensureSeeded()` (spinner full-screen `providers.tsx:60-68`, duplica `ui/Loader`). Fast path por `seedVersion` sin chunks. ~2.300 filas en 6 stores. Chunks: reseeder 231 KB + catalogLoader 285 KB; fetch `/catalog/exercises-v2.json` (218 KB, no precacheado; fallback embebido 821). `SEED_VERSION = '23'`.
- **Fuentes:** `index.css:3` @import (Oswald 500/600/700 + Barlow 400/500/600/700); tokens `--font-display`/`--font-body`; `preconnect` `index.html:6-7`. → self-host hecho.
- **Precache:** glob `**/*.{js,css,html,ico,png,jpg,svg,webp,woff2}` + cap 5 MB → 1.995 entradas / ~102 MB (1.817 jpgs ≈ 97 MB). Sin `runtimeCaching`. SW también en WebView nativo.
- **Splash:** `launchShowDuration: 800`, sin `hide()`, sin simulación web.
- **Hero:** preload incondicional `index.html:8`; usado en `EntrenarPage.tsx:161-163` solo sin rutina con imagen propia.
- **Rest timer:** `reconcileRest()` `set()` por segundo (`activeWorkoutStore.ts:455-471`) + persist debounce 400 ms → re-serializa la sesión ~1×/s. `restEndsAt` ya se persiste y alcanza para sobrevivir el kill.
- **Scans de sets:** `useAchievements.ts:88-91` (host, 13 liveQueries) + `useAchievementProgress.ts:42-44` (`/logros`) + `useWorkoutSets`. `completed` no indexable; streaming F91 presente; digests + debounce 600 ms.
- **Post-paint:** `AppShell.tsx` monta AchievementsHost, `useNotificationScheduling` (2× getAll + timer 60 s), telemetría, health sync.
- **Inventario re-auditoría:** rutas nuevas = `/pasos`, `/logros`, `/progreso-fotos` (+`/comparar`), `/cuerpo`, `/objetivos`, `/wearables`, `/rutinas/planificador`, `/peso-corporal`, `/suplementos`; in-page = retos, chapas, tour, share card, carrusel, health sync, onboarding, notificaciones, reset; "viejas cambiadas" = home, sesión activa, estadísticas, timer, nutrición, rutinas. Orden: home → sesión → shell/logros → estadísticas → pasos → rutinas/planificador → fotos → resto.

---

## Diseño corto (T2) — los 4 fixes

Orden de ejecución: **T4 fuentes → T5 timer → T6 scans → T3 reseed** (menor blast radius primero; el reseed, cross-cutting, al final con el smoke como red).

**Fix 2 — T4 Fuentes self-host — HECHO (`23e5800`)**: 7 woff2 latin self-hosted en `public/fonts/`; 7 @font-face swap; sin @import ni preconnect; test invariante `tests/unit/styles/fontsSelfHosted.test.ts`; CHANGELOG.

**Fix 3 — T5 Rest timer (hallazgo 9)**
- Diseño: el tick de 1 s sale del store; `RestTimer` deriva de `restEndsAt` con tick local; el store solo `set` en transiciones (start/stop/reconcile de resume/rehydrate). Hook de countdown compartido si encaja. Revisar consumidores de `restRemaining`.
- TDD: unit store + componente (sin updates por tick); e2e `test_f96_timer.py`.
- Medición: writes a localStorage durante un descanso (1×/s → 1 por descanso).
- Blast radius: `activeWorkoutStore.ts`, `RestTimer.tsx`, posible hook + tests.

**Fix 4 — T6 Scans de `workoutSets`**
- Diseño: capa de datos de logros unificada en provider compartido (host global) que expone stats/progress; `/logros` deja de duplicar el fan-out. `useWorkoutSets` por pantalla; sin migración de schema; streaming conservado.
- TDD: unit digests/provider; e2e `test_f98_memo_isolation.py` + `test_f112_reconcile.py`.

**Fix 1 — T3 Reseed no bloqueante**
- Diseño (Q2a): shell al instante; seed en background una sola vez; `SeedingStatus` + wrapper de ruta con `ui/Loader`; hosts de datos montan en `ready`; lenguaje/settings independientes del seed; error recuperable con retry. Aceleración opcional: dynamic-import del fallback 821.
- TDD: unit gate; e2e smoke 43/43 + `test_preload_recovery.py` + medición CDP.

---

## Advisories / follow-ups

### Del review del smoke (T1, no bloqueantes)
- R3-reset-precondition (WARNING): reset de DB puede fallar sin tumbar el run.
- R3-reset-window-attribution (WARNING): buckets se limpian después del reset → errores descartados.
- R3-seed-observable-unasserted (WARNING): contador de suplementos sin assert.
- R3-summary-drift (SUGGESTION): conteo del resumen más laxo que el exit code.
- → Mejora futura del smoke (trabajo separado, como pide el envelope).

### Del review de fuentes (T4, no bloqueantes)
- R3-001 (WARNING, Oswald byte-idénticos): **RESUELTO POR DISEÑO** — verificado contra el CSS2 de Google: los tres pesos apuntan al mismo archivo variable (`...FmlWHYg.woff2`); paridad exacta con lo que servía el `@import`. Sin acción.
- R3-002 (SUGGESTION, el test no compara binarios): aceptada como limitación menor; sin acción en esta fase.

### Del review del rest timer (T5, no bloqueantes)
- R3-001 (WARNING): el test de integración falsea solo `setInterval`/`clearInterval`; queda un `setTimeout` real del persist (400 ms) que podría dispararse en tests posteriores (orden-dependencia). → follow-up de higiene de tests.
- R3-002 (WARNING): ventana de ≤1 s con restante 0 y `isResting` aún true (antes eran simultáneos); sin consumidor que detecte fin por `restRemaining === 0` — corte/campana siguen por transición. → vigilar si se agrega detección por 0.
- R3-003 (SUGGESTION): el test no renderiza el hook (solo el tick helper). → mejora de cobertura futura.

### Del review de la capa de logros (T6, no bloqueantes)
- R3-stale-now (WARNING, introducido): las stats del provider memoizan `now: new Date()` sin señal de tiempo en deps; el host consume ese memo en el efecto de reconciliación → una rerun por cambio de meta podría evaluar logros sensibles al tiempo con `now` viejo. → fix chico futuro: recomputar `now` al evaluar en el host.
- R3-ready-gate (WARNING, pre-existente): el gate `ready` no espera las queries de exercises/guides (categorías/muscles/guideCount) → posible reconciliación con mapas vacíos tras el debounce si re-corren. → fix futuro en el proveedor (único lugar donde centralizarlo).
- Nota: `test_f93_16_chapas.py` rojo pre-existente probado a HEAD (seed de logros sin datos que F112 reconcilia; fuera de alcance).

### Del review del reseed no bloqueante (T3, no bloqueantes)
- R3-001 (WARNING, introducido): si el arranque mínimo falla, `booted:true`+`error`; `retry()` no repite el arranque mínimo (puede llegar a ready sin aplicar idioma). → fix chico futuro en `seedingStore.prepare/retry`.
- R3-002 (WARNING, introducido): el import dinámico del fallback (821) no tiene catch; si el chunk falla, `loadCatalog` rechaza y el seed falla (modo nuevo). → evaluar guard.
- R3-003 (WARNING, introducido): el wait del smoke acepta texto del gate de ERROR (sin loader) como render de ruta → puede pasar con seed fallido. → endurecer en el pase de e2e.
- R3-004 (SUGGESTION): el test del gate no clickea reintento. → cobertura futura.

### Del review del arranque aligerado (T7, no bloqueantes)
- R3-001 (BLOCKER candidato → **refuted** por el refuter): `urlPattern` como función en workbox generateSW — falsa alarma: el build real emite la ruta `gymlab-images`. Sin acción.
- R3-002 (WARNING): `void registerServiceWorker()` descarta la promesa → posible unhandled rejection en web si el import/registro falla. → fix chico futuro (catch).
- R3-003 (SUGGESTION): el test de `DeferredMount` no renderiza en DOM para assertar children tras el idle. → cobertura futura.

### Del review de uso diario (T8, no bloqueantes)
- R3-lazy-tab-failure-path (WARNING): los tabs lazy agregan un failure path (chunk que no resuelve, p. ej. offline primera visita) que Suspense no captura; sin error boundary/retry local — depende del boundary ancestro. → evaluar fallback+retry por tab en un pase futuro.
- R3-shared-derivations-equivalence-unproved (SUGGESTION): los invariantes prueban el wiring, no la equivalencia de los valores compartidos. → cubierto por los tests de dominio (inyección) + e2e; mejora futura opcional.
- R3-notification-invariant-comment-coupling (SUGGESTION): el invariante cuenta tokens que también aparecen en comentarios del hook; funciona porque el helper del archivo descarta comentarios. → sin acción.

### Otros
- `test_perf.py` (e2e) pre-existente en rojo: el click «Más» (sin `force`) lo intercepta el overlay del tour F101 (test anterior a F101; el resto usa `force=True`). No es de fuentes (LCP preview 608 ms OK). Arreglar en el pase de e2e (p. ej. T11) agregando el descarte del tour.

---

## Tareas

- [x] **T0 — Setup y plan**: reset + tracker + PLAN.md ampliado (`c4fc5ba`).
- [x] **T1 — Smoke F103**: 43/43 dev; review `review-183270b053584aa3` approved + ack; commit `2fce948`; advisories arriba.
- [x] **T2 — Diseño corto (4 fixes)**: cerrado.
- [x] **T3 — Fix 1: reseed no bloqueante** (Q2a; shell al instante + seed en background): commit `c3e9421`; review `review-0e778f8a29852181` approved + ack; verificación: spot-check smoke 43/43, build exit 0, suite 117/1263, `test_f112_reset` ALL OK, `test_preload_recovery` ALL OK en preview; medición dev: shell ~514 ms vs contenido ~5,4 s (primer arranque), fast path 132/446 ms; advisories abajo.
- [x] **T4 — Fix 2: fuentes self-host** (Q3a): commit `23e5800`; review `review-b6b7a7507cce81a8` approved + ack; verificación: test 3/3, build exit 0, suite 113/1247, dist sin Google Fonts, preview LCP 608 ms; advisories arriba.
- [x] **T5 — Fix 3: rest timer sin persistir por tick** (hook `useRestCountdown` + tick local): commit `3951971`; review `review-99ed423dc38439de` approved + ack; verificación: spot-check 27/27, build exit 0, suite 114/1252, e2e `test_f96_timer.py` + `test_f93_t2_warmup_persist.py` ALL OK; advisories abajo.
- [x] **T6 — Fix 4: scans de `workoutSets`** (capa única `useAchievementsData`): commit `81faf35`; review `review-cba1356a2f7cf44e` approved + ack; verificación: invariantes 5/5 spot-check, build exit 0, suite 115/1257, e2e `test_f112_reconcile.py` + `test_f109.py` ALL OK (`test_f93_16_chapas.py` rojo pre-existente probado a HEAD); advisories abajo.
- [x] **T7 — Hallazgos restantes de arranque (precache/splash/hero/deferral)**: commit `1ad4fab`; review `review-26c3f65c45d3f2ff` approved + ack (con refuter: el BLOCKER candidato del `urlPattern` función quedó **refuted** — el build real emite `gymlab-images`); verificación: build exit 0, suite 119/1272, smoke 43/43, `test_cache` + `test_preload_recovery` (preview) OK, dist: precache **208 entradas / ≈4 MB** (antes ~1.995/102 MB), sin `registerSW.js`, guard nativo + limpieza legacy verificados en emulador (APK nuevo); advisories arriba.
- [x] **T8 — Hallazgos restantes de uso diario**: commit `d697eab`; review `review-a8e52f0717d29fa1` approved + ack; verificación: spot-check 19/19, build exit 0, suite 122/1287, smoke 43/43, `test_f99_home_layout` + `test_f98_memo_isolation` ALL OK; evidencias: racha 3×→1×, `groupSetsByExercise` 2×→1×, set de días 2×→1×, selector único con `Promise.all` (N+1 de F99 fuera), tabs lazy: chunk de ruta 107,18 kB → 4,58 kB (Recharts 345,57 kB en chunks lazy), notificaciones 1 lectura. Advisories abajo.
- [x] **T9 — Re-auditoría F91 completa de features nuevas** (Q6): 4 auditores read-only en paralelo (pasos/salud/notif; logros/extras; fotos/cuerpo/objetivos/peso; planificador/resto + regression sweep). **30 hallazgos**; sweep de fixes F103: limpio.
- [x] **T10 — Informe accionable (SIN fixes, Q7b)**: `docs/performance-audit-2026-10-05-features-nuevas.md` (evidencia/repro/impacto/fix/esfuerzo por hallazgo + prioridad y raíces compartidas); commit `fbc61ea` (con PLAN.md 103.4/103.5 [x]); Engram actualizado.
- [x] **T11 — Verificación final y cierre**: build exit 0; suite **122/1287**; smoke **43/43**; emulador API 37 (home + `/calculadoras/imc` multi-segmento, root=1, 0 pageerrors, sin FATAL en logcat); bookkeeping PLAN/CHANGELOG (`e7123e4`); **merge ff-only a main** (58 archivos, +2404/−502); worktree deregistrado + rama `f103` borrada. **Único resto:** carpeta `.worktrees/f103` con lock externo de Windows (handle sin proceso visible; probable watcher/AV) — contenido 100% mergeado; reintentar `Remove-Item .worktrees\f103 -Recurse -Force` en otra sesión. Nota: existe un ref remoto `origin/f103` (de un push previo); la rama local ya no existe.

## Progreso / evidencia

- 2026-10-05 — Worktree reseteado a main; tracker; recon (3 explore); grilling Q1–Q8.
- 2026-10-05 — T0/T1: PLAN.md (`c4fc5ba`); smoke 43/43 + review approved/ack + commit `2fce948`.
- 2026-10-05 — T2: diseño corto cerrado; orden T4→T5→T6→T3.
- 2026-10-05 — T4: fuentes self-host implementadas (writer), spot-check parent (test 3/3), review `review-b6b7a7507cce81a8` approved + ack, commit `23e5800`; Oswald 500/600/700 verificados como el mismo archivo variable de Google (paridad).
- 2026-10-05 — T5: rest timer con hook local implementado (writer), spot-check 27/27, review `review-99ed423dc38439de` approved + ack, commit `3951971`.
- 2026-10-05 — T6: capa única de logros (`useAchievementsData`, scan ×1) implementada (writer), spot-check 5/5, review `review-cba1356a2f7cf44e` approved + ack, commit `81faf35`; advisories arriba.
- 2026-10-05 — T3: reseed no bloqueante implementado (seedingStore/seeding/SeedingGate, hosts en ready, fallback dinámico), spot-check smoke 43/43, review `review-0e778f8a29852181` approved + ack, commit `c3e9421`; advisories arriba. **Los 4 fixes grandes quedan completos.**
- 2026-10-05 — T7: arranque aligerado (precache podado a ~4 MB + runtime cache + guard nativo con limpieza legacy; splash 0; hero sin preload; DeferredMount), review `review-26c3f65c45d3f2ff` approved + ack (con refuter), commit `1ad4fab`; advisories arriba.
- 2026-10-05 — T8: uso diario (home 3×→1× racha, 2×→1× agrupaciones, selector único con Promise.all; tabs lazy 107→4,6 kB con Recharts fuera del chunk de ruta; notificaciones 1 lectura), spot-check 19/19, review `review-a8e52f0717d29fa1` approved + ack, commit `d697eab`; advisories arriba. **★ Los 11 hallazgos de la auditoría F103 quedan completos.**
- 2026-10-05 — T9–T10: re-auditoría completa (4 auditores, 30 hallazgos, regression sweep limpio) + informe accionable `docs/performance-audit-2026-10-05-features-nuevas.md`; commit `fbc61ea`.
- 2026-10-05 — T11: verificación final (build 0, suite 122/1287, smoke 43/43, emulador OK) + bookkeeping (`e7123e4`) + **merge ff-only a main** + cierre del worktree (deregistrado, rama borrada; carpeta física pendiente por lock externo). **FASE COMPLETA.**

## Reglas (repo)

- Commits por tarea, sin push. Review RDD antes de cada commit (candidate = diff del workspace del worktree).
- Verificación: `npm run build` + `npm test` + e2e afectados (+ emulador si toca rutas/nativo).
- Un solo escritor; exploraciones read-only en paralelo. e2e con puerto propio (nunca 5173 si hay otra sesión).
- Skills: `codebase-memory`, `test-driven-development`, `verification-before-completion`, `systematic-debugging`, `receiving-code-review`, `webapp-testing`, `accessibility` (si UI), `chained-pr`/`work-unit-commits` si el volumen lo pide.
