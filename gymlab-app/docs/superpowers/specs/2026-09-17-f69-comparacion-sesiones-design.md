# F69 — Comparativa de sesiones (rediseño) (diseño)

> Fecha: 2026-09-17 · Estado: aprobado por el usuario · Fuente: `PLAN.md` F69 → «4. Futuras mejoras» (commit `ed393ae`) + rediseño visual.

## Contexto

`SessionComparison.tsx` compara dos sesiones y hoy muestra solo **fecha, duración, volumen y un delta**. Vive en el tab Historial del Perfil: `PerfilPage.tsx:97` → `HistorialTab` → `BestSessionCard` → `SessionComparison`.

Tres problemas verificados que motivan el rediseño:

1. **Deltas invertidos (bug).** `workoutRepo.getAll` devuelve **más reciente primero** (`workoutRepo.ts:7` = `orderBy('startedAt').reverse()`). El componente asigna `selectedA = workouts[0]` (nueva) y `selectedB = workouts[1]` (vieja), pero calcula `formatDelta(workoutB, workoutA)` y pinta verde con `workoutB.totalVolume > workoutA.totalVolume`: **si mejorás, muestra caída en rojo**. Además la columna izquierda es la más nueva, al revés de la lectura cronológica natural.
2. **Tipografía bajo el piso legible.** Usa `text-[0.55rem]` / `text-[0.6rem]` (≈ 8,8–9,6 px); el piso es 12 px.
3. **A11y, tokens y touch.** Grid de `<p>` sin semántica de tabla; `<select>` sin label accesible ni touch target de 44 px; `text-red-400` crudo en vez del token `text-danger`; una fila «Fecha» que **duplica** los headers.

## Decisiones aprobadas

1. **Orden cronológico y delta correcto**: la comparativa ordena por fecha (**anterior → posterior**) y `delta = posterior − anterior`. El bug queda cubierto por un test de regresión.
2. **11 métricas** comparables (ver tabla). **Calorías quedan FUERA**: no existe el dato persistido (`Workout`/`WorkoutSet` no tienen campo de kcal y `CardioTracker` las descarta al cerrar la serie). Se registra como pendiente separado en `PLAN.md`, con su alcance (modelar MET por ejercicio + `durationSeconds` + peso corporal).
3. **Intensidad media = kg por repetición** (`volumen / reps`). Es comparable entre sesiones de distinto tamaño y no premia series basura. Se descarta e1RM medio como definición de *intensidad* (se sigue mostrando como métrica propia).
4. **Sin radar** para grupos musculares: barras comparativas con valor visible.
5. **Sin spec de librerías nuevas**: se reutilizan helpers existentes.

## Métricas y definiciones

Filtro único y explícito, aplicado igual a las dos sesiones: **series de trabajo** = `completed && !isWarmup`. Todas las métricas se calculan sobre ese conjunto (no sobre `Workout.totalVolume` precalculado), para que ambos lados usen el mismo criterio.

| Métrica | Definición | Fuente |
|---|---|---|
| Volumen | Σ `weightKg × reps` de series de trabajo | `calcTotalVolume` (`volume.ts:10`) |
| Duración | minutos entre `startedAt` y `finishedAt` | `workoutDurationMin` (`workouts.ts:10`) |
| Series | nº de series de trabajo | derivado |
| Reps | Σ `reps` de series de trabajo | derivado |
| Ejercicios | `exerciseId` distintos | derivado |
| PRs logrados | PRs cuya fecha cae en la ventana ISO del workout | `countPrsInWorkout` (`prs.ts:18`) |
| Ejercicios nuevos | `exerciseId` de la sesión posterior ausentes en la anterior | derivado |
| Grupos musculares | volumen por `Exercise.muscleGroup`, orden desc | `volumeByMuscleGroup` (`trainingStats.ts:94`) |
| Intensidad media | `volumen / reps` (kg por repetición) | derivado |
| Peso medio por serie | `volumen / series` | derivado |
| e1RM medio | media de `estimate1RM(weightKg, reps)` | `estimate1RM` (`prs.ts:31`) |

**Tono del delta** (para no depender solo del color): `positive` en volumen, series, reps, ejercicios, PRs, intensidad, peso medio, e1RM cuando suben; `neutral` en duración, ejercicios nuevos y grupos musculares (subir no es intrínsecamente mejor).

## Arquitectura

### Dominio nuevo (puro, TDD) — `src/domain/sessionComparison.ts`

Sin React, sin Dexie. Ordena las sesiones por fecha y calcula todo:

```ts
export interface SessionMetrics {
  volume: number
  durationMin: number | null
  sets: number
  reps: number
  exercises: number
  prs: number
  intensity: number          // kg por repetición (0 si no hay reps)
  avgWeightPerSet: number
  avgE1rm: number
  muscleGroups: { group: MuscleGroup; volume: number }[]
}

export interface SessionComparisonResult {
  older: { workout: Workout; metrics: SessionMetrics }
  newer: { workout: Workout; metrics: SessionMetrics }
  newExercises: number
  sharedExercises: number
  deltas: Record<'volume' | 'sets' | 'reps' | 'exercises' | 'prs' | 'intensity' | 'avgWeightPerSet' | 'avgE1rm', { delta: number; pct: number | null }>
}

export const compareSessions = (input: {
  a: Workout; aSets: WorkoutSet[]
  b: Workout; bSets: WorkoutSet[]
  prs: PRRecord[]
  exerciseById: ReadonlyMap<number, Exercise>
}): SessionComparisonResult
```

