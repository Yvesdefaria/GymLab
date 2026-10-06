# Re-auditoría F91 — superficies nuevas y cambiadas (F103 / T9–T10)

**Fecha:** 2026-10-05
**Alcance:** segunda pasada estilo F91 (read-only) sobre las superficies **nuevas** (F94–F119) y las **viejas cambiadas**, más un regression sweep de los fixes de F103.
**Método:** 4 auditores read-only en paralelo (pasos/salud/notif · logros/extras · fotos/cuerpo/objetivos/peso · planificador/resto + sweep). Evidencia estática con `archivo:línea`; sin builds ni escrituras.
**Base:** `docs/performance-audit-2026-09-11.md` (F91) y los fixes de F103 (`c4fc5ba`…`d697eab`: reseed no bloqueante, fuentes self-host, precache podado, splash, hero, deferral post-paint, capa única de logros, home dedupe, rest timer, tabs lazy, notificaciones 1 lectura).
**Decisión del usuario (Q7b):** esta re-auditoría **NO se arregla en F103**; este informe es la documentación accionable para la sesión que la tome.
**Regression sweep:** LIMPIO — todos los fixes de F103 siguen vigentes; sin regresiones ni duplicaciones nuevas en home, sesión activa, `/estadisticas`, `/timer` y `/nutricion`.

**Total: 30 hallazgos** en 12 superficies. Ninguno es un crash; 1 es un leak real (A3), el resto duplicaciones de lecturas y cómputos acotables.

---

## Prioridad sugerida (para la sesión de fixes)

1. **Leak real (1):** A3 (animación anime.js sin cleanup al desmontar el modal de logros).
2. **Lote "duplicaciones de lecturas" (12, esfuerzo S):** P1, N1, A5, S1, S2, PH-2, CB-1, OB-1, PC-2, PLAN-3, CAR-2, H3. Todos comparten la misma raíz: **páginas/hooks que re-declaran liveQueries que el proveedor único de logros ya corre** (o entre sí). Candidato natural: una capa de "read models" consumida desde `useAchievementsData()` + queries `count()/hasAny()` livianas.
3. **Cómputos y acotado (S–M):** A1, A2, A4, PLAN-1, PLAN-2, T1, T2, H1, H2, P3.
4. **Mejoras mayores (M/L):** PH-1 (blobs fuera de IndexedDB), PH-3 (timeline de fotos sin virtualizar), CAR-1 (reconciliación por tecla en el carrusel), ONB-1/ONB-2 (wizard montado global + lógica duplicada), P2 (split del memo monolítico de stats).

---

## /pasos

### P1 — Doble scan completo de `dailySteps` (S)
- **Evidencia:** `src/hooks/useStepData.ts:20` + `src/hooks/useAchievementsData.tsx:98`; ambos montados en `src/pages/StepsPage.tsx:24,28`.
- **Qué pasa:** /pasos corre dos liveQueries independientes sobre toda la tabla (`orderBy('localDate').toArray()`), una vía `useStepData` y otra vía el proveedor global de logros (que ya expone `stepDays`).
- **Impacto:** cada escritura de pasos (registro manual o tick de salud) despierta dos scans completos; duplicación entre consumidores.
- **Repro:** sembrar varios días de `dailySteps`, abrir /pasos, registrar un día; ambas liveQueries re-consultan.
- **Fix:** derivar today/week/month/streak de `useAchievementsData().stepDays` (mover también `goal`), o hacer que `useStepData` acepte entries; eliminar el `getAll` propio.
- **Esfuerzo:** S

### P2 — Re-derivación monolítica por cada escritura de pasos (M)
- **Evidencia:** `src/hooks/useAchievementsData.tsx:147-164` (deps incluyen `stepDays`) → `src/domain/achievementProgress.ts:182-305`; escrituras en `src/data/stepsSync.ts:63-69` y `src/hooks/useStepData.ts:52`.
- **Qué pasa:** cada escritura de `dailySteps` invalida una derivación única sobre todo el historial (sets/workouts/meals/weights/photos) y cambia el value del contexto → re-render de todos los consumidores aunque solo lean `savedIds`.
- **Impacto:** con /pasos abierto y caminando (tick de 3 s), re-derivación completa + re-render por tick; escala con el historial.
- **Repro:** nativo con permiso, /pasos abierto; React Profiler muestra `deriveAchievementStats` por tick.
- **Fix:** dividir el memo de stats por familias (memo de pasos separado del de entrenos/comidas/peso; combinar al final); opcionalmente partir el contexto.
- **Esfuerzo:** M

