// Rutinas adaptativas: ajusta pesos y volumen según progreso real.
import type { WorkoutSet, PRRecord } from './types'

// Resultado de la sugerencia adaptativa.
export interface AdaptiveSuggestion {
  exerciseId: number
  suggestedWeightKg: number
  suggestedReps: number
  reason: 'increase' | 'decrease' | 'maintain'
  reasonText: string
}

// Brzycki: estimación de 1RM.
const estimate1RM = (weightKg: number, reps: number): number =>
  reps <= 0 ? weightKg : weightKg * (36 / (37 - reps))

// Reglas de progresión.
const INCREASE_THRESHOLD = 0.05 // 5% subida en e1RM
const FAILURE_THRESHOLD = 0.5  // si falló >50% de series, reducir

// Calcula el e1RM promedio de las sesiones recientes de un ejercicio.
const averageE1RM = (sets: WorkoutSet[], exerciseId: number): number => {
  const completed = sets.filter((s) => s.exerciseId === exerciseId && s.completed && s.reps > 0)
  if (completed.length === 0) return 0
  const sum = completed.reduce((acc, s) => acc + estimate1RM(s.weightKg, s.reps), 0)
  return sum / completed.length
}

// Calcula la tasa de fallo de un ejercicio.
const failureRate = (sets: WorkoutSet[], exerciseId: number): number => {
  const exerciseSets = sets.filter((s) => s.exerciseId === exerciseId)
  if (exerciseSets.length === 0) return 0
  const failed = exerciseSets.filter((s) => !s.completed).length
  return failed / exerciseSets.length
}

// Genera sugerencias adaptativas para un conjunto de ejercicios.
export const getAdaptiveSuggestions = (
  sets: WorkoutSet[],
  exerciseIds: number[],
  prs: PRRecord[]
): AdaptiveSuggestion[] => {
  const suggestions: AdaptiveSuggestion[] = []

  for (const exerciseId of exerciseIds) {
    const currentAvg = averageE1RM(sets, exerciseId)
    const failRate = failureRate(sets, exerciseId)
    const pr = prs.find((p) => p.exerciseId === exerciseId)
    const previousE1RM = pr?.estimated1RM ?? 0

    if (currentAvg === 0 && previousE1RM === 0) {
      suggestions.push({
        exerciseId,
        suggestedWeightKg: 0,
        suggestedReps: 8,
        reason: 'maintain',
        reasonText: 'Sin datos suficientes',
      })
      continue
    }

    const changeRate = previousE1RM > 0 ? (currentAvg - previousE1RM) / previousE1RM : 0

    if (failRate >= FAILURE_THRESHOLD) {
      suggestions.push({
        exerciseId,
        suggestedWeightKg: Math.round(currentAvg * 0.9 * 10) / 10,
        suggestedReps: 10,
        reason: 'decrease',
        reasonText: `Reducir peso (${Math.round(failRate * 100)}% fallo)`,
      })
    } else if (changeRate >= INCREASE_THRESHOLD && previousE1RM > 0) {
      suggestions.push({
        exerciseId,
        suggestedWeightKg: Math.round(currentAvg * 1.025 * 10) / 10,
        suggestedReps: 6,
        reason: 'increase',
        reasonText: `Subir peso (+${Math.round(changeRate * 100)}% e1RM)`,
      })
    } else {
      suggestions.push({
        exerciseId,
        suggestedWeightKg: Math.round(currentAvg * 10) / 10 || 0,
        suggestedReps: 8,
        reason: 'maintain',
        reasonText: 'Mantener peso actual',
      })
    }
  }

  return suggestions
}
