// Lógica del onboarding: sugerencia de rutina inicial, reparto de días de entreno
// y validación de datos personales (edad y fecha de nacimiento).
import type { Level, Objective, Routine, Sex } from './types'

export const ONBOARDING_DONE_META_KEY = 'onboardingDone'
export const ONBOARDING_ANSWERS_META_KEY = 'onboardingAnswers'

// Lista blanca de lugares de entrenamiento: el finish solo guarda valores de aquí.
export const MATERIALS = ['Gimnasio', 'Mancuernas en casa', 'Solo peso corporal', 'Lo que sea']

// Rangos plausibles para validar los datos del perfil antes de continuar.
export const HEIGHT_RANGE = { min: 100, max: 250 }
export const WEIGHT_RANGE = { min: 30, max: 300 }

// Idioma elegido en el onboarding; la app solo renderiza es-ES por ahora, el valor
// queda guardado como preferencia para una futura i18n.
export type AppLanguage = 'es' | 'en'

export interface OnboardingAnswers {
  objective: Objective
  daysPerWeek: number
  material: string
  level: Level
  language: AppLanguage
  units: 'kg' | 'lb'
  sex: Sex
  birthDate: string
  heightCm: number
  weightKg: number
  sessionDurationMin: number
  cardioPerWeek: number
  guideInterests: string[]
  acceptedTerms: boolean
}

// Edad cumplida a partir de una fecha de nacimiento YYYY-MM-DD (local, sin TZ).
export const ageFromBirthDate = (birthDate: string, now: Date = new Date()): number | null => {
  const [y, m, d] = birthDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let age = today.getFullYear() - y
  const birthdayPassed = today.getMonth() > m - 1 || (today.getMonth() === m - 1 && today.getDate() >= d)
  if (!birthdayPassed) age -= 1
  return age
}

// Regla de seguridad del onboarding: la fecha de nacimiento debe corresponder a una edad entre 14 y 99 años.
export const isBirthDateValid = (birthDate: string): boolean => {
  const age = ageFromBirthDate(birthDate)
  return age !== null && age >= 14 && age <= 99
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
