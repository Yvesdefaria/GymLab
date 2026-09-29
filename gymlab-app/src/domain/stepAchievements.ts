// Logros del contador de pasos (F84a): definición y evaluación puras sobre el
// histórico diario. Umbrales fijos alineados con la meta por defecto (10k/día);
// la integración en `/logros` es F84f y no toca achievements.ts de entrenamiento.
import type { DailyStepsEntry } from './types'
import { addLocalDays, diffLocalDays } from './dates'

// Umbral diario evaluado por los logros (constante de diseño, no la meta editable).
const STREAK_DAILY_GOAL = 10_000
const STREAK_7 = 7
const STREAK_30 = 30
const WEEKLY_50K = 50_000
const MONTHLY_200K = 200_000
const TOTAL_1M = 1_000_000
const MARATHON_STEPS = 42_000

export interface StepAchievementDef {
  id: string
  titleKey: string
  descriptionKey: string
  icon: string
  check: (days: DailyStepsEntry[]) => boolean
}

// Mayor racha de días consecutivos con steps >= minSteps. Un día sin registro o
// por debajo del umbral corta la serie (se evalúa el run más largo del histórico,
// no solo el que termina hoy).
const longestConsecutiveRun = (days: DailyStepsEntry[], minSteps: number): number => {
  const stepsByDate = new Map(days.map((e) => [e.localDate, e.steps]))
  const dates = [...stepsByDate.keys()].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const date of dates) {
    const met = (stepsByDate.get(date) ?? 0) >= minSteps
    if (met && prev !== null && diffLocalDays(prev, date) === 1) run++
    else if (met) run = 1
    else run = 0
    if (run > best) best = run
    prev = date
  }
  return best
}

// ¿Existe una ventana de 7 días calendario con total >= threshold? Cada día con
// registro actúa como inicio de ventana; los días sin dato suman 0.
const hasWeeklyTotal = (days: DailyStepsEntry[], threshold: number): boolean => {
  const stepsByDate = new Map(days.map((e) => [e.localDate, e.steps]))
  const starts = [...stepsByDate.keys()].sort()
  for (const start of starts) {
    let total = 0
    for (let i = 0; i < 7; i++) total += stepsByDate.get(addLocalDays(start, i)) ?? 0
    if (total >= threshold) return true
  }
  return false
}

// ¿Algún mes calendario (YYYY-MM) acumula total >= threshold?
const hasMonthlyTotal = (days: DailyStepsEntry[], threshold: number): boolean => {
  const byMonth = new Map<string, number>()
  for (const e of days) {
    const month = e.localDate.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + e.steps)
  }
  return [...byMonth.values()].some((total) => total >= threshold)
}

export const STEP_ACHIEVEMENTS: StepAchievementDef[] = [
  {
    id: 'primeros-pasos',
    titleKey: 'steps.achievements.primerosPasos.name',
    descriptionKey: 'steps.achievements.primerosPasos.desc',
    icon: 'Footprints',
    check: (days) => days.some((e) => e.steps > 0),
  },
  {
    id: 'diez-mil-dia',
    titleKey: 'steps.achievements.diezMilDia.name',
    descriptionKey: 'steps.achievements.diezMilDia.desc',
    icon: 'Target',
    check: (days) => days.some((e) => e.steps >= 10_000),
  },
  {
    id: 'racha-7-dias',
    titleKey: 'steps.achievements.racha7Dias.name',
    descriptionKey: 'steps.achievements.racha7Dias.desc',
    icon: 'Flame',
    check: (days) => longestConsecutiveRun(days, STREAK_DAILY_GOAL) >= STREAK_7,
  },
  {
    id: 'racha-30-dias',
    titleKey: 'steps.achievements.racha30Dias.name',
    descriptionKey: 'steps.achievements.racha30Dias.desc',
    icon: 'Crown',
    check: (days) => longestConsecutiveRun(days, STREAK_DAILY_GOAL) >= STREAK_30,
  },
  {
    id: 'cincuenta-mil-semana',
    titleKey: 'steps.achievements.cincuentaMilSemana.name',
    descriptionKey: 'steps.achievements.cincuentaMilSemana.desc',
    icon: 'TrendingUp',
    check: (days) => hasWeeklyTotal(days, WEEKLY_50K),
  },
  {
    id: 'doscientos-mil-mes',
    titleKey: 'steps.achievements.doscientosMilMes.name',
    descriptionKey: 'steps.achievements.doscientosMilMes.desc',
    icon: 'CalendarRange',
    check: (days) => hasMonthlyTotal(days, MONTHLY_200K),
  },
  {
    id: 'millon-total',
    titleKey: 'steps.achievements.millonTotal.name',
    descriptionKey: 'steps.achievements.millonTotal.desc',
    icon: 'Medal',
    check: (days) => days.reduce((sum, e) => sum + e.steps, 0) >= TOTAL_1M,
  },
  {
    id: 'maraton',
    titleKey: 'steps.achievements.maraton.name',
    descriptionKey: 'steps.achievements.maraton.desc',
    icon: 'Mountain',
    check: (days) => days.some((e) => e.steps >= MARATHON_STEPS),
  },
]

export const getUnlockedStepAchievements = (days: DailyStepsEntry[]): StepAchievementDef[] =>
  STEP_ACHIEVEMENTS.filter((achievement) => achievement.check(days))

// Formatea los 8 logros con su estado (bloqueado/desbloqueado) para la galería
// de /logros (F84f): todas las definiciones en orden, cada una con su flag.
export const getStepAchievementsWithStatus = (
  days: DailyStepsEntry[],
): { def: StepAchievementDef; unlocked: boolean }[] =>
  STEP_ACHIEVEMENTS.map((def) => ({ def, unlocked: def.check(days) }))

// F109.1: medidas numéricas para el sistema unificado de medallas. Mismas
// semánticas que los checks booleanos de arriba (racha ≥10k, ventana de 7
// días, mes calendario), pero devolviendo el valor para la barra de progreso.
export interface StepStats {
  stepsTotal: number
  stepsMaxDay: number
  steps10kRun: number
  steps7dWindow: number
  stepsMonth: number
  distanceKm: number
}

// Mejor ventana de 7 días calendario (días sin registro suman 0), como
// hasWeeklyTotal pero devolviendo el máximo en vez de un umbral.
const maxWeeklyTotal = (days: DailyStepsEntry[]): number => {
  const stepsByDate = new Map(days.map((e) => [e.localDate, e.steps]))
  let best = 0
  for (const start of stepsByDate.keys()) {
    let total = 0
    for (let i = 0; i < 7; i++) total += stepsByDate.get(addLocalDays(start, i)) ?? 0
    if (total > best) best = total
  }
  return best
}

// Mejor mes calendario (YYYY-MM, suma directa).
const maxMonthlyTotal = (days: DailyStepsEntry[]): number => {
  const byMonth = new Map<string, number>()
  for (const e of days) {
    const month = e.localDate.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + e.steps)
  }
  return Math.max(0, ...byMonth.values())
}

export const deriveStepStats = (days: DailyStepsEntry[]): StepStats => ({
  stepsTotal: days.reduce((sum, e) => sum + e.steps, 0),
  stepsMaxDay: days.reduce((max, e) => Math.max(max, e.steps), 0),
  steps10kRun: longestConsecutiveRun(days, STREAK_DAILY_GOAL),
  steps7dWindow: maxWeeklyTotal(days),
  stepsMonth: maxMonthlyTotal(days),
  distanceKm: days.reduce((sum, e) => sum + (e.distanceKm || 0), 0),
})