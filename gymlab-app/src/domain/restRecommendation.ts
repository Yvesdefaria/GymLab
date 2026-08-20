// Recomendación de descanso óptimo basada en ejercicio, intensidad y objetivo.
export type ExerciseCategory = 'compuesto' | 'aislamiento'
export type TrainingGoal = 'fuerza' | 'hipertrofia' | 'resistencia'

export interface RestRecommendation {
  minSeconds: number
  maxSeconds: number
  recommendedSeconds: number
  reason: string
}

// Tiempos base por categoría y objetivo (en segundos).
const baseRest: Record<ExerciseCategory, Record<TrainingGoal, [number, number]>> = {
  compuesto: {
    fuerza: [180, 300],     // 3-5 min
    hipertrofia: [90, 180], // 1.5-3 min
    resistencia: [30, 60],  // 30-60s
  },
  aislamiento: {
    fuerza: [120, 180],     // 2-3 min
    hipertrofia: [60, 90],  // 1-1.5 min
    resistencia: [30, 60],  // 30-60s
  },
}

// Ajusta el descanso según RPE/RIR.
const adjustByIntensity = (
  base: [number, number],
  rpe?: number,
  rir?: number
): [number, number] => {
  let factor = 1

  // RPE alto (9-10) → más descanso.
  if (rpe != null && rpe >= 9) factor = 1.3
  else if (rpe != null && rpe >= 7) factor = 1.1
  // RPE bajo (5-6) → menos descanso.
  else if (rpe != null && rpe <= 5) factor = 0.8

  // RIR bajo (0-1) → más descanso.
  if (rir != null && rir <= 1) factor = Math.max(factor, 1.2)

  return [
    Math.round(base[0] * factor),
    Math.round(base[1] * factor),
  ]
}

// Calcula descanso óptimo.
export const calcRestRecommendation = (
  category: ExerciseCategory,
  goal: TrainingGoal,
  rpe?: number,
  rir?: number
): RestRecommendation => {
  const base = baseRest[category][goal]
  const [min, max] = adjustByIntensity(base, rpe, rir)
  const recommended = Math.round((min + max) / 2)

  const reasonKey =
    category === 'compuesto' && goal === 'fuerza'
      ? 'rest.reason_compound_fuerza'
      : category === 'compuesto' && goal === 'hipertrofia'
        ? 'rest.reason_compound_hipertrofia'
        : category === 'aislamiento'
          ? 'rest.reason_isolation'
          : 'rest.reason_general'

  return {
    minSeconds: min,
    maxSeconds: max,
    recommendedSeconds: recommended,
    reason: reasonKey,
  }
}
