// Insight semanal de volumen: compara el volumen de esta semana con el de la anterior para orientar la carga.
import type { Workout } from './types'
import { toLocalDateStr } from './dates'
import { type VolumeByWorkout } from './volume'
import { compareWeekVolume } from './weekVolume'

export type InsightTone = 'positive' | 'neutral' | 'alert'

export interface WeeklyVolumeInsight {
  currentWeekVolume: number
  previousWeekVolume: number
  // null = sin volumen previo: no hay porcentaje real que mostrar.
  deltaPct: number | null
  tone: InsightTone
  weekKey: string
  previousWeekKey: string
}

// Compara el volumen de la semana actual contra la anterior; devuelve null con pocos datos o sin volumen.
export const computeWeeklyVolumeInsight = (
  workouts: Workout[],
  volumes: VolumeByWorkout,
  now = new Date()
): WeeklyVolumeInsight | null => {
  if (workouts.length < 2) return null

  const comparison = compareWeekVolume(workouts, volumes, toLocalDateStr(now))
  if (comparison.current <= 0 && comparison.previous <= 0) return null

  return {
    currentWeekVolume: comparison.current,
    previousWeekVolume: comparison.previous,
    deltaPct: comparison.deltaPct,
    tone: comparison.tone,
    weekKey: comparison.currentWeekKey,
    previousWeekKey: comparison.previousWeekKey,
  }
}
