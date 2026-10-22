// Constantes y utilidades del perfil que el onboarding persiste en meta (dominio puro, sin Dexie).
import type { Sex } from './types'

export const HEIGHT_KEY = 'heightCm'
export const BODY_SEX_KEY = 'bodySex'
export const BIRTH_DATE_KEY = 'birthDate'
// Nombre visible del usuario; el onboarding y el editor del perfil escriben la misma clave.
export const PROFILE_NAME_KEY = 'profileName'
export const NAME_MAX_LENGTH = 24

// Recorta y acota el nombre antes de persistirlo o compararlo.
export const normalizeProfileName = (raw: string): string => raw.trim().slice(0, NAME_MAX_LENGTH)

// El nombre es obligatorio en el onboarding: al menos un carácter visible.
export const isProfileNameValid = (raw: string): boolean => normalizeProfileName(raw).length > 0

// Las calculadoras usan su propio vocabulario ('hombre' | 'mujer'); el perfil guarda Sex.
export const calculatorSexFromBodySex = (sex: Sex | null | undefined): 'hombre' | 'mujer' =>
  sex === 'female' ? 'mujer' : 'hombre'

// Convierte los días/semana elegidos en el onboarding al objetivo semanal del perfil
// (objetivo realista acotado a 1–5 sesiones aunque el input llegue desviado).
export const weeklyGoalFromDays = (daysPerWeek: number): number => {
  if (!Number.isFinite(daysPerWeek) || daysPerWeek <= 0) return 1
  return Math.min(5, Math.round(daysPerWeek))
}
