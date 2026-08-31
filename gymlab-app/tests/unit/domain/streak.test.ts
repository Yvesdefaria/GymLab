// Tests del nuevo cálculo de racha por semanas cumplidas (mínimo 3 sesiones/semana).
import { describe, expect, it } from 'vitest'
import { calcStreak, MIN_WEEKLY_SESSIONS } from '@/domain/streak'
import { addLocalDays } from '@/domain/dates'

// 2026-08-31 es lunes. Base para generar semanas.
const MONDAY = '2026-08-31'

// Devuelve el lunes de la semana `weeksAgo` atrás (manteniendo la semana calendario).
const mondayOf = (weeksAgo: number): string => addLocalDays(MONDAY, -weeksAgo * 7)

// Workouts distribuidos dentro de la MISMA semana (lunes/miércoles/viernes) para que no
// crucen a otra semana calendario y la semana pueda cumplir el mínimo.
const workoutDates = (weeks: { weeksAgo: number; count: number }[]): string[] =>
  weeks.flatMap(({ weeksAgo, count }) => {
    const monday = mondayOf(weeksAgo)
    const days = [monday, addLocalDays(monday, 2), addLocalDays(monday, 4)]
    return Array.from({ length: count }, (_, i) => days[i % days.length]!)
  })

describe('MIN_WEEKLY_SESSIONS', () => {
  it('exige 3 sesiones mínimas por semana', () => {
    expect(MIN_WEEKLY_SESSIONS).toBe(3)
  })
})

describe('calcStreak (semanas cumplidas)', () => {
  it('racha 0 sin entrenos', () => {
    expect(calcStreak([])).toEqual({ currentStreak: 0, longestStreak: 0, lastWorkoutDate: null })
  })

  it('una semana con 3 sesiones cuenta como racha de 1 semana', () => {
    const dates = workoutDates([{ weeksAgo: 0, count: 3 }])
    expect(calcStreak(dates)).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastWorkoutDate: addLocalDays(mondayOf(0), 4),
    })
  })

  it('una semana con menos de 3 sesiones no cumple el mínimo (racha 0)', () => {
    const dates = workoutDates([{ weeksAgo: 0, count: 2 }])
    expect(calcStreak(dates).currentStreak).toBe(0)
    expect(calcStreak(dates).longestStreak).toBe(0)
  })

  it('dos semanas consecutivas con 3+ sesiones → racha 2', () => {
    const dates = workoutDates([
      { weeksAgo: 0, count: 3 },
      { weeksAgo: 1, count: 3 },
    ])
    const result = calcStreak(dates)
    expect(result.currentStreak).toBe(2)
    expect(result.longestStreak).toBe(2)
  })

  it('una semana fallada rompe la racha actual', () => {
    const dates = workoutDates([
      { weeksAgo: 0, count: 3 },
      { weeksAgo: 2, count: 3 },
    ])
    const result = calcStreak(dates)
    // La semana anterior (weeksAgo 1) no cumplió → la racha se corta (hoy aún puede).
    expect(result.currentStreak).toBe(1)
    // La racha más larga histórica es 1 (una sola semana consecutiva).
    expect(result.longestStreak).toBe(1)
  })

  it('racha máxima cuenta semanas cumplidas no consecutivas a la actual', () => {
    const dates = workoutDates([
      { weeksAgo: 2, count: 3 },
      { weeksAgo: 3, count: 3 },
      { weeksAgo: 4, count: 3 },
    ])
    const result = calcStreak(dates)
    expect(result.longestStreak).toBe(3)
    expect(result.currentStreak).toBe(0)
  })

  it('lastWorkoutDate es la fecha más reciente de cualquier sesión', () => {
    const dates = workoutDates([{ weeksAgo: 1, count: 3 }])
    expect(calcStreak(dates).lastWorkoutDate).toBe(addLocalDays(mondayOf(1), 4))
  })
})