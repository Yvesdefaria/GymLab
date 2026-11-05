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
- **S10 — import CSV sin huérfanos**: un ejercicio sin match no debe persistir series ni PRs con un id sintético; decidir descartar / crear custom / conservar sin PRs.
- **S11 — parser CSV robusto**: soportar comillas escapadas (`""`) y campos multilínea.
- **S12 — `completed` normalizado**: interpretar `no/false/0` y `yes/true/1`, no `!== 'No'`.
- **S13 — umbral de deload único**: `profile.deloadStatusKey` debe consumir las constantes de `deload.ts`.
- **S14 — plantillas rápidas correctas**: cada `nameKey` debe apuntar al `exerciseId` del ejercicio que describe; test por slug.
- **S15 — «volumen semanal» con una sola definición**: decidir rolling de 7 días vs semana calendario y alinear copy/cálculo.
- **S16 — score de recuperación coherente**: invertir/curvar `daysScore` para que más descanso suba el score, y corregir los tests que pinnean la inversión.
- **S17 — tarjeta de sesión sin calentamientos**: `sessionImage` no debe contar warmups en `sets`.
- **S18 — categoría de remos**: quitar `row` de `CARDIO_RE` (dejar `rowing`) y testear que los remos cuenten como fuerza/volumen.

## Orden recomendado de ejecución

1. **139.18** — remos como cardio: es el que más cambia números reales (volumen de espalda/hombro/trapecio).
2. **139.16** — score de recuperación invertido: señal de producto opuesta a su copy.
3. **139.10** — import CSV con ids huérfanos y PRs inexistentes: integridad de datos.
4. **139.14** — plantillas rápidas con ejercicios equivocados: contenido visible.
5. **139.1 / 139.2 / 139.3** — correctitud de fechas y ventanas.
6. **139.4 / 139.15** — contratos de «semana» y «volumen semanal» (requieren decisión de producto).
7. **139.5–139.9, 139.11–139.13, 139.17** — duplicación, parser, umbral, warmups.
8. Mejoras no-bug al final, solo si sobran ganas y review.

## Cómo retomar

```powershell
cd gymlab-app
git log --oneline -12
npm test
npm run build
```

- **Estado: 18/18 cerradas; fase cerrada (2026-11-05).** El handoff completo de la sesión del 2026-11-05 está en `odd/tasks/sesion-2026-11-05-f139.md`: decisiones tomadas, commits, verificación y avisos de review pendientes.
- No quedan tareas de la fase. Quedan follow-ups no bloqueantes (avisos de review) y la **auditoría asociada de 139.18** (`jump`/`run`/`ski`), que requiere decisión de producto antes de codificar.
- Para una fase nueva: leer `PLAN.md` y el handoff, y abrir el doc de fase correspondiente con el mismo patrón (spec → TDD → suite/build → review → commit → docs).

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

### 139.14 — Plantillas rápidas con ejercicios equivocados (P1, contenido visible)

- **Dónde**: `quickTemplates.ts`. El `nameKey`/`descriptionKey` describe un ejercicio y el `exerciseId` apunta a otro:
  - `full-body-stretch` «Postura del niño» → `1311` = **Inchworm** (`quickTemplates.ts:69`).
  - `pre-sleep-stretch` «Postura del niño» → `1754` = **Superman** (`:81`).
  - `pre-sleep-stretch` «Gato-vaca» → `1363` = **Rodilla círculos** (`:82`).
  - `joint-mobility` «Círculos de tobillo» → `1363` = **Rodilla círculos** (`:94`).
  - `pre-sleep-stretch` «Piernas arriba» → `1541` = **Elevaciones de piernas posterior** (`:83`).
  - `full-body-stretch` «Apertura de pecho» → `1754` = **Superman** (`:68`).
  - `full-body-stretch` «Rotaciones de cuello» → `1335` = **Isométrico cuello frontal** (`:70`); `joint-mobility` usa `1336` (laterales) para el mismo nombre (`:98`).
  - `joint-mobility` «Elevaciones laterales de pierna» → `1625`, un ejercicio de fuerza/glúteo, no movilidad (`:96`).
