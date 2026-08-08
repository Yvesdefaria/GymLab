// Lógica del onboarding: sugerencia de rutina inicial y reparto de días de entreno en la semana.
import type { Objective, Routine } from './types'

export const ONBOARDING_DONE_META_KEY = 'onboardingDone'

export interface OnboardingAnswers {
  objective: Objective
  daysPerWeek: number
  material: string
}

// Elige la rutina del objetivo elegido cuya duración semanal más se acerca a los días deseados.
export const suggestRoutine = (
  routines: Routine[],
  answers: OnboardingAnswers
): Routine | undefined => {
  const matches = routines.filter((r) => r.objective === answers.objective)
  // Sin rutina del objetivo, se reutiliza todo el catálogo para no dejar la sugerencia vacía.
  const pool = matches.length > 0 ? matches : routines
  if (pool.length === 0) return undefined
  return [...pool].sort(
    (a, b) =>
      Math.abs(a.daysCount - answers.daysPerWeek) - Math.abs(b.daysCount - answers.daysPerWeek)
  )[0]
}

// Reparto equilibrado de días de entreno en la semana (día 1 = lunes, siguiendo getDay).
export const weekdaysForDays = (n: number): number[] => {
  switch (n) {
    case 2:
      return [1, 4]
    case 3:
      return [1, 3, 5]
    case 4:
      return [1, 2, 4, 5]
    default:
      return [1, 2, 3, 4, 5]
  }
}
