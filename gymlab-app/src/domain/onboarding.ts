import type { Objective, Routine } from './types'

export const ONBOARDING_DONE_META_KEY = 'onboardingDone'

export interface OnboardingAnswers {
  objective: Objective
  daysPerWeek: number
  material: string
}

export const suggestRoutine = (
  routines: Routine[],
  answers: OnboardingAnswers
): Routine | undefined => {
  const matches = routines.filter((r) => r.objective === answers.objective)
  const pool = matches.length > 0 ? matches : routines
  if (pool.length === 0) return undefined
  return [...pool].sort(
    (a, b) =>
      Math.abs(a.daysCount - answers.daysPerWeek) - Math.abs(b.daysCount - answers.daysPerWeek)
  )[0]
}

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
