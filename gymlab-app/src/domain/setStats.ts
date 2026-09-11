// Métricas de serie compartidas: fecha local y e1rm promedio en un rango de fechas.
// Unifica la lógica que se duplicaba en goalProjection, pastComparison y plateauDetector.
import type { WorkoutSet } from './types'
import { toLocalDateStr } from './dates'
import { estimate1RM } from './prs'

// Fecha local (YYYY-MM-DD) de una serie a partir de createdAt (tolera ISO completo o solo día).
export const setLocalDate = (s: { createdAt: string }): string =>
  s.createdAt.length >= 10 ? s.createdAt.slice(0, 10) : toLocalDateStr(new Date(s.createdAt))

// e1rm promedio en [start, end) de series completadas, sin calentamientos y con peso/reps válidos.
// `exerciseId` es opcional: solo filtra por ejercicio si se indica.
export const avgE1rmInRange = (
  sets: WorkoutSet[],
  start: string,
  end: string,
  exerciseId?: number
): number => {
  const inRange = sets.filter((s) => {
    const d = setLocalDate(s)
    return (
      (exerciseId === undefined || s.exerciseId === exerciseId) &&
      s.completed &&
      !s.isWarmup &&
      s.weightKg > 0 &&
      s.reps > 0 &&
      d >= start &&
      d < end
    )
  })
  if (inRange.length === 0) return 0
  const total = inRange.reduce((acc, s) => acc + estimate1RM(s.weightKg, s.reps), 0)
  return total / inRange.length
}

// Agrupa series por ejercicio en una sola pasada para que los cálculos por ejercicio
// no escaneen todo el historial en cada ventana. Solo entran series válidas para
// promedios; dentro de cada grupo se preserva el orden original (sumas idénticas).
export const groupSetsByExercise = (sets: WorkoutSet[]): Map<number, WorkoutSet[]> => {
  const byExercise = new Map<number, WorkoutSet[]>()
  for (const s of sets) {
    if (!s.completed || s.isWarmup || s.weightKg <= 0 || s.reps <= 0) continue
    const group = byExercise.get(s.exerciseId)
    if (group) group.push(s)
    else byExercise.set(s.exerciseId, [s])
  }
  return byExercise
}

// e1rm promedio en [start, end) sobre el grupo de un ejercicio: mismos criterios y
// mismo orden de reducción que avgE1rmInRange, por lo que el resultado es idéntico.
export const avgE1rmInGroupRange = (
  byExercise: Map<number, WorkoutSet[]>,
  exerciseId: number,
  start: string,
  end: string
): number => {
  const group = byExercise.get(exerciseId)
  if (!group) return 0
  const inRange = group.filter((s) => {
    const d = setLocalDate(s)
    return (
      s.completed &&
      !s.isWarmup &&
      s.weightKg > 0 &&
      s.reps > 0 &&
      d >= start &&
      d < end
    )
  })
  if (inRange.length === 0) return 0
  const total = inRange.reduce((acc, s) => acc + estimate1RM(s.weightKg, s.reps), 0)
  return total / inRange.length
}