### P3 — Re-render por tecla del chart/heatmap de /pasos (S)
- **Evidencia:** `src/pages/StepsPage.tsx:30-31,89-99` → `src/components/steps/StepWeekChart.tsx:36` (buildWeekSeries + Recharts sin memo) y `StepHeatmap.tsx:34,98` (buildHeatmapGrid + `t()`/Intl por celda, sin memo).
- **Qué pasa:** tipear en el formulario re-renderiza toda la página; el chart reconstruye su data y el heatmap sus 42 celdas + labels.
- **Impacto:** trabajo por tecla innecesario en /pasos.
- **Repro:** abrir /pasos, tipear 12345 con el profiler: 5 renders del padre incluyendo chart y heatmap.
- **Fix:** `React.memo` en StepWeekChart/StepHeatmap (props estables al tipear) y/o `useMemo` de series/celdas.
- **Esfuerzo:** S

## Health sync

### H1 — Backfill secuencial con doble lectura por día (M)
- **Evidencia:** `src/data/stepsSync.ts:54,61-70`; `src/data/repositories/dexie/stepRepo.ts:36-52`.
- **Qué pasa:** el rango de 90 días se procesa secuencialmente; cada día cambiado cuesta un `getByDate` + un `upsert` que **re-lee** la fila y escribe en su propia transacción (≈180 roundtrips + 90 transacciones).
- **Impacto:** primer sync de cientos de ms a segundos; amplifica P1/P2 (cada write despierta las liveQueries).
- **Repro:** nativo recién instalado, permiso con 90 días de datos; cronometrar; o unit-run con bridge stub de 90 samples.
- **Fix:** un `stepRepo.getRange(from,to)` indexado a un Map, merge en memoria y **un solo bulk write**; como mínimo pasar el día ya leído al `upsert`.
- **Esfuerzo:** M

### H2 — Tick de 3 s con checks nativos y metas aunque nada cambie (S)
- **Evidencia:** `src/hooks/useHealthSync.ts:18,42-47,74-77`; `src/data/healthSyncController.ts:57-70`; `src/data/stepsSync.ts:39-61`.
- **Qué pasa:** con /pasos visible en nativo, cada tick resuelve el bridge, llama `isAvailable()` + `checkPermission()`, lee `healthLastSyncAt` y `getStrideLengthCm` aunque el día no cambió.
- **Impacto:** wake-up de batería/CPU cada 3 s con trabajo evitable.
- **Repro:** nativo con permiso, /pasos abierto, loguear llamadas por tick estando quieto.
- **Fix:** cachear availability/permiso/stride por sesión o al foreground; en ticks automáticos saltar los checks tras el primer éxito.
- **Esfuerzo:** S

### H3 — El host de salud escanea workouts+routines completos para un booleano (S)
- **Evidencia:** `src/hooks/useHealthSyncHost.ts:19,23` → `src/hooks/useOnboardingStatus.ts:13-14` (`workoutRepo.getAll()` + `routineRepo.getAll()`); `workoutRepo.ts:7` clona todas las filas.
- **Qué pasa:** el host global evalúa `workoutCount > 0` leyendo ambas tablas enteras (routines ni se usa).
- **Impacto:** tercer scan de workouts del boot (junto al proveedor de logros y notificaciones), crece con el historial.
- **Repro:** bootear app sembrada y ver las lecturas de `workouts`/`routines` antes de visitar /pasos.
- **Fix:** query liviana (`count()`/`limit(1)`) en el repo para un hook pequeño, o gate por meta persistida; quitar routines del camino.
- **Esfuerzo:** S

## Notificaciones

