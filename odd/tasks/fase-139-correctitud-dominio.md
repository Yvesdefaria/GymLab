# Fase 139 — Correctitud del dominio: bugs y contratos divergentes

> Rama `main`, sin push. Fase de **corrección**, no de rediseño. Todo el alcance es `src/domain` y sus tests.
> Origen: auditoría read-only de `/domain` del 2026-11-04 (106 archivos, 11.502 líneas). Medición objetiva con jscpd 5.4.2: 9 clones, 93 líneas duplicadas (0,81 %). La duplicación textual es baja; los problemas reales son de **semántica** y **contratos**.

## Origen (verbatim)

«todo lo que vayas encontrando que sea bug o este mal de alguna forma que requiera revision colocalo en una nueva fase con todo detalle para solucionarlo en otra sesion, despues de eso continua con el reporte» (2026-11-04).

## Specs

- **S1 — `pastComparison.weeklyVolume`**: normalizar por la longitud real de la ventana (`periodDays[period]`), no por 30 fijo. Con 3m debe dar el promedio semanal real; con 6m, idem. Test que pinche los tres períodos y el caso sin entrenos.
- **S2 — `detectDeloadSignal`**: agrupar con `weekStartKey` (lunes) y `localDate` como el resto del dominio; no usar `startedAt` ni `Date.now()` para la clave semanal. Test con dos entrenos un domingo que hoy caen en semanas distintas.
- **S3 — fecha local**: eliminar `toISOString().slice(0, 10)` de `deloadDayProgress` y de `isCheckedToday`; usar `toLocalDateStr`. Test con una fecha local que difiera de UTC (simulando el borde de medianoche).
- **S4 — contrato único del par semana actual/anterior**: un solo primitivo que devuelva `{ current, previous, deltaPct, tone }` con **una** semántica para `previous = 0`, consumido por `statsOverview`, `insights` y `weeklySummary`. Umbrales 5 / −10 en un solo lugar. Tests de los tres consumidores.
- **S5 — `groupSetsByExercise`**: un solo contrato o dos nombres explícitos. Hoy `domain/setStats` filtra series de trabajo y `hooks/useRecentLoadHistory` no. Decidir y documentar; actualizar call sites.
- **S6 — fuente única de elegibilidad**: `setStats` (dos funciones) y `pastComparison` deben usar `isWorkingSet` de `setFilters` en vez de repetir el predicado. Test de equivalencia con las tres implementaciones actuales.
- **S7 — racha diaria única**: extraer `longestDailyRun(dates)` y hacer que `achievementProgress` y `challenges` lo consuman. Test de equivalencia con ambos casos (todas las fechas vs fechas de un período).
- **S8 — sin doble cálculo en home**: `EntrenarPage` no debe recalcular el volumen semanal que ya devuelve `buildWeeklySummary`.
- **S9 — conteo semanal único**: `weeklyGoalProgress` debe reutilizar `workoutsInCurrentWeek` (mismo archivo).

## Hallazgos con evidencia

### 139.1 — `pastComparison.weeklyVolume` normaliza con 30 días fijos (P1, bug latente)

- **Dónde**: `src/domain/pastComparison.ts:41-49`, línea 47: `const days = Math.max(1, periodDays['1m'])`.
- **Qué pasa**: para `3m` la ventana es de 90 días y para `6m` de 180, pero se divide siempre por 30. El volumen semanal absoluto sale **3×** y **6×**.
- **Impacto visible**: nulo hoy. `PastSelfView.tsx:38-39` solo muestra `e1rmPct` y `volumePct`; el porcentaje se cancela porque numerador y denominador usan el mismo factor. El campo absoluto `current.weeklyVolume` / `past.weeklyVolume` queda mal y sin uso.
- **Cobertura**: no existe `tests/unit/domain/pastComparison.test.ts`. Nada lo pinche.
- **Fix**: `const days = Math.max(1, periodDays[period])`.
- **Test**: 1m/3m/6m con un volumen conocido por semana; verificar el absoluto y que el % no cambie.

### 139.2 — `detectDeloadSignal` usa una semana que empieza el domingo (P1, inconsistencia real)

- **Dónde**: `src/domain/progress.ts:15-19` (`isoWeekKey`), usado en `progress.ts:46`; `progress.ts:30` agrupa por `startedAt`; `progress.ts:37,42` usan `Date.now()`.
- **Canónico**: `dates.weekStartKey` (`dates.ts:37-42`) empieza el **lunes** y se usa en ~15 módulos.
- **Impacto**: el score de deload (`deload.ts:82` → `calcDeloadScore`) agrupa distinto que el resto de las métricas semanales. Dos entrenos un domingo pueden caer en semanas distintas y mover el `dropPct`.
- **Cobertura**: `tests/unit/domain/deload.test.ts:43-116` usa un entreno por semana; no lo detecta.
- **Fix**: usar `weekStartKey(localDateOf(w))` y `localDate`; el `now` debe ser fecha local (`toLocalDateStr(now)`), no `Date.now()`.
- **Test**: dos entrenos el mismo domingo + fixture de 6 semanas; comparar contra el agrupamiento lunes.

