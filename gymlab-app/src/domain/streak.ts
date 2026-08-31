// Cálculo de rachas de entrenamiento (actual y máxima) en días consecutivos.
import type { StreakResult } from './types'
import { addLocalDays, diffLocalDays, toLocalDateStr } from './dates'

// Racha más larga de días consecutivos dentro de una lista de fechas ordenada de más reciente a más antigua.
const calcLongest = (sortedDesc: string[]): number => {
  if (sortedDesc.length === 0) return 0
  let longest = 1
  let current = 1
  for (let i = 0; i < sortedDesc.length - 1; i++) {
    const gap = diffLocalDays(sortedDesc[i + 1], sortedDesc[i])
    if (gap === 1) {
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

  const unique = [
    ...new Set(
      // Normaliza timestamps ISO a fecha local (YYYY-MM-DD) y elimina duplicados del mismo día.
      workoutDates.map((d) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d.slice(0, 10)) && d.length === 10) return d
        return toLocalDateStr(new Date(d))
      })
    ),
  ]
    .sort()
    .reverse()

  const today = toLocalDateStr()
  const lastDate = unique[0]
  const gapFromToday = diffLocalDays(lastDate, today)

  // Si el último entreno no es de hoy o de ayer, la racha actual se considera rota.
  if (gapFromToday > 1) {
    return { currentStreak: 0, longestStreak: calcLongest(unique), lastWorkoutDate: lastDate }
  }

  let current = 1
  for (let i = 0; i < unique.length - 1; i++) {
    const gap = diffLocalDays(unique[i + 1], unique[i])
    if (gap === 1) current++
    else break
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(current, calcLongest(unique)),
    lastWorkoutDate: lastDate,
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

// Siguiente hito de insignia de racha: 7, 30 o 100 días.
export interface StreakBadgeTarget {
  target: 7 | 30 | 100
  remaining: number
}

export const nextStreakBadge = (currentStreak: number): StreakBadgeTarget | null => {
  if (currentStreak <= 0) return null
  if (currentStreak < 7) return { target: 7, remaining: 7 - currentStreak }
  if (currentStreak < 30) return { target: 30, remaining: 30 - currentStreak }
  if (currentStreak < 100) return { target: 100, remaining: 100 - currentStreak }
  return null
}