- Ordena por `localDate` y, a igualdad, por `startedAt`.
- `pct` es `null` cuando el valor anterior es 0 (evita división por cero).
- Sesión sin series → todas las métricas en 0, sin `NaN`.

### UI

- `src/components/session/SessionComparison.tsx` — orquesta: selectores + carga de sets + `compareSessions` + render de bloques. Debe quedar **por debajo de ~200 líneas**; extraer lo presentacional:
  - `ComparisonMetricTable.tsx` (bloques + filas)
  - `MuscleGroupBars.tsx` (barras comparativas)
- `BestSessionCard.tsx` — pasa las props nuevas.
- `HistorialTab.tsx` — **`prs` ya está disponible** (línea 22): solo falta pasarlo.
- `PerfilPage.tsx` — añadir prop `exerciseById` (`new Map(exercises.map(e => [e.id, e]))`); el catálogo ya está cargado (línea 37).

### Datos

- Sets: `workoutSetRepo.getByWorkoutIds([a, b])` — **indexado por `workoutId`**, mismo patrón que `DeloadCard.tsx:54`. Cargar con `useLiveList` y guardar contra `undefined`.
- PRs: prop desde `HistorialTab`.
- Nombre de rutina en el header: `routineRepo.getById(workout.routineId)` por sesión (2 lecturas indexadas; no existe `getMany` en rutinas). Fallback si `routineId` es `null` → mostrar solo la fecha.
- Catálogo: prop `exerciseById` (da `name` y `muscleGroup`).

## Interfaz

- **Headers de columna**: nombre de rutina + fecha (`localDate`), no solo la fecha ISO (hoy es ambiguo si entrenás dos veces el mismo día).
- **Tres bloques**: *Carga* (volumen, series, reps, peso medio por serie) · *Intensidad* (intensidad media, e1RM medio) · *Alcance y progreso* (ejercicios, ejercicios nuevos, PRs, duración).
- **Grupos musculares**: sección aparte con barras comparativas y valor visible.
- **Deltas**: chip reutilizando `TrendBadge` (`components/stats/TrendBadge.tsx`) o el mismo lenguaje visual, **con signo explícito**; nunca solo color.
- **Selectores**: label accesible (`aria-label`), alto ≥ 44 px, texto ≥ 12 px.
- **Tokens del tema**: `text-danger` / `text-success` / `text-muted`, nunca colores Tailwind crudos.
- **Números**: formatear con `formatVolume` (k/M), no enteros largos.
- Eliminar la fila «Fecha» duplicada y el parámetro `inverse` muerto de `DeltaIcon`.
- **Estados**: menos de 2 sesiones → ya lo corta `BestSessionCard`; sesión sin series → mensaje de vacío por bloque, sin ceros engañosos.
- `prefers-reduced-motion` respetado (sin animaciones nuevas que lo ignoren).

## i18n

Bajo `compare` en `src/i18n/locales/{es,en}/stats.ts`: añadir `older`, `newer`, `blockLoad`, `blockIntensity`, `blockScope`, `sets`, `reps`, `exercises`, `newExercises`, `prs`, `intensity`, `avgWeight`, `avgE1rm`, `muscleGroups`, `noSets`, `selectA`, `selectB`. Eliminar las keys que queden sin uso (`date`, `delta`) verificando antes que ningún otro punto las consuma.

## Tests

- **Dominio (TDD, primero)**: `tests/unit/domain/sessionComparison.test.ts` — orden cronológico, **`delta = posterior − anterior`** (regresión del bug), exclusión de warmups y series no completadas, `reps = 0` → `intensity` sin `NaN`, sesión vacía, cálculo de ejercicios nuevos/compartidos, orden de grupos musculares por volumen.
- **E2E**: `tests/e2e/test_f69.py` con `tests/e2e/scripts/with_server.py` — abrir `/perfil`, tab Historial, verificar que la tarjeta renderiza ambos headers, cambiar una selección y que las métricas se actualicen; viewport mobile; **0 `pageerror`**.

## Fuera de alcance

- Calorías por sesión (requiere modelado nuevo; se anota como pendiente en `PLAN.md`).
- Cambios en el esquema Dexie, repositorios o tipos persistidos (no hace falta ninguna migración).
- `pastComparison.ts` (F69 «yo del pasado») no se toca.

## Verificación

`npx tsc --noEmit` (0 errores) · `npm run build` (exit 0) · vitest (sin regresiones) · e2e F69 (ALL OK) · ciclo de review de Gentle AI **antes** de commitear · commit sin push · `PLAN.md` F69 + `CHANGELOG.md`.

> Nota operativa: el worktree tiene WIP ajeno de F68 sin commitear. Stagear **solo archivos de F69** (nunca `git add -A`); `CHANGELOG.md` requiere hunk-split.
