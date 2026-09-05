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