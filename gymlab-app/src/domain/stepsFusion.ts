// Regla de fusión de pasos (F84c): el sistema de salud es la fuente de verdad.
// health > 0 → ese número gana (source phone); health <= 0 → null = no tocar
// el registro existente (nunca pisar con 0). Sin imports de runtime.
import { calculateCalories, calculateDistance } from './stepsTracker'
import type { DailyStepsEntry } from './types'

export const mergeHealthSample = (
  localDate: string,
  day: DailyStepsEntry | undefined,
  healthSteps: number,
  strideLengthCm: number,
  appliedAt: string,
): DailyStepsEntry | null => {
  if (healthSteps <= 0) return null
  return {
    id: day?.id ?? 0,
    localDate,
    steps: healthSteps,
    distanceKm: calculateDistance(healthSteps, strideLengthCm),
    calories: calculateCalories(healthSteps, 0),
    source: 'phone',
    syncedAt: appliedAt,
  }
}