- **Por qué se ve**: `QuickTemplates.tsx:17-18` (`exerciseLabel`) prioriza el nombre del catálogo sobre el `nameKey`; la lista muestra el nombre real equivocado con la descripción del ejercicio pretendido.
- **Cobertura**: `quickTemplates.test.ts:19-25` solo valida `exerciseId > 0`; no verifica que el id corresponda al ejercicio descrito.
- **Fix**: elegir los ids reales del catálogo para cada entrada (revisión de contenido; algunas posturas no existen y requieren agregarlas o ajustar el copy) y agregar un test que fije el `slug` esperado por entrada.
- **Test**: mapa `templateId + nameKey → slug esperado`; falla si alguien cambia el id o el catálogo.

### 139.15 — «Volumen semanal» con dos definiciones (P2, inconsistencia de producto)

- **Dónde**: `workouts.ts:19-27` (`weeklyVolume`) suma los **últimos 7 días móviles** (`now - 7 días`). Lo usan `useWorkoutSummary.ts:26` y `PerfilPage.tsx:54`, con copy «Volumen sem.» / «Volumen semanal» (`core.ts:737,741`).
- **Contraste**: `statsOverview`, `weeklySummary`, `insights` y `weeklyVolume.ts` usan la **semana calendario lunes–domingo** (`weekStartKey`). El mismo rótulo muestra números distintos en Perfil/Home que en Estadísticas.
- **Fix (decisión)**: o se renombra el copy a «últimos 7 días» (si el rolling es intencional), o `weeklyVolume` pasa a `weekStartKey` para hablar el mismo idioma que el resto. Actualizar el test correspondiente.
- **Test**: un entreno del lunes anterior y otro de hace 6 días; el rolling y la semana calendario deben diferir y quedar pinneados.

### 139.16 — Score de recuperación invertido (P1, producto)

- **Dónde**: `recoveryScore.ts:43-44`:
  ```ts
  const daysScore = (days: number): number => Math.max(0, 100 - (days / 7) * 100)
  ```
  Con `daysSinceLastWorkout = 0` (entrenaste hoy) devuelve **100**; con 7+ días de descanso devuelve **0**.
- **Contradicción con el propio copy**: `help.ts:8-9` dice «tu último entreno (**días de descanso**)»; `RecoveryScoreCard` titula «¿Entreno hoy?» y clasifica `ready = Listo para entrenar`, `rest = Mejor descansa`. Más días de descanso deberían subir el score, no bajarlo.
- **Impacto**: el factor de días pesa **40 %** (el mayor). Tras una semana sin entrenar el score puede caer a «mejor descansa»; tras entrenar hoy puede decir «listo para entrenar». Es la señal opuesta a la que el usuario espera.
- **Cobertura**: `recoveryScore.test.ts` **pinnea la inversión** («daysSinceLastWorkout 0 = score máximo de días» y el caso `0 días + sueño 5 + dolor 5` = ready). Hay que corregir el test junto con la fórmula.
- **Fix (decisión de producto)**: invertir la rampa (`0 días = 0`, `7+ = 100`) o una curva que premie 1–2 días de descanso y baje después. Mostrar `breakdown.daysSince` en el desglose (hoy se oculta el factor más pesado).
- **Test**: 0 días → bajo; 3 días → medio; 7+ → 100; y un caso de clasificación con `0 días` que **no** sea `ready`.

### 139.17 — La tarjeta de sesión cuenta calentamientos como series (P2/P3)

- **Dónde**: `sessionImage.ts:57-64`: agrupa por ejercicio filtrando solo `!s.completed`; `sets: exSets.length` incluye los calentamientos completados. El `volume` de la misma tarjeta usa `volumeOf` (solo series de trabajo).
- **Impacto**: la imagen compartida dice «N series» contando calentamientos, mientras el volumen excluye esos sets. Inconsistente y sobreestima el trabajo real.
- **Fix**: filtrar también `!s.isWarmup` al agrupar (el máximo de peso no cambia porque el calentamiento es más liviano).
- **Test**: un ejercicio con 1 calentamiento + 3 series de trabajo → `sets: 3`.