### N1 — Duplicación residual de `workouts.getAll()` en el shell (S)
- **Evidencia:** `src/hooks/useNotifications.ts:101` vs `src/hooks/useAchievementsData.tsx:75`; `src/components/layout/AppShell.tsx:32-36,79-89` (DataHosts monta FUERA del `AchievementsDataProvider`).
- **Qué pasa:** tras T8 quedan **dos** lecturas completas de `workouts` montadas app-wide (proveedor + notificaciones), más la de H3.
- **Impacto:** dos clones de tabla en boot y dos liveQueries despertadas por cada escritura.
- **Repro:** bootear y contar liveQueries sobre `workouts` (2 simultáneas + H3).
- **Fix:** mover `DataHosts` dentro del `AchievementsDataProvider` (renderiza null, sin impacto de layout) y consumir `workouts`/`streak` del contexto en `useNotificationScheduling`.
- **Esfuerzo:** S

## Achievements (/logros, chapas, capa única)

### A1 — `countEverCompletedChallenges` O(días × sets) en cada escritura (M)
- **Evidencia:** `src/hooks/useAchievementsData.tsx:147-164`; `src/domain/achievementProgress.ts:280-289`; `src/domain/challenges.ts:290-317`.
- **Qué pasa:** itera cada día distinto (workouts, PRs, pasos) y corre `computeChallengeStats` (4 duraciones) por día; cada pasada re-escanea sets/workouts/pasos.
- **Impacto:** O(días × sets) en main thread por cada write (sesión, comida, paso, peso, foto) y en boot; cientos de ms con un año de historial.
- **Repro:** sembrar ~1 año de pasos + cientos de sets, registrar una comida; medir el long task; o benchmark con 300+ fechas.
- **Fix:** (a) cortar en `done.size >= 1` (el único consumidor, `primer-reto`, tiene target 1) o aceptar `limit`; (b) persistir el conteo monótono en meta; (c) mover la medida al efecto con debounce.
- **Esfuerzo:** M

### A2 — `maxPrDeltaKg` ordena todo por ejercicio con `new Date()` (S)
- **Evidencia:** `src/domain/achievementProgress.ts:219-242`.
- **Qué pasa:** filtra todas las series, agrupa y ordena cada grupo por fecha (`new Date(createdAt)`) en cada recomputación.
- **Impacto:** O(S log S) + allocations en el mismo hot path que A1.
- **Repro:** benchmark con ~5k series en ~40 ejercicios.
- **Fix:** una pasada por ejercicio (primera serie y pico), sin sort.
- **Esfuerzo:** S

### A3 — LEAK: animación del modal de logros sin cleanup (S) ⚠️ el único urgente
- **Evidencia:** `src/components/achievements/AchievementModal.tsx:81-92`.
- **Qué pasa:** el pulso de medalla es un anime.js con `loop: true`; el efecto solo pausa la instancia previa al cambiar `index` y no retorna cleanup → al desmontar (cerrar el modal) queda un rAF infinito contra un nodo desconectado, acumulándose por cada desbloqueo.
- **Impacto:** drenaje de CPU/batería permanente; medible en frames idle tras varios desbloqueos.
- **Repro:** desbloquear 2 logros, cerrar cada modal, perfilar frames idle / instancias activas.
- **Fix:** cleanup `() => pulseRef.current?.pause()` (o `anime.remove(...)`) — mismo patrón que `src/hooks/useChartEntry.ts:63-69`.
- **Esfuerzo:** S

### A4 — Firma de cambios sin memo en `useAchievements` (S)
- **Evidencia:** `src/hooks/useAchievements.ts:91-118`.
- **Qué pasa:** construye `stepDaysDigest`, `mealProteinByDayDigest`, `meals.reduce`, `workouts.map` en cada render, sin memo; el host re-renderiza por navegación y por contexto.
- **Impacto:** O(steps + meals + workouts) de CPU por navegación, creciendo sin límite.
- **Repro:** navegar con 1+ año de pasos/comidas y perfilar renders del host.
- **Fix:** `useMemo` de la firma sobre los arrays fuente.
- **Esfuerzo:** S

### A5 — Consumidores que aún duplican lecturas del proveedor (M)
- **Evidencia:** `src/pages/StepsPage.tsx:24` + `useStepData.ts:20` vs `useAchievementsData.tsx:98`; `src/pages/PerfilPage.tsx:32-34` vs `useAchievementsData.tsx:75-76,136`.
- **Qué pasa:** /pasos lee `dailySteps` 2×; /perfil lee `workouts`/`prs` 2× y recalcula `calcStreak` 2×.
- **Impacto:** scans, suscripciones y derivaciones dobles en esas páginas (se solapa con P1).
- **Repro:** Dexie query logging en /pasos y /perfil.
- **Fix:** consumir `stepDays`/`workouts`/`prs`/`streak` del contexto de logros (selector hook).
- **Esfuerzo:** M

