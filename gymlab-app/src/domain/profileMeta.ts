// Constantes y utilidades del perfil que el onboarding persiste en meta (dominio puro, sin Dexie).
export const HEIGHT_KEY = 'heightCm'
export const BODY_SEX_KEY = 'bodySex'
export const BIRTH_DATE_KEY = 'birthDate'

// Convierte los días/semana elegidos en el onboarding al objetivo semanal del perfil
// (objetivo realista acotado a 1–5 sesiones aunque el input llegue desviado).
export const weeklyGoalFromDays = (daysPerWeek: number): number => {
  if (!Number.isFinite(daysPerWeek) || daysPerWeek <= 0) return 1
  return Math.min(5, Math.round(daysPerWeek))
}
