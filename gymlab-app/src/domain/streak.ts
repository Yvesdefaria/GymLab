// Cálculo de rachas de entrenamiento por SEMANAS cumplidas (mínimo de sesiones por semana),
// en lugar de días consecutivos: descansar uno o dos días no rompe la racha mientras
// la semana calendario cumpla el mínimo.
import type { StreakResult } from './types'
import { addLocalDays, diffLocalDays, toLocalDateStr, weekStartKey } from './dates'

// Sesiones mínimas por semana para que la semana cuente como cumplida (decisión F93 #6).
export const MIN_WEEKLY_SESSIONS = 3

// Racha más larga de semanas consecutivas cumplidas dentro de una lista de claves de semana ordenadas.
const calcLongest = (weeks: string[]): number => {
  if (weeks.length === 0) return 0
  let longest = 1
  let current = 1
  for (let i = 1; i < weeks.length; i++) {
    const gap = diffLocalDays(weeks[i - 1], weeks[i])
    if (gap === 7) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }
  return longest
}

/** workoutDates: ISO timestamps or local YYYY-MM-DD */
export const calcStreak = (workoutDates: string[]): StreakResult => {
  if (workoutDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null }
  }

  // Normaliza a fecha local YYYY-MM-DD y conserva la fecha más reciente.
  const local = workoutDates.map((d) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d.slice(0, 10)) && d.length === 10) return d
    return toLocalDateStr(new Date(d))
  })
  const lastWorkoutDate = [...local].sort()[local.length - 1] ?? local[0]!

  // Agrupa por semana calendario (lunes) y filtra las que cumplen el mínimo de sesiones.
  const perWeek = new Map<string, number>()
  for (const date of local) {
    const key = weekStartKey(date)
    perWeek.set(key, (perWeek.get(key) ?? 0) + 1)
  }
  const metWeeks = [...perWeek.entries()]
    .filter(([, count]) => count >= MIN_WEEKLY_SESSIONS)
    .map(([key]) => key)
    .sort()

  const currentWeek = weekStartKey(toLocalDateStr())

  // La racha actual cuenta semanas cumplidas consecutivas que terminan en la semana actual
  // (o la anterior, si la actual aún no ha cerrado). Si la última semana cumplida está a
  // 2+ semanas, la racha se considera rota (currentStreak = 0).
  let currentStreak = 0
  if (metWeeks.length > 0) {
    const lastMet = metWeeks[metWeeks.length - 1]!
    const gapFromCurrent = diffLocalDays(lastMet, currentWeek)
    if (gapFromCurrent <= 7) {
      let run = 1
      for (let i = metWeeks.length - 2; i >= 0; i--) {
        const gap = diffLocalDays(metWeeks[i]!, metWeeks[i + 1]!)
        if (gap === 7) run++
        else break
      }
      currentStreak = run
    }
  }

  return {
    currentStreak,
    longestStreak: calcLongest(metWeeks),
    lastWorkoutDate,
  }
}

// Un día del grid de los últimos 30 días de la tab Rachas.
export interface ThirtyDayCell {
  date: string
  trained: boolean
}

// Grid de 30 días terminando hoy (fecha local), marcando los días en los que se entrenó.
// `trained` es un set de fechas YYYY-MM-DD (mismo formato que trainedLocalDates del dominio).
export const buildThirtyDayGrid = (
  trained: string[] | Set<string>,
  today: string = toLocalDateStr(),
): ThirtyDayCell[] => {
  const set = trained instanceof Set ? trained : new Set(trained)
  return Array.from({ length: 30 }, (_, i) => {
    const date = addLocalDays(today, i - 29)
    return { date, trained: set.has(date) }
  })
}

// Siguiente hito de insignia de racha en semanas: 4, 8 o 16 (≈1, 2 o 4 meses).
export interface StreakBadgeTarget {
  target: 4 | 8 | 16
  remaining: number
}

export const nextStreakBadge = (currentStreak: number): StreakBadgeTarget | null => {
  if (currentStreak <= 0) return null
  if (currentStreak < 4) return { target: 4, remaining: 4 - currentStreak }
  if (currentStreak < 8) return { target: 8, remaining: 8 - currentStreak }
  if (currentStreak < 16) return { target: 16, remaining: 16 - currentStreak }
  return null
}