## Tour / coach marks

### T1 — Listener de scroll sin throttle que re-renderiza por evento (S)
- **Evidencia:** `src/components/tour/useTourAnchor.ts:50-51,104,106-107`.
- **Qué pasa:** con un paso activo, un listener capture de scroll llama `measure()` (getBoundingClientRect + setState con objeto nuevo) en **cada** evento; además un interval de 250 ms durante toda la vida del paso.
- **Impacto:** jank al scrollear durante el tour.
- **Repro:** iniciar el tour en /logros y scrollear; el overlay re-renderiza por evento.
- **Fix:** rAF-throttle + bailout si el rect no cambió (ref con el último); cortar el interval cuando el ancla está conectada.
- **Esfuerzo:** S

### T2 — `getJson` de tips vistos en cada navegación + metas duplicadas (S)
- **Evidencia:** `src/components/tour/SectionTipHost.tsx:26-28,61-67`; `src/components/tour/TourHost.tsx:10-12`.
- **Qué pasa:** cada navegación a una sección hace un `metaRepo.getJson` keyed aunque el tip ya se vio; las 3 claves de tour se suscriben dos veces con hooks separados.
- **Impacto:** roundtrip IDB por navegación para siempre; 6 meta liveQueries re-corriendo por write.
- **Repro:** navegar repetido entre Inicio/Rutinas/Logros con logging de meta.
- **Fix:** leer `SECTION_TIPS_SEEN` reactivo para saltear visto; compartir las 3 metas en un solo hook/contexto.
- **Esfuerzo:** S

## Share card de sesión

### S1 — Doble `useWorkout(workoutId)` en el detalle (S)
- **Evidencia:** `src/components/workout/WorkoutDetail.tsx:40` vs `src/hooks/useSessionPhotoData.ts:17`.
- **Qué pasa:** dos suscripciones idénticas al mismo workout + sets.
- **Impacto:** queries y arrays duplicados, doble re-render por write en el histórico.
- **Repro:** abrir `/entrenamiento/:id` y contar ejecuciones.
- **Fix:** pasar `workout`/`sets` a `useSessionPhotoData` o izar el hook.
- **Esfuerzo:** S

### S2 — `prRepo.getAll()` completo por detalle de sesión (S–M)
- **Evidencia:** `src/hooks/useSessionPhotoData.ts:37,41`.
- **Qué pasa:** carga toda la tabla de PRs por montar el detalle para contar PRs dentro de la ventana del workout.
- **Impacto:** lectura completa por página y por write de prs.
- **Repro:** abrir cualquier detalle de histórico.
- **Fix:** query de PRs acotada a la ventana, o persistir el conteo/ids al guardar.
- **Esfuerzo:** S–M

## /progreso-fotos

### PH-1 — El proveedor materializa TODAS las fotos base64 solo para `length` (S / L a largo plazo)
- **Evidencia:** `src/hooks/useAchievementsData.tsx:101`; `src/domain/achievementProgress.ts:300`; `src/data/repositories/dexie/progressPhotoRepo.ts:6`; `src/lib/photoCapture.ts:56-57,77`; `src/domain/types.ts:392-400`.
- **Qué pasa:** el proveedor global corre `progressPhotoRepo.getAll()` (hasta 3 data URLs 800px q0.8 por día) y solo usa `photos.length`; cada write de foto re-deriva el bag completo.
- **Impacto:** todas las rutas deserializan y retienen la tabla entera de fotos (decenas de MB con ~90 días), retrasa el gate `ready`, y re-deriva por guardado.
- **Repro:** 1-3 meses × 3 ángulos/día; heap snapshot en cualquier ruta.
- **Fix:** (1) lectura liviana para logros (count o keys); (2) a futuro, blobs a Filesystem + thumbnails en IDB (migración L).
- **Esfuerzo:** S ahora / L con migración de storage

