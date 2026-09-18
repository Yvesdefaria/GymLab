// Comparativa de dos sesiones: ordena cronológicamente y calcula métricas y deltas.
// Dominio puro (sin React/Dexie): reutiliza los helpers de volumen, PRs, duración y músculo.
import type { BodyWeightEntry, Exercise, MuscleGroup, PRRecord, Workout, WorkoutSet } from './types'
import { calcTotalVolume } from './volume'
import { countPrsInWorkout, estimate1RM } from './prs'
import { workoutDurationMin } from './workouts'
import { volumeByMuscleGroup } from './trainingStats'
import { calcCalories, metForSlug } from './cardio'

export interface SessionMetrics {
  volume: number
  durationMin: number | null
  calories: number | null
  sets: number
  reps: number
  exercises: number
  prs: number
  intensity: number
  avgWeightPerSet: number
  avgE1rm: number
  muscleGroups: { group: MuscleGroup; volume: number }[]
}

export interface SessionComparisonResult {
  older: { workout: Workout; metrics: SessionMetrics }
  newer: { workout: Workout; metrics: SessionMetrics }
  newExercises: number
  sharedExercises: number
  deltas: Record<
    'volume' | 'sets' | 'reps' | 'exercises' | 'prs' | 'intensity' | 'avgWeightPerSet' | 'avgE1rm',
    { delta: number; pct: number | null }
  > & {
    // Calorías: puede faltar en una o ambas sesiones (sin peso o sin series temporizadas).
    calories: { delta: number | null; pct: number | null }
  }
}

// Serie de trabajo: mismo criterio para las dos sesiones (nunca calentamientos ni series sin completar).
const workingSets = (sets: WorkoutSet[]): WorkoutSet[] => sets.filter((s) => s.completed && !s.isWarmup)

// Peso corporal aplicable a una sesión: la última medición con fecha <= la de la sesión;
// si no hay ninguna anterior, la más antigua disponible. Sin mediciones válidas, null.
const weightForDate = (entries: BodyWeightEntry[], localDate: string): number | null => {
  const valid = entries.filter((e) => e.weightKg > 0)
  if (valid.length === 0) return null
  let before: BodyWeightEntry | null = null
  let earliest: BodyWeightEntry | null = null
  for (const entry of valid) {
    if (entry.localDate <= localDate && (before === null || entry.localDate > before.localDate)) {
      before = entry
    }
    if (earliest === null || entry.localDate < earliest.localDate) earliest = entry
  }
  return (before ?? earliest)?.weightKg ?? null
}

// Calorías estimadas de una sesión: MET del ejercicio × peso × duración, redondeando por serie.
// Sin peso o sin series temporizadas no hay estimación fiable: null (la UI muestra «—»).
const caloriesFor = (
  working: WorkoutSet[],
  weightKg: number | null,
  exerciseById: ReadonlyMap<number, Exercise>
): number | null => {
  if (weightKg === null) return null
  let total = 0
  let timedSets = 0
  for (const s of working) {
    const durationSeconds = s.durationSeconds ?? 0
    if (durationSeconds <= 0) continue
    const exercise = exerciseById.get(s.exerciseId)
    if (!exercise) continue
    total += calcCalories({ durationSeconds, metValue: metForSlug(exercise.slug), weightKg })
    timedSets += 1
  }
  return timedSets === 0 ? null : total
}

