// Cálculos de volumen de entrenamiento (kg × reps) y formato compacto para cifras grandes.
import type { VolumeSet } from './types'
import { isCompletedSet, isWorkingSet, type SetLike } from './setFilters'

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

// Formatea el volumen con sufijos k/M para que las cifras grandes sean legibles en la UI.
export const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}k`
  return vol.toFixed(0)
}