### PH-2 — Doble `getAll` de fotos en /progreso-fotos (S)
- **Evidencia:** `src/hooks/useProgressPhotos.ts:5` + `useAchievementsData.tsx:101` (Dexie crea un Observable por llamada: `dexie-react-hooks`).
- **Qué pasa:** la página/compare abren una segunda query idéntica a la del proveedor.
- **Impacto:** duplica deserialización y memoria de la tabla más pesada de la app.
- **Repro:** 50+ días de fotos; abrir /progreso-fotos con Memory panel.
- **Fix:** renderizar desde `useAchievementsData().photos`; dejar `useProgressPhotos` solo para mutaciones.
- **Esfuerzo:** S

### PH-3 — Timeline sin virtualizar con imágenes full-res (M)
- **Evidencia:** `src/pages/ProgressPhotosPage.tsx:45,178-208,202`; `src/lib/photoCapture.ts:56-57,77`.
- **Qué pasa:** renderiza todo el timeline de una — hasta 3 `<img>` data-URL full-res por día, sin paginar/virtualizar ni thumbnail (se muestra a 80px pero la fuente es 800px); el sort re-aloca por render.
- **Impacto:** 100+ días → DOM con cientos de imágenes y bitmaps decodificados → jank y riesgo de reload del WebView.
- **Repro:** 50 fechas de fotos, scroll completo con Performance panel.
- **Fix:** paginar/virtualizar (patrón `WeightHistoryTimeline` PAGE_SIZE) y/o thumbnail persistido; `content-visibility: auto` en cards.
- **Esfuerzo:** M

#### /progreso-fotos/comparar — LIMPIO (solo renderiza las 2 imágenes elegidas; su único costo es PH-2).

## /cuerpo

### CB-1 — Lecturas completas propias + scan lineal, con proveedor ya montado (M)
- **Evidencia:** `src/pages/CuerpoPage.tsx:21-23,26-30`; `useWorkoutSets.ts:7`; `workoutSetRepo.ts:17`; `useWorkouts.ts:8`; `muscleFatigue.ts:24-32`; `useAchievementsData.tsx:75,79-81`.
- **Qué pasa:** la página declara sus propias lecturas full de workouts y sets (incompletos incluidos) mientras el proveedor ya tiene workouts y el stream de completados; `lastTrainedByMuscle` escanea lineal en render y re-corre con cada set.
- **Impacto:** dos lecturas extra + O(sets) en main thread al montar, creciendo con el historial.
- **Repro:** historial grande + Performance panel en /cuerpo.
- **Fix:** consumir `workouts`, `completedSets` y `exerciseMuscles` del contexto y adaptar `lastTrainedByMuscle` para recibir el mapa muscular.
- **Esfuerzo:** M

## /objetivos

### OB-1 — Doble catálogo + clon completo de series (S)
- **Evidencia:** `src/pages/ObjetivosPage.tsx:17-18`; `src/components/goals/GoalSetter.tsx:22`; `GoalProjectionCard.tsx:108-112`; `useWorkoutSets.ts:7`; `useExerciseCatalog.ts:32` (×2); `goalProjection.ts:26`; `useAchievementsData.tsx:79-81,114`.
- **Qué pasa:** la ruta monta `useExerciseCatalog()` dos veces y `useWorkoutSets()` (todas las series) con el proveedor montado; `groupSetsByExercise` por defecto se recalcula en cada edición de objetivo.
- **Impacto:** dos clones de catálogo (~1.1k filas) + clon de sets por visita.
- **Repro:** /objetivos con historial grande; editar un objetivo y ver re-lecturas.
- **Fix:** izar un `useExerciseCatalog` y pasar por props; alimentar la proyección con `completedSets` del proveedor.
- **Esfuerzo:** S

## /peso-corporal

### PC-1 — Rango "Todo" sin cota con punto por día (S)
- **Evidencia:** `src/pages/PesoCorporalPage.tsx:128`; `BodyWeightChart.tsx:24,40-46,71-72,101`; `AnimatedCharts.tsx:18-19`.
- **Qué pasa:** "Todo" mapea cada entrada a un punto del chart con `dot r=4` y animación al cambiar el conteo; sin cap ni downsampling (el default 30 días sí está acotado).
- **Impacto:** 365-1000+ puntos → un círculo SVG por día; jank al montar/animar en gama baja.
- **Repro:** sembrar 400+ pesos, abrir /peso-corporal, tocar "Todo".
- **Fix:** ocultar dots arriba de un umbral (`dot={data.length > 180 ? false : ...}`) y/o agregar semanal en rango 0.
- **Esfuerzo:** S