const metricsFor = (
  workout: Workout,
  working: WorkoutSet[],
  prs: PRRecord[],
  exerciseById: ReadonlyMap<number, Exercise>,
  bodyWeightEntries: BodyWeightEntry[]
): SessionMetrics => {
  const volume = calcTotalVolume(working)
  const reps = working.reduce((acc, s) => acc + s.reps, 0)
  const sets = working.length
  const validE1rm = working.filter((s) => s.weightKg > 0 && s.reps > 0)
  // volumenByMuscleGroup exige un workoutsById para validar la pertenencia de cada serie.
  const workoutsById = new Map([[workout.id, workout]])

  return {
    volume,
    durationMin: workoutDurationMin(workout),
    calories: caloriesFor(working, weightForDate(bodyWeightEntries, workout.localDate), exerciseById),
    sets,
    reps,
    exercises: new Set(working.map((s) => s.exerciseId)).size,
    prs: countPrsInWorkout(workout, prs),
    // kg por repetición: comparable entre sesiones de distinto tamaño (0 si no hay reps).
    intensity: reps === 0 ? 0 : volume / reps,
    avgWeightPerSet: sets === 0 ? 0 : volume / sets,
    // e1RM medio: solo series con peso y reps válidos para no diluir la media con ceros.
    avgE1rm:
      validE1rm.length === 0
        ? 0
        : validE1rm.reduce((acc, s) => acc + estimate1RM(s.weightKg, s.reps), 0) / validE1rm.length,
    muscleGroups: volumeByMuscleGroup(working, workoutsById, exerciseById).map(
      ({ muscle, volume: groupVolume }) => ({ group: muscle, volume: groupVolume })
    ),
  }
}

// Porcentaje de cambio sobre la base anterior; null si la base es 0 (no hay división por cero posible).
const deltaOf = (newer: number, older: number): { delta: number; pct: number | null } => ({
  delta: newer - older,
  pct: older === 0 ? null : ((newer - older) / older) * 100,
})

// Delta de una métrica que puede faltar en cualquiera de los dos lados: sin ambos valores, null.
const deltaOfNullable = (
  newer: number | null,
  older: number | null
): { delta: number | null; pct: number | null } =>
  newer === null || older === null ? { delta: null, pct: null } : deltaOf(newer, older)

export const compareSessions = ({
  a,
  aSets,
  b,
  bSets,
  prs,
  exerciseById,
  bodyWeightEntries,
}: {
  a: Workout
  aSets: WorkoutSet[]
  b: Workout
  bSets: WorkoutSet[]
  prs: PRRecord[]
  exerciseById: ReadonlyMap<number, Exercise>
  bodyWeightEntries: BodyWeightEntry[]
}): SessionComparisonResult => {
  // localDate identifica el día; startedAt desempata dos sesiones del mismo día.
  const aIsOlder =
    a.localDate === b.localDate ? a.startedAt <= b.startedAt : a.localDate < b.localDate
  const [olderWorkout, olderSets, newerWorkout, newerSets] = aIsOlder
    ? [a, aSets, b, bSets]
    : [b, bSets, a, aSets]

  const olderWorking = workingSets(olderSets)
  const newerWorking = workingSets(newerSets)
  const older = {
    workout: olderWorkout,
    metrics: metricsFor(olderWorkout, olderWorking, prs, exerciseById, bodyWeightEntries),
  }
  const newer = {
    workout: newerWorkout,
    metrics: metricsFor(newerWorkout, newerWorking, prs, exerciseById, bodyWeightEntries),
  }

  const olderIds = new Set(olderWorking.map((s) => s.exerciseId))
  const newerIds = new Set(newerWorking.map((s) => s.exerciseId))

  return {
    older,
    newer,
    newExercises: [...newerIds].filter((id) => !olderIds.has(id)).length,
    sharedExercises: [...newerIds].filter((id) => olderIds.has(id)).length,
    deltas: {
      volume: deltaOf(newer.metrics.volume, older.metrics.volume),
      sets: deltaOf(newer.metrics.sets, older.metrics.sets),
      reps: deltaOf(newer.metrics.reps, older.metrics.reps),
      exercises: deltaOf(newer.metrics.exercises, older.metrics.exercises),
      prs: deltaOf(newer.metrics.prs, older.metrics.prs),
      intensity: deltaOf(newer.metrics.intensity, older.metrics.intensity),
      avgWeightPerSet: deltaOf(newer.metrics.avgWeightPerSet, older.metrics.avgWeightPerSet),
      avgE1rm: deltaOf(newer.metrics.avgE1rm, older.metrics.avgE1rm),
      calories: deltaOfNullable(newer.metrics.calories, older.metrics.calories),
    },
  }
}