### 139.18 — `detectCategory` clasifica los remos como cardio (P1, volumen)

- **Dónde**: `exerciseCategory.ts:5-6`: `CARDIO_RE` incluye `\brow\b`. `withCategory` se aplica al catálogo en `catalogLoader.ts:16,24` y en `reseeder.ts:67`.
- **Datos**: `public/catalog/exercises-v2.json` tiene **821 filas y 0 con `category`**, así que la categoría se infiere para todo el catálogo. Con `\brow\b`, quedan como `cardio`:
  - **23 de espalda**: `bent-over-two-dumbbell-row`, `inverted-row`, `seated-cable-rows` (plurales se salvan), `one-arm-kettlebell-row`, `t-bar-row-with-handle`, `suspended-row`, etc.
  - **4 de hombro**: `barbell-rear-delt-row`, `dumbbell-one-arm-upright-row`, `low-pulley-row-to-neck`, `smith-machine-one-arm-upright-row`.
  - **4 de trapecios**: `smith-machine-upright-row`, `standing-dumbbell-upright-row`, `upright-cable-row`, `upright-row-with-bands`.
- **Efecto**: `volumeModel.isStrengthWork` (`volumeModel.ts:69-71`) devuelve `false` para `cardio` y `forEachVolumeSet` **salta la serie**: los remos no cuentan en el volumen de espalda/hombro/trapecio. `cardioExercisesWithData` tampoco los muestra como cardio porque no tienen duración ni distancia. Quedan en tierra de nadie.
- **Interacción con F138**: el inventario de F138 midió `attributeVolume` directo y no chequeó `category`; la cobertura de pierna no se ve afectada, pero la de espalda sí queda subestimada en la ruta real.
- **Fix**: quitar `row` de `CARDIO_RE` (dejar `rowing` para la máquina) y agregar un test de catálogo: `bent-over-two-dumbbell-row` → `strength`, `barbell-rear-delt-row` → `strength`, `rowing-stationary` → `cardio`. Sumar un test de `countVolumeSets` con una serie de remo que cuente para espalda.
- **Auditoría asociada**: revisar los otros tokens anchos (`jump`, `run`, `ski`) contra el catálogo; hoy `incline-push-up-depth-jump` y `chest-push-with-run-release` quedan como cardio (aceptable si no se cuenta como fuerza, pero conviene decidirlo).

## Mejoras no-bug (deuda declarada, no bloquean)

- **`estimateWorkoutMinutes`** (`calendar.ts:117-124`): el comentario dice «margen por cambio de ejercicio» pero el código suma **1 minuto por serie** (`+ totalSets`). El test lo pinnea así (`calendar.test.ts:17`), o sea el comportamiento es intencional y el comentario está mal; corregir el comentario.
- **`quickTemplates`**: el campo `id` de cada ejercicio se repite (`'fe'`, `'ce'`, `'fs'`, `'ps'`, `'jm'`) y no se usa; el componente usa `exercise.exerciseId`. Eliminarlo o hacerlo único para evitar futuros keys duplicados.
- **Dos constantes de conversión kg↔lb**: `settings.ts:82-88` usa `2.20462` y `calculators/converter.ts:2` usa `KG_PER_LB = 0.45359237` (≈`2.20462262`). La diferencia es despreciable, pero son dos fuentes para la misma conversión; unificar en `converter` y que `settings` lo consuma.
- **`platesForWeight`** (`calculators/plates.ts:25-34`): si `available` incluye `0`, el `while (rest >= 0.0001)` encuentra `p = 0` para siempre y cuelga. Hoy no ocurre con `STANDARD_PLATES`, pero conviene filtrar `p > 0`.
- **`strengthStandards`** (`strengthStandards.ts:158-160`): el fallback `[0,0,0,0]` haría `elite`/percentil 100 a cualquier e1rm si faltara la tabla. Es inalcanzable con la unión cerrada de 4 ejercicios, pero el fallback debería ser `null`/error, no ceros.
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
- Cambiar la UI de Estadísticas, Perfil o Home (excepción: 139.16 agrega el factor «Descanso» al desglose existente de la tarjeta de recuperación; sin rediseño).
- Migrar datos persistidos (excepción aprobada: la migración Dexie v19 de 139.18, que solo corrige `category` en `exercises`).