### PC-2 — Doble `getAll` de peso corporal (S)
- **Evidencia:** `src/hooks/useBodyWeight.ts:10` + `useAchievementsData.tsx:100` + `PesoCorporalPage.tsx:24`.
- **Qué pasa:** la página corre la query full que el proveedor ya tiene.
- **Impacto:** bajo (filas chicas) pero mismo patrón de duplicación.
- **Repro:** abrir /peso-corporal y ver ambas suscripciones.
- **Fix:** leer `bodyWeights` del contexto; dejar `useBodyWeight` solo para mutaciones.
- **Esfuerzo:** S

## /rutinas/planificador

### PLAN-1 — Fan-out de getDays/getItems por rutina al generar (S)
- **Evidencia:** `src/pages/PlanificadorPage.tsx:97-102`.
- **Qué pasa:** al "Generar", dos `Promise.all` de ~70 `getDays` + ~221 `getItems` indexados, materializando todo el árbol de rutinas en la página; la query re-corre con cualquier invalidación mientras `generated`.
- **Impacto:** latencia de varios cientos de ms en gama baja + spike de memoria.
- **Repro:** perfilar el click en /rutinas/planificador.
- **Fix:** `routineRepo.getAllDays()/getAllItems()` (dos `toArray`) y agrupar en memoria.
- **Esfuerzo:** S

### PLAN-2 — `requiredEquipmentOf` reconstruido por rutina (S)
- **Evidencia:** `src/domain/routineResolution.ts:17-32` llamado desde `PlanificadorPage.tsx:109-111`.
- **Qué pasa:** por rutina re-filtra todos los días y escanea TODOS los items (~150k ops); el mapa no está memoizado aparte.
- **Impacto:** CPU extra en cada recomputo (incluye cambios de idioma).
- **Repro:** mismo click; cambiar idioma con el resultado abierto.
- **Fix:** una pasada: mapa día→rutina + iteración única de items acumulando equipos; `useMemo` propio.
- **Esfuerzo:** S

### PLAN-3 — Doble suscripción a `routines` (S)
- **Evidencia:** `PlanificadorPage.tsx:66-67` + `useRoutines.ts:38-47`.
- **Qué pasa:** `useRoutines()` y `useRoutineSlugs()` suscriben cada uno `db.routines.toArray()`; los slugs solo se usan en `save()`.
- **Impacto:** doble observer + doble lectura; re-render del wizard por cambios de slug.
- **Repro:** Dexie logging en /rutinas/planificador.
- **Fix:** derivar `allSlugs` de `routines` con `useMemo`; eliminar `useRoutineSlugs` de esa página.
- **Esfuerzo:** S

## /wearables — LIMPIO (placeholder estático; sin queries ni listeners).

## /suplementos — LIMPIO (seed único por promesa de módulo; filtro O(n) trivial).

## Onboarding

### ONB-1 — Wizard montado app-wide con suscripciones plenas aunque esté oculto (M)
- **Evidencia:** `src/components/onboarding/Onboarding.tsx:79-81,158-159`; `useOnboardingStatus.ts:13-15`; `AppShell.tsx:101-103`.
- **Qué pasa:** con el seed listo, `Onboarding` queda montado siempre y sus hooks corren **antes** del early-return de `done`: `workoutRepo.getAll()` + `routineRepo.getAll()` (status) + segundo `routineRepo.getAll()` (slugs) + catálogo completo, suscritos toda la sesión aunque no renderice.
- **Impacto:** 3 suscripciones full-table de más que despiertan por cada write y re-renderizan algo oculto.
- **Repro:** completar onboarding, escribir un workout y ver re-firing de los queriers del wizard oculto.
- **Fix:** gate barato (`meta.onboardingDone` + `count()`) que lazy-monte el cuerpo solo si va a renderizar; derivar slugs de la lista cargada.
- **Esfuerzo:** M

