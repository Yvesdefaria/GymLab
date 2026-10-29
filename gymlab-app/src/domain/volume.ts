// Cálculos de volumen de entrenamiento (kg × reps) y formato compacto para cifras grandes.
import type { VolumeSet } from './types'
import { isCompletedSet, isWorkingSet, type SetLike } from './setFilters'

// Mapa id de workout → volumen de entrenamiento (solo series de trabajo).
export type VolumeByWorkout = ReadonlyMap<number, number>

export interface WorkoutSetLike extends SetLike {
  workoutId: number
}

export const buildVolumeByWorkout = (sets: WorkoutSetLike[]): Map<number, number> => {
  const map = new Map<number, number>()
  for (const set of sets) {
    if (!isWorkingSet(set)) continue
    map.set(set.workoutId, (map.get(set.workoutId) ?? 0) + calcSetVolume(set))
  }
  return map
}

// Volumen de un workout: derivado de las series; si no hay entrada en el mapa,
// cae al campo legacy `totalVolume` (filas viejas o seeds sin series).
export const volumeOf = (
  workout: { id: number; totalVolume?: number },
  volumes: VolumeByWorkout
): number => {
  const derived = volumes.get(workout.id)
  return derived !== undefined ? derived : (workout.totalVolume ?? 0)
}

// Volumen de una serie: peso × repeticiones.
export const calcSetVolume = (set: VolumeSet): number => {
  return set.weightKg * set.reps
}

// Volumen de entrenamiento: solo series de trabajo (sin calentamiento).
// Es la única fuente para home, estadísticas, comparador y progresión.
export const calcTotalVolume = (sets: SetLike[]): number => {
  return sets.reduce((acc, set) => (isWorkingSet(set) ? acc + calcSetVolume(set) : acc), 0)
}

// Volumen informativo de la sesión: incluye calentamientos. No alimenta métricas
// de entrenamiento; existe para poder mostrar "total de la sesión" si se pide.
export const calcSessionVolume = (sets: SetLike[]): number => {
  return sets.reduce((acc, set) => (isCompletedSet(set) ? acc + calcSetVolume(set) : acc), 0)
}

// Volumen de peso corporal: reps de series sin carga (dominadas, flexiones, planchas).
// Se mantiene separado de `calcTotalVolume` para no mezclar kg con repeticiones (D7).
export const calcBodyweightReps = (sets: SetLike[]): number => {
  return sets.reduce(
    (acc, set) =>
      set.completed && !set.isWarmup && set.weightKg <= 0 && set.reps > 0
        ? acc + set.reps
        : acc,
    0
  )
}

// Formatea el volumen con sufijos k/M para que las cifras grandes sean legibles en la UI.
export const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}k`
  return vol.toFixed(0)
}