## Riesgos

- **139.4** toca tres tarjetas visibles: la semántica de `previous = 0` cambia para al menos dos de ellas. Hay que decidir el contrato antes de codificar y validar en el teléfono.
- **139.2** puede mover el score de deload de usuarios reales; es esperable (es una corrección), pero conviene comparar antes/después con datos del RMX5085.
- **139.5** es un rename con call sites en hooks/páginas; el typecheck real (`npm run build`) lo cubre.

## Log

- **L1** — «todo lo que vayas encontrando que sea bug o este mal de alguna forma que requiera revision colocalo en una nueva fase con todo detalle para solucionarlo en otra sesion, despues de eso continua con el reporte» (2026-11-04). Ya citado en «Origen».
- **2026-11-04 — 139.18 cerrada.** `CARDIO_RE` ya no contiene `\brow\b`; solo `rowing` es cardio. Impacto medido sobre `public/catalog/exercises-v2.json`: **31 filas** pasan de `cardio` a `strength` (23 espalda, 4 hombro, 4 trapecios), exactamente la lista del hallazgo. Test nuevo `tests/unit/domain/exerciseCategory.test.ts` (15 casos): detección por slug, categoría inferida sobre el seed embebido y una serie de remo que cuenta en `direct.espalda`. RED→GREEN observado: 13 fallos antes del fix, 15/15 después. Suite completa **234 archivos / 2136 passed + 1 skipped**; `npm run build` limpio. Review nativo `review-36368ebba039d306` (lens `review-reliability`): **approved**, 2 sugerencias no bloqueantes (fixture con cast sin assert; cobertura explícita del campo `name`, que el test de catálogo ya cubre). Assess post-commit: `medium / under_budget` (`review_due: false`). Commit `84613486`.
- **2026-11-04 — 139.18, migración v19 (decisión A).** La categoría se persiste en Dexie al sembrar, así que el fix de `CARDIO_RE` no alcanzaba a instalaciones existentes. Se agregó `src/data/migrations/reclassifyRowExercises.ts` y `db.version(19).upgrade(...)`: solo cambia `cardio → strength` (la categoría que devuelva el heurístico actual) en filas que (a) ya están `cardio`, (b) tienen el token suelto `row` en nombre/slug/externalId, y (c) el heurístico nuevo ya no marca cardio. No toca `rowing-stationary`, cardio sin token (`bicicleta`, `treadmill`), filas sin categoría, rutinas ni workouts. Tests: 9 casos (nombre-only, plural `rows`, «sigue siendo cardio» e idempotencia). Verificador independiente `gentle-ai-verify`: PASS 7/7 invariantes, sin bloqueantes. Review nativo `review-7acea0d0a8eeef27` (lenses `review-risk` + `review-reliability`): **approved**; 2 WARNING no bloqueantes — el upgrade de Dexie no se ejecuta en la suite (no hay `fake-indexeddb`) y el término `externalId` del haystack no tiene fixture (con snake_case real es inalcanzable). Commits `c75a657d`, `57109c8c`. CHANGELOG actualizado al quedar limpio el archivo (la sesión concurrente del soft-404 commiteó primero).
- **2026-11-04/05 — 139.16 cerrada (decisión A: rampa lineal invertida).** `daysScore` pasa de `100 - (días/7)*100` a `(días/7)*100` con clamp 0..100: 0 días = 0, 3 = 43, 7+ = 100. El desglose de `RecoveryScoreCard` muestra el factor «Descanso» (40 %, antes oculto); claves `home.recovery.daysSince` en es/en. Tests: 21 (se corrigieron los que pinneaban la inversión; caso nuevo 0 días + sueño/dolor/racha máximos = 60 → `maybe`). Suite 236 archivos / 2167 passed + 1 skipped; build limpio. Review `review-54a6d19f681b434a` (readability + reliability): **approved**; 3 avisos no bloqueantes (títulos de test que dicen «días» en vez de «score», falta test de render del nuevo factor y el caso de clamp no fija el headline score/ready). Commit `b37f84d0`.
- **2026-11-05 — 139.10 cerrada (decisión A: descartar series sin match).** `buildParsedImport` resuelve por grupo: si el resolver devuelve `null`, cuenta la serie en `discardedSets` y no la emite; una sesión sin series resueltas no se crea. `ParsedImport` expone `discardedSets` y el resumen de Ajustes lo reporta además de `unmatched`. Sin resolver se conserva el fallback `hashCode` (compatibilidad). Tests: parser (sesión mixta, sesión descartada, sin resolver) y fixture de `importWorkouts`. Suite 236 archivos / 2168 passed + 1 skipped; build limpio. Review `review-8eb3075f82022e53` (readability + reliability): **approved**; 4 avisos no bloqueantes: (1) `resolver(name)` no normaliza `undefined` a `null` como hacía el baseline — un resolver fuera del tipo podría emitir `exerciseId: undefined`; (2) falta test del import con todas las series sin match; (3) falta test del mensaje de la UI; (4) falta fijar los ids cuando se descarta una sesión entera. Commit `10a7104e`. Los huérfanos ya persistidos por imports viejos quedan fuera de alcance (limpieza destructiva aparte).
- **2026-11-05 — 139.14 cerrada (decisión A: ajustar a lo que existe).** Ocho entradas corregidas: childPose→1148 (childs-pose), catCow→1134 (cat-stretch, copy «Estiramiento de gato»), ankleCircles→1019, chestOpener→1062 (behind-head-chest-stretch), neckRoll→1150 (chin-to-chest-stretch, copy «Estiramiento de cuello»), legsUp→1383 (leg-up-hamstring-stretch, copy «Estiramiento de isquiotibial»), y en joint-mobility sideLegRaises→1617 (shoulder-circles, «Círculos de hombro»). Se agregó la clave faltante `hipCircles`. Test nuevo `templateId + nameKey → slug` sobre el seed curado + ampliado (7 tests). Suite 236 archivos / 2169 passed + 1 skipped; build limpio. Review `review-2e9ea30444ef9b95` (readability + reliability): **approved** (los dos relays fallaron una vez con `relay_unavailable` y entraron al reintentar); 4 avisos no bloqueantes: (1) las claves `neckRoll`/`catCow`/`legsUp` ya no describen el movimiento — renombrarlas en una limpieza; (2) el test es unidireccional (no detecta una entrada eliminada); (3) el mapa de ids puede colisionar silenciosamente si el seed ampliado redefine un id curado; (4) los ids quedan como literales opacos. Commit `fcbbd7d0`.
- **2026-11-05 — 139.1 cerrada.** `weeklyVolume` normaliza por `periodDays[period]` (30/90/180). Test nuevo `pastComparison.test.ts`: un entreno de 3000 da 700 / 233 / 117. RED observado (3m daba 700). Commit `c1574ace`.
- **2026-11-05 — 139.2 cerrada.** `detectDeloadSignal` usa `localDateOf`, `weekStartKey` (lunes), ventanas locales de 21/42 días y `now` inyectable. Test de domingo + lunes anterior en la misma semana (2000 vs 1000 con el agrupamiento viejo). RED observado. Commit `3ec5e377`.
- **2026-11-05 — 139.3 cerrada.** `deloadDayProgress` usa `diffLocalDays(toLocalDateStr(), until)`; `isCheckedToday` usa fecha local y normaliza el ISO UTC que persiste la UI (`checkedLocalDate`). Test de borde en `timezoneEdge.test.ts` con TZ −03 y guard de offset. RED observado en ambos. Review del rango `review-026dcf094cec207f` y review del fix `review-cebb2e9555401037`: el refuter corroboró `R3-TZ-UTC-PREFIX` (CRITICAL: un test fijaba el prefijo UTC esperado y fallaba en un runner UTC), se corrigió en `bd13f2ed` y el validador aprobó; autoridad quemada. Suite 238 archivos / 2176 passed + 1 skipped; build limpio; `grep toISOString src/domain` solo devuelve comentarios. Commits `21269848`, `0ad6b2cf`, `bd13f2ed`.
- **2026-11-05 — 139.4 y 139.15 cerradas (decisión A).** `compareWeekVolume` (`src/domain/weekVolume.ts`) es el contrato único: semana calendario, `deltaPct` null y tono neutro con `previous = 0`, umbrales 5/−10 en un solo lugar. `statsOverview.buildVolumeHero`, `insights.computeWeeklyVolumeInsight` y `weeklySummary.buildWeeklySummary` lo consumen; `deltaPct`/`volumePct` pasan a `number | null` y `InsightCard` maneja el null. `workouts.weeklyVolume` pasa de rolling de 7 días a semana calendario. Tests nuevos: `weekVolume.test.ts`, `insights.test.ts`, `weeklySummary.test.ts`; `workouts.test.ts` actualizado. RED observado en los tres consumidores (100 vs null; 7500 vs 3500). Suite 241 archivos / 2184 passed + 1 skipped; build limpio. Review `review-d757472a52d7cc7a` (reliability): **approved**; 3 avisos no bloqueantes: falta el borde exacto de −10 % y neutros cerca de umbral, falta el caso «semana previa con sesiones y volumen 0» y no se afirman las claves `currentWeekKey`/`previousWeekKey`. Commits `df085ecd`, `deb7badd`.
- **2026-11-05 — 139.5 a 139.9 cerradas (bloque de duplicación).** `groupAllSetsByExercise` distingue el agrupador del hook (todas las series) del de dominio (solo trabajo); `isWorkingSet` quedó como única definición en `setStats` (×3) y `pastComparison`; `longestDailyRun` se extrajo a `streak.ts` y lo consumen `achievementProgress` y `challenges`; `EntrenarPage` usa `weeklySummary.volume`; `weeklyGoalProgress` usa `workoutsInCurrentWeek`. RED observado en el rename, la racha diaria y el guard de la home; los tests de equivalencia de 139.6 pinnean el comportamiento previo. Suite 241 archivos / 2192 passed + 1 skipped; build limpio. Review `review-9c3d3e6e67173dd4` (readability + reliability): **approved**; avisos no bloqueantes: el guard de 139.8 es un regex de código fuente y falta un test conductual de equivalencia del volumen (semana vacía, solo semanas previas, borde de semana), el campo devuelto sigue llamándose `setsByExercise`, `longestDailyWorkoutRun` es un forwarder de una línea y falta el caso de un solo día en `longestDailyRun`. Commits `1c2ec1ac`, `11140fe9`, `92a391f7`, `2f4d2c42`, `e42606a3`.\n- **2026-11-05 — 139.11 a 139.17 cerradas; fase 18/18.** Parser CSV por registros (comillas escapadas, multilínea), `completed` normalizado y desconocido = error de línea; `DELOAD_SCORE_MEDIUM`/`DELOAD_SCORE_THRESHOLD` compartidos con `profile.deloadStatusKey`; `sessionImage` ya no cuenta calentamientos. Suite 241 archivos / 2197 passed + 1 skipped; build limpio. Review `review-0116e1cdaf57d2d9` (risk + reliability): **approved**; avisos no bloqueantes: una comilla sin cerrar consume el resto del archivo (antes el estado se reseteaba por línea), una celda `completed` vacía pasa a ser error (antes se importaba como true), falta el caso de ejercicio con solo warmups y los errores de archivos multilínea reportan el ordinal de registro, no la línea física. Commits `97dc96d3`, `d28bf66e`, `3f7d8e9d`.\n- **Decisión pendiente (auditoría asociada de 139.18)**: `jump`, `run` y `ski` siguen siendo tokens anchos; `incline-push-up-depth-jump` y `chest-push-with-run-release` quedan como cardio y no aportan volumen de pecho. No se tocó porque requiere decisión de producto.