### ONB-2 — Lógica planificador/onboarding duplicada textualmente (S)
- **Evidencia:** `Onboarding.tsx:115-155` vs `PlanificadorPage.tsx:97-132` (comentarios idénticos).
- **Qué pasa:** el mismo fan-out + `requiredEquipmentOf` + `planRoutine` copiado en dos consumidores.
- **Impacto:** doble mantenimiento; PLAN-1/PLAN-2 existen dos veces; riesgo de divergencia.
- **Repro:** diff de ambos bloques.
- **Fix:** extraer `useRoutineEquipmentData(enabled)` / `useRoutinePlan(request)` compartido (regla de componentes).
- **Esfuerzo:** S

## Carrusel de sesión

### CAR-1 — Reconciliación O(sesión) por tecla (M)
- **Evidencia:** `src/pages/EntrenamientoPage.tsx:148-168`; `SessionCarousel.tsx:52,78-84,110-125,138-164`; `activeWorkoutStore.ts:367-378`.
- **Qué pasa:** cada tecla produce nuevo array `exercises` → el `memo` del carrusel no aguanta: recomputa `groupExercises`/`uniqueGroupKeys`, reconstruye el Map de completitud (con `isGroupComplete` por grupo) y re-engancha el listener de scroll, con todos los slides montados.
- **Impacto:** overhead por tecla que escala con el tamaño de la sesión (10+ ejercicios en gama baja).
- **Repro:** sesión con 10+ ejercicios, tipear peso con Performance panel.
- **Fix:** (a) memoizar un `Slide` por grupo con comparador sobre identidades; (b) firmar el efecto de completitud con un string de completitud en vez de `groups` por identidad.
- **Esfuerzo:** M

### CAR-2 — N × `useSettings` (uno por ExerciseBlock montado) (S)
- **Evidencia:** `ExerciseBlock.tsx:116-120` → `useLoadSuggestion.ts:24` → `useSettings.ts:14-17`; `useActiveSession.ts:69`.
- **Qué pasa:** cada bloque montado corre su propia liveQuery de settings (misma clave meta) además de la de página.
- **Impacto:** N suscripciones duplicadas a una clave; cada write de settings re-renderiza todos los bloques.
- **Repro:** sesión con 10 ejercicios; contar suscriptores de `SETTINGS_META_KEY`.
- **Fix:** pasar `showLoadSuggestion`/`loadProgressionPct` (ya leídas en `useActiveSession`) por props.
- **Esfuerzo:** S

## Regression sweep (fixes F103) — LIMPIO

Verificado en código que se sostienen: reseed no bloqueante (`app/seeding.tsx:17-24`, `AppShell.tsx:76-100`); fuentes self-host (`index.css:7-61`); SW sin jpgs + runtimeCaching (`vite.config.ts:81-87,120-140`); splash 0 (`capacitor.config.ts:16-22`); hero whitelist + fetchPriority (`HeroCard.tsx:37`); deferral de hosts (`DeferredMount.tsx:30-39`, `AppShell.tsx:84-88,98-100`); capa única de logros (`useAchievementsData.tsx:74-105`); home dedupe (`EntrenarPage.tsx:83-84,120,154`); rest timer local (`useRestCountdown.ts:37-51`, `RestTimer.tsx:48-50`); tabs lazy (`EstadisticasPage.tsx:9-22,65-75`); notificaciones 1 lectura (`useNotifications.ts:100-104`). Flujo de arranque de sesión (`useSessionPreload.ts:13`, `workoutSetRepo.ts:30-39` batched) y `/timer`/`/nutricion` sin duplicación nueva.

## Raíces compartidas (para el diseño del pase de fixes)

- **Duplicación de lecturas:** la misma raíz en P1, N1, A5, PH-2, CB-1, OB-1, PC-2, PLAN-3, H3 — páginas/hooks que re-declaran liveQueries ya cubiertas por el proveedor único de logros o entre sí. Candidato: capa de "read models" (`useAchievementsData` + `count()/hasAny()` livianos) antes de micro-optimizar cómputos.
- **Hot paths de achievements:** A1/A2/A4 comparten el memo monolítico (ver P2 para el split).
- **Failures de cleanup:** A3 es el único leak; el patrón correcto ya existe en `useChartEntry.ts:63-69`.

**Fin del informe.**
