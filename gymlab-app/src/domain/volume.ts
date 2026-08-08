// Cálculos de volumen de entrenamiento (kg × reps) y formato compacto para cifras grandes.
import type { VolumeSet } from './types'

// Volumen de una serie: peso × repeticiones.
export const calcSetVolume = (set: VolumeSet): number => {
  return set.weightKg * set.reps
}

// Volumen total de una lista de series.
export const calcTotalVolume = (sets: VolumeSet[]): number => {
  return sets.reduce((acc, set) => acc + calcSetVolume(set), 0)
}

// Volumen de un ejercicio: peso × reps × nº de sets.
export const calcExerciseVolume = (
  weightKg: number,
  reps: number,
  sets: number
): number => {
  return weightKg * reps * sets
}

// Formatea el volumen con sufijos k/M para que las cifras grandes sean legibles en la UI.
export const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}k`
  return vol.toFixed(0)
}