### 139.3 — `toISOString().slice(0,10)` en dos módulos de dominio (P1, viola la regla local-date)

- **Dónde**: `src/domain/deload.ts:166` (`deloadDayProgress`) y `src/domain/supplements.ts:25` (`isCheckedToday`, default `today`).
- **Regla del repo**: `dates.ts:3-4` documenta «usar local (no `toISOString`) evita cambios de día por la zona horaria»; F136 corrigió exactamente este patrón en frecuencia.
- **Impacto**: cerca de medianoche, `deloadDayProgress` puede saltar un día y `isCheckedToday` puede marcar el suplemento del día anterior/siguiente.
- **Fix**: `toLocalDateStr()` en ambos.
- **Test**: fijar una hora local cercana a medianoche con offset UTC distinto y verificar el día local.

### 139.4 — Tres contratos para el mismo cálculo semanal (P1, divergencia de producto)

- **Dónde**:
  - `statsOverview.buildVolumeHero` (`statsOverview.ts:36-40`): `previous = 0` → `deltaPct: null`.
  - `insights.computeWeeklyVolumeInsight` (`insights.ts:43-49`): `previous = 0` → `deltaPct: 100`, tono neutral.
  - `weeklySummary.buildWeeklySummary` (`weeklySummary.ts:84-86`): `previous = 0` y sin sesiones previas → `volumePct: 0`; con volumen actual → `100`.
- **Umbrales duplicados**: `insights.ts:17-18` y `weeklySummary.ts:86-87` (5 / −10).
- **Impacto**: el mismo usuario ve tres lecturas distintas del mismo «vs semana pasada» según la tarjeta. No es un crash, es una verdad inconsistente.
- **Fix**: primitivo `weekVolumeComparison(workouts, volumes, now)` con una semántica decidida y documentada; los tres consumidores lo usan. Mantener las APIs públicas actuales como adaptadores para no tocar UI.
- **Test**: un caso por cada consumidor con `previous = 0`, y el caso normal.

### 139.5 — `groupSetsByExercise`: mismo nombre, dos contratos (P2, trampa semántica)

- **Dónde**: `src/domain/setStats.ts:38-48` (filtra `completed && !isWarmup && weight>0 && reps>0`) y `src/hooks/useRecentLoadHistory.ts:36-46` (no filtra: todas las series).
- **Impacto**: un consumidor que importe el del hook esperando el del dominio (o al revés) obtiene resultados distintos sin error de tipos. El comentario del hook dice «series completas» (F122), así que el cambio de contrato es intencional, pero el nombre no lo dice.
- **Fix**: renombrar el del hook a `groupAllSetsByExercise` (o mover el filtro a `setFilters` y exponer `groupWorkingSetsByExercise`). Actualizar call sites.
- **Test**: un caso con warmups y peso 0 que demuestre la diferencia esperada en cada helper.

### 139.6 — `setStats` repite el predicado de `setFilters` (P2, riesgo de deriva)

- **Dónde**: `setStats.ts:23-33` (`avgE1rmInRange`) y `setStats.ts:62-72` (`avgE1rmInGroupRange`) repiten a mano `completed && !isWarmup && weightKg > 0 && reps > 0`, que es exactamente `isWorkingSet` (`setFilters.ts:12-15`). `pastComparison.ts:66-71` (`eligibleSets`) es la tercera copia.
- **Contradicción**: el comentario de `setFilters.ts:1-3` dice «Ningún consumidor debe repetir estos filtros».
- **Impacto**: si `isWorkingSet` cambia (p. ej. se agrega un criterio de duración), estas tres copias no cambian y las métricas divergen en silencio.
- **Fix**: usar `isWorkingSet` en las tres; conservar el orden de reducción para no alterar promedios.
- **Test**: equivalencia numérica de las tres implementaciones con un fixture que incluya warmups, peso 0, reps 0 e incompletos.

### 139.7 — Racha diaria duplicada (P2, duplicación exacta medida por jscpd)

- **Dónde**: `achievementProgress.ts:170-184` (`longestDailyWorkoutRun`) y `challenges.ts:198-209` (`longestDailyRunInPeriod`). Misma máquina `diffLocalDays === 1`.
- **Fix**: `longestDailyRun(dates: string[])` en `streak.ts` (o `dates.ts`), consumido por ambos.
- **Test**: equivalencia con las dos implementaciones actuales.

