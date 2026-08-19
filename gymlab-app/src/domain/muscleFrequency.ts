// Frecuencia muscular: analiza frecuencia semanal por grupo vs objetivo.
import type { MuscleGroup } from './types'

// Objetivo de frecuencia semanal por grupo muscular (sesiones por semana).
export const FREQUENCY_TARGETS: Record<MuscleGroup, number> = {
  pecho: 2,
  espalda: 2,
  biceps: 2,
  triceps: 2,
  hombro: 2,
  pierna: 2,
  gluteo: 2,
  abdomen: 3,
  trapecios: 1,
  antebrazo: 1,
}

// Calcula frecuencia real por grupo muscular a partir de fechas de entrenamiento.
export const calculateMuscleFrequency = (
  muscleGroupDates: Partial<Record<MuscleGroup, string[]>>,
): Partial<Record<MuscleGroup, number>> => {
  const result: Partial<Record<MuscleGroup, number>> = {}
  for (const [group, dates] of Object.entries(muscleGroupDates) as [MuscleGroup, string[]][]) {
    result[group] = dates.length
  }
  return result
}

// Compara frecuencia actual vs objetivo y retorna desviaciones.
export const compareFrequency = (
  actual: Partial<Record<MuscleGroup, number>>,
): { group: MuscleGroup; actual: number; target: number; deviation: number; alert: boolean }[] => {
  return (Object.keys(FREQUENCY_TARGETS) as MuscleGroup[]).map((group) => {
    const a = actual[group] ?? 0
    const t = FREQUENCY_TARGETS[group]!
    const deviation = t > 0 ? ((a - t) / t) * 100 : 0
    return { group, actual: a, target: t, deviation, alert: Math.abs(deviation) > 20 }
  })
}

// Obtiene grupos musculares con alerta de desbalance.
export const getImbalancedGroups = (
  actual: Partial<Record<MuscleGroup, number>>,
): { group: MuscleGroup; actual: number; target: number; deviation: number }[] =>
  compareFrequency(actual).filter((r) => r.alert)
