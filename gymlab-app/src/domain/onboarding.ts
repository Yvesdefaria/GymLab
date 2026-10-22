// Lógica del onboarding: presets de equipamiento, reparto de días de entreno
// y validación de datos personales (edad y fecha de nacimiento).
import { EQUIPMENT_OPTIONS, LEVELS, OBJECTIVES } from './catalog'
import type { Equipment, Level, Objective, Sex } from './types'

export const ONBOARDING_DONE_META_KEY = 'onboardingDone'
export const ONBOARDING_ANSWERS_META_KEY = 'onboardingAnswers'

// Cómo se pide el equipamiento en el onboarding: 4 atajos que siembran equipmentStore,
// más los chips de EquipmentFilter para afinar. Una sola verdad: el store.
export const MATERIAL_BUCKETS = ['Gimnasio', 'Mancuernas en casa', 'Solo peso corporal', 'Lo que sea'] as const
export type MaterialBucket = (typeof MATERIAL_BUCKETS)[number]

export const MATERIAL_PRESETS: Record<MaterialBucket, Equipment[]> = {
  Gimnasio: [...EQUIPMENT_OPTIONS],
  'Mancuernas en casa': ['mancuernas', 'banco', 'banda', 'peso corporal'],
  'Solo peso corporal': ['peso corporal'],
  'Lo que sea': [],
}

// Días por semana que ofrece el onboarding; el planificador valida contra esta lista.
export const ONBOARDING_DAYS_OPTIONS = [2, 3, 4, 5] as const

// Rangos plausibles para validar los datos del perfil antes de continuar.
export const HEIGHT_RANGE = { min: 100, max: 250 }
export const WEIGHT_RANGE = { min: 30, max: 300 }

// Idioma elegido en el onboarding; la app es bilingüe y el default del producto
// es inglés (la preferencia guardada manda sobre ese default).
export type AppLanguage = 'es' | 'en'

export interface OnboardingAnswers {
  name?: string
  objective: Objective
  daysPerWeek: number
  // `material` sale: el equipamiento vive en equipmentStore (MATERIAL_PRESETS lo siembra).
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

// Campos del planificador que se recuperan del onboarding; solo se incluyen los válidos.
export interface PlannerPrefill {
  objective: Objective
  level: Level
  daysPerWeek: number
  sessionDurationMin: number
}

// Traduce el blob persistido del onboarding a defaults del planificador.
// Un blob viejo o manipulado no debe romper la pantalla: se ignora lo inválido.
const isObjective = (value: unknown): value is Objective =>
  (OBJECTIVES as readonly unknown[]).includes(value)
const isLevel = (value: unknown): value is Level => (LEVELS as readonly unknown[]).includes(value)
const isOnboardingDays = (value: unknown): value is number =>
  (ONBOARDING_DAYS_OPTIONS as readonly unknown[]).includes(value)

export const plannerPrefillFromAnswers = (
  answers: Partial<OnboardingAnswers> | null | undefined,
): Partial<PlannerPrefill> => {
  if (!answers) return {}
  const prefill: Partial<PlannerPrefill> = {}
  if (isObjective(answers.objective)) prefill.objective = answers.objective
  if (isLevel(answers.level)) prefill.level = answers.level
  if (isOnboardingDays(answers.daysPerWeek)) prefill.daysPerWeek = answers.daysPerWeek
  const duration = answers.sessionDurationMin
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    prefill.sessionDurationMin = duration
  }
  return prefill
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
