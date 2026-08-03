import type { VolumeSet } from './types'

export const calcSetVolume = (set: VolumeSet): number => {
  return set.weightKg * set.reps
}

export const calcTotalVolume = (sets: VolumeSet[]): number => {
  return sets.reduce((acc, set) => acc + calcSetVolume(set), 0)
}

export const calcExerciseVolume = (
  weightKg: number,
  reps: number,
  sets: number
): number => {
  return weightKg * reps * sets
}

export const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}k`
  return vol.toFixed(0)
}
