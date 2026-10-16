// Hook de historial de carga reciente (F97.4): UNA consulta acotada a nivel de página
// (ventana de fechas) y UNA lectura por lote de sus series, agregadas en memoria a
// Map<exerciseId, promedioKg>. Sigue el patrón de `useBodyWeight`/`DeloadCard.recentIds`
// y evita lecturas por bloque (N+1).
import { useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { workoutRepo, workoutSetRepo } from '@/data/repositories'
import { recentTopSetAverage } from '@/domain/loadRecommendation'
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import type { WorkoutSet } from '@/domain/types'

// Ventana temporal de historial: 90 días acotan la consulta sin clonar la tabla completa.
export const RECENT_HISTORY_DAYS = 90

// Agrupa las series por ejercicio y promedia su top set reciente (función pura, testeable).
export const aggregateRecentLoadAverages = (
  sets: WorkoutSet[],
  n?: number
): Map<number, number> => {
  const byExercise = new Map<number, WorkoutSet[]>()
  for (const s of sets) {
    const group = byExercise.get(s.exerciseId)
    if (group) group.push(s)
    else byExercise.set(s.exerciseId, [s])
  }
  const averages = new Map<number, number>()
  for (const [exerciseId, group] of byExercise) {
    const avg = recentTopSetAverage(group, n)
    if (avg > 0) averages.set(exerciseId, avg)
  }
  return averages
}

// Agrupa las series por ejercicio preservando el orden de entrada (función pura, testeable).
// F122: alimenta la propuesta del día (base/evidencia/freno necesitan las series completas).
export const groupSetsByExercise = (sets: WorkoutSet[]): Map<number, WorkoutSet[]> => {
  const byExercise = new Map<number, WorkoutSet[]>()
  for (const s of sets) {
    const group = byExercise.get(s.exerciseId)
    if (group) group.push(s)
    else byExercise.set(s.exerciseId, [s])
  }
  return byExercise
}

// Promedio de top set reciente por ejercicio, consultado una sola vez a nivel de página
// y repartido como prop a los bloques de ejercicio. F122: además expone las series
// agrupadas por ejercicio para la propuesta del día (escalada/freno).
export const useRecentLoadHistory = (): {
  loadAverages: Map<number, number>
  setsByExercise: Map<number, WorkoutSet[]>
} => {
  const cutoff = useMemo(() => addLocalDays(toLocalDateStr(), -RECENT_HISTORY_DAYS), [])
  const workouts = useLiveList(() => workoutRepo.getSinceDate(cutoff), [cutoff])
  const workoutIds = useMemo(() => workouts.map((w) => w.id), [workouts])
  const sets = useLiveList(() => workoutSetRepo.getByWorkoutIds(workoutIds), [workoutIds])
  const loadAverages = useMemo(() => aggregateRecentLoadAverages(sets), [sets])
  const setsByExercise = useMemo(() => groupSetsByExercise(sets), [sets])
  return { loadAverages, setsByExercise }
}
