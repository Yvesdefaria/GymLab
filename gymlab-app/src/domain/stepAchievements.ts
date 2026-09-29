// Medidas del contador de pasos (F109.1): magnitudes puras sobre el histórico
// diario —total, máximo diario, racha ≥10k, mejor ventana de 7 días y mejor mes—
// que alimentan el progreso declarativo del catálogo unificado de logros.
// El umbral diario es una constante de diseño, no la meta editable del usuario.
import type { DailyStepsEntry } from './types'
import { addLocalDays, diffLocalDays } from './dates'

// Umbral diario evaluado por la medida de racha (constante de diseño).
const STREAK_DAILY_GOAL = 10_000

export interface StepStats {
  stepsTotal: number
  stepsMaxDay: number
  steps10kRun: number
  steps7dWindow: number
  stepsMonth: number
  distanceKm: number
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

// Mejor ventana de 7 días calendario (días sin registro suman 0): cada día con
// registro actúa como inicio de ventana.
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