### 139.8 — Doble cálculo del volumen semanal en la home (P3, optimización)

- **Dónde**: `src/pages/EntrenarPage.tsx:175-181`. `weeklySummary.volume` ya es el volumen de la semana actual; además se llama `buildWeeklyVolumeSeries(workouts, volumes, 5).at(-1)?.volume ?? 0`.
- **Fix**: `const weeklyVolume = weeklySummary?.volume ?? 0`.
- **Test**: el existente de `homeSharedDerivations` / `homeDataSharing` alcanza; verificar que no cambia el valor.

### 139.9 — Conteo semanal duplicado (P3, simplificación)

- **Dónde**: `trainingStats.ts:186-193` (`weeklyGoalProgress`) recalcula el conteo que ya hace `trainingStats.ts:196-207` (`workoutsInCurrentWeek`).
- **Fix**: `weeklyGoalProgress` = `Math.min(1, workoutsInCurrentWeek(workouts, now) / weeklyGoal)`.
- **Test**: el existente de `trainingStats.test.ts` cubre ambos.

### 139.10 — Import CSV: ejercicios sin match quedan con ids huérfanos (P1, integridad de datos)

- **Dónde**: `importParsers.ts:79-86` (`resolveId` usa `hashCode(name)` cuando el resolver devuelve `null`) y `src/data/importWorkouts.ts:110-125` (persiste las series y recalcula PRs para `affectedExerciseIds`, que incluye esos ids).
- **Qué pasa**: una sesión con un ejercicio que no matchea el catálogo se guarda con `exerciseId = hashCode(nombre)`. Ese id no existe en `exercises`; las métricas que resuelven el ejercicio lo ignoran (`volumeModel.forEachVolumeSet`, `trainingStats.volumeByMuscleGroup`, 1RM) y el PR se persiste igual (`prRepo.upsert`) para un ejercicio inexistente.
- **Impacto**: datos huérfanos en IndexedDB; la sesión importada muestra menos ejercicios de los que trae el CSV (o `Ejercicio #<hash>`), y el usuario solo ve «N ejercicios sin coincidencia en el catálogo».
- **Cobertura**: `importParsers.test.ts:133` documenta el fallback, pero `importWorkouts.test.ts` no cubre el caso huérfano.
- **Decisión de producto necesaria**: (a) descartar las series sin match y reportarlas, (b) crear un ejercicio custom con el nombre, o (c) conservar el hash pero **nunca** persistir PRs de ids fuera del catálogo.
- **Fix mínimo aunque se elija (c)**: filtrar `affectedExerciseIds` contra el catálogo antes de tocar `prRepo`.
- **Test**: importar un CSV con un nombre desconocido y verificar que no quedan PRs huérfanos y que las series se descartan o se enlazan a un ejercicio real.

### 139.11 — `splitCsvLine` no soporta comillas escapadas ni campos multilínea (P2, parser CSV)

- **Dónde**: `importParsers.ts:34-48` (toggle en cada `"`) y `importParsers.ts:144` (`csv.trim().split('\n')`).
- **Qué pasa**: el estándar CSV escapa una comilla con `""`; acá el segundo `"` vuelve a abrir el bloque y las columnas se desplazan. Tampoco soporta un campo con salto de línea.
- **Impacto**: import corrupto silencioso (columnas mal asignadas) en exports con comillas o nombres multilínea.
- **Fix**: parser que soporte `""` y newlines entre comillas; tests con un nombre que contenga `"` y con un campo multilínea.

### 139.12 — `completed` se interpreta por desigualdad literal (P2, datos importados)

- **Dónde**: `importParsers.ts:176`: `completed: parts[hasSets ? 5 : 4] !== 'No'`.
- **Qué pasa**: cualquier valor distinto de `'No'` (incluidos `no`, `false`, `0`, vacío) cuenta como completado. Un export en minúsculas u otro idioma infla volumen y PRs.
- **Fix**: normalizar (`no|false|0|n` → `false`, `yes|true|1|s` → `true`) y tratar lo desconocido como error de línea; test por variante y verificación contra exports reales de las tres apps.

### 139.13 — Umbral de deload duplicado (P2, deriva de producto)

- **Dónde**: `profile.ts:66-70` (`deloadStatusKey`) hardcodea `60` y `40`; `deload.ts:10` exporta `DELOAD_SCORE_THRESHOLD = 60`.
- **Qué pasa**: si cambia el umbral real de deload, la etiqueta del perfil («bajo/medio/alto») y la sugerencia de activarlo divergen. El comentario de `profile.ts` dice «mismos umbrales que el copy largo», pero no hay fuente única.
- **Fix**: importar `DELOAD_SCORE_THRESHOLD` y exportar `DELOAD_SCORE_MEDIUM = 40` desde `deload.ts`; `deloadStatusKey` los consume.
- **Test**: `deloadStatusKey(60)` = alto y `calcDeloadScore` con score 60 → `suggestsDeload: true` en el mismo umbral.

## Mejoras no-bug (deuda declarada, no bloquean)

- **`requiredEquipmentOf`** (`routineResolution.ts:48-53`) no tiene consumidores: es un export muerto que reconstruye el mapa completo de equipamiento en cada llamada. Eliminarlo o documentar por qué se conserva.
- **«Peso más reciente» ×3**: `bodyProfile.latestWeightKg`, `bodyProgress.weightSummary.latest` y `pastComparison.latestWeight` repiten la búsqueda con filtros distintos (todo el historial / rango / ventana). Un primitivo `latestByDate(entries, range?)` los unifica.
- **Tipos de descanso**: `restRecommendation.ts` define `ExerciseCategory` y `TrainingGoal` locales que chocan con `types.ExerciseCategory` (strength/cardio/…) y `Objective`; `restCategoryMapper` ya los aliasa a `RestCategory`/`TrainingGoal`. Renombrar a `RestCategory`/`RestGoal` evita la trampa.
- **Top set por sesión ×2**: `loadRecommendation.sessionTopSet` y `workingProgression.summarizeSessions` calculan el máximo peso por workout; primitivo compartido.
- **`calendar.ts:24-41`**: `volumeByLocalDate` y `trainedLocalDates` repiten el mismo fallback `localDate → finishedAt → startedAt`; un `workoutLocalDate(w)` en `dates.ts` los unifica.
- **Ids con `Date.now()`**: `generateSmartPlan` (`autoPeriodization.ts:132`) y `createEmptyPlan` (`periodization.ts:46`) generan ids impuros; aceptar un `now` inyectable o un contador.
- **7 normalizadores de fecha**: `prs.prDateKey`, `challenges.dateKey`, `setStats.setLocalDate`, `dates.localDateOf`, inline en `progressNarrative.ts:68`, `supplements.ts:25-26`, `streak.ts:45-48`, `volumeModel.workoutLocalDay`. Un `dateKey()` único en `dates.ts` reduciría la familia; requiere revisar qué formatos acepta cada uno.
- **`roundTimer` ↔ `warmup`**: 3 clones (~32 líneas) de `toCountdown`/`mirror`/`startPhase`. `WarmupState` y `TimerState` comparten los campos del mirror; un helper genérico en `countdown.ts` los borra. Es el mayor clon textual del dominio; no es un bug.
- **`progress.ts`** tiene un solo consumidor (`deload.ts`); puede plegarse en `deload.ts` al corregir 139.2.
- **`achievementProgress.ts` (413 líneas)** concentra peso, pasos, comidas, PRs y cardio; split natural si crece.
- **`volumeByMuscleGroup` vs `muscleVolumeInPeriod`**: mismo cálculo con distinto filtro; helper compartido.
- **`calcDeloadScore`**: 4 pasadas sobre sets + 3 sobre workouts; candidato a una sola pasada.
- **Frontera de tipos**: `chartTokens.ts` importa `ThemeColors` de `@/hooks/useThemeColors` y `routines.ts` importa `RoutineDraft` de `@/data/repositories/types` (ambos `import type`). Mover el tipo al dominio o derivarlo.

## Criterios de aceptación

- `pastComparison.weeklyVolume` correcto para 1m/3m/6m, con test.
- `detectDeloadSignal` agrupa por lunes y fecha local, con test de domingo.
- `grep toISOString src/domain` solo devuelve el comentario de `dates.ts`.
- Un solo primitivo semanal; los tres consumidores comparten la semántica de `previous = 0` y los umbrales 5 / −10.
- `setStats` y `pastComparison` usan `isWorkingSet`; equivalencia numérica probada.
- `groupSetsByExercise` sin ambigüedad de contrato (renombrado o unificado).
- Racha diaria única con test de equivalencia.
- Home sin doble cálculo del volumen semanal.
- `npm test` verde y `npm run build` limpio; sin cambios de UI.

## Fuera de alcance

- Rediseñar métricas o agregar nuevas señales.
- Cambiar la UI de Estadísticas, Perfil o Home.
- Migrar datos persistidos.

## Riesgos

- **139.4** toca tres tarjetas visibles: la semántica de `previous = 0` cambia para al menos dos de ellas. Hay que decidir el contrato antes de codificar y validar en el teléfono.
- **139.2** puede mover el score de deload de usuarios reales; es esperable (es una corrección), pero conviene comparar antes/después con datos del RMX5085.
- **139.5** es un rename con call sites en hooks/páginas; el typecheck real (`npm run build`) lo cubre.
