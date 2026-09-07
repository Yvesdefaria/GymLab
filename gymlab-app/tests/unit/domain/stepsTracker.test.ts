// Tests TDD del motor puro de pasos (F84a): distancia, calorías, racha diaria,
// comparativa semanal con división por cero y heatmap mensual por % de meta.
import { describe, expect, it } from 'vitest'
import {
  calculateCalories,
  calculateDistance,
  defaultStrideFromHeight,
  getMonthlyHeatmap,
  getStreak,
  getWeeklyComparison,
} from '@/domain/stepsTracker'
import { addLocalDays } from '@/domain/dates'
import type { DailyStepsEntry } from '@/domain/types'

// Hoy de referencia para los tests de racha (fecha local fija, sin depender del reloj).
const TODAY = '2026-09-07'
const GOAL = 10_000

// Entrada mínima de pasos; el resto de campos no participan en los cálculos puros.
const day = (localDate: string, steps: number): DailyStepsEntry => ({
  id: 1,
  localDate,
  steps,
  distanceKm: 0,
  calories: 0,
  source: 'manual',
  syncedAt: '2026-09-07T10:00:00.000Z',
})

describe('calculateDistance', () => {
  it('10.000 pasos × 70 cm de zancada → 7 km', () => {
    expect(calculateDistance(10_000, 70)).toBe(7)
  })

  it('5.000 pasos × 70 cm → 3,5 km', () => {
    expect(calculateDistance(5_000, 70)).toBe(3.5)
  })

  it('0 pasos → 0 km', () => {
    expect(calculateDistance(0, 70)).toBe(0)
  })

  it('pasos con zancada decimal se acumulan correctamente', () => {
    expect(calculateDistance(10_000, 72.5)).toBeCloseTo(7.25, 4)
    expect(calculateDistance(12_345, 70)).toBeCloseTo(8.6415, 4)
  })
})

describe('calculateCalories', () => {
  it('10.000 pasos → 400 kcal (pasos × 0,04)', () => {
    expect(calculateCalories(10_000, 0)).toBe(400)
  })

  it('25.000 pasos → 1.000 kcal', () => {
    expect(calculateCalories(25_000, 0)).toBe(1_000)
  })

  it('0 pasos → 0 kcal', () => {
    expect(calculateCalories(0, 0)).toBe(0)
  })

  it('el peso queda fuera de la fórmula actual (firma compatible con F84e)', () => {
    expect(calculateCalories(10_000, 80)).toBe(400)
  })
})

describe('getStreak', () => {
  it('sin registros → racha 0', () => {
    expect(getStreak([], GOAL, TODAY)).toBe(0)
  })

  it('hoy + ayer + anteayer cumpliendo la meta → racha 3', () => {
    const entries = [0, 1, 2].map((i) => day(addLocalDays(TODAY, -i), GOAL))
    expect(getStreak(entries, GOAL, TODAY)).toBe(3)
  })

  it('hoy sin registro pero ayer y anteayer cumpliendo → racha viva de 2', () => {
    const entries = [1, 2].map((i) => day(addLocalDays(TODAY, -i), GOAL))
    expect(getStreak(entries, GOAL, TODAY)).toBe(2)
  })

  it('hoy cumpliendo pero ayer sin registro → racha 1', () => {
    const entries = [day(TODAY, GOAL), day(addLocalDays(TODAY, -2), GOAL)]
    expect(getStreak(entries, GOAL, TODAY)).toBe(1)
  })

  it('hoy registrado por debajo de la meta rompe la racha → 0', () => {
    const entries = [day(TODAY, 5_000), day(addLocalDays(TODAY, -1), GOAL), day(addLocalDays(TODAY, -2), GOAL)]
    expect(getStreak(entries, GOAL, TODAY)).toBe(0)
  })

  it('la racha debe terminar en hoy: días cumplidos hace 3+ días ya no cuentan', () => {
    const entries = [3, 4].map((i) => day(addLocalDays(TODAY, -i), GOAL))
    expect(getStreak(entries, GOAL, TODAY)).toBe(0)
  })

  it('entradas desordenadas resuelven la misma racha', () => {
    const entries = [
      day(addLocalDays(TODAY, -2), GOAL),
      day(TODAY, GOAL),
      day(addLocalDays(TODAY, -1), GOAL),
    ]
    expect(getStreak(entries, GOAL, TODAY)).toBe(3)
  })

  it('un día sin cumplir rompe la serie (no suma días por debajo de la meta)', () => {
    const entries = [
      day(TODAY, GOAL),
      day(addLocalDays(TODAY, -1), GOAL),
      day(addLocalDays(TODAY, -2), 9_000),
      day(addLocalDays(TODAY, -3), GOAL),
    ]
    expect(getStreak(entries, GOAL, TODAY)).toBe(2)
  })
})

describe('getWeeklyComparison', () => {
  it('semana actual 10.000 vs previa 8.000 → +25%', () => {
    const week1 = [day('2026-08-31', 6_000), day('2026-09-01', 4_000)]
    const week2 = [day('2026-08-24', 5_000), day('2026-08-25', 3_000)]
    expect(getWeeklyComparison(week1, week2)).toBe(25)
  })

  it('semana actual 8.000 vs previa 10.000 → −20%', () => {
    const week1 = [day('2026-09-01', 8_000)]
    const week2 = [day('2026-08-25', 10_000)]
    expect(getWeeklyComparison(week1, week2)).toBe(-20)
  })

  it('sin datos previos con pasos actuales → +100% (sin división por cero)', () => {
    const week1 = [day('2026-09-01', 5_000)]
    expect(getWeeklyComparison(week1, [])).toBe(100)
  })

  it('sin datos en ninguna semana → 0', () => {
    expect(getWeeklyComparison([], [])).toBe(0)
  })

  it('semana actual vacía con previa 5.000 → −100%', () => {
    const week2 = [day('2026-08-25', 5_000)]
    expect(getWeeklyComparison([], week2)).toBe(-100)
  })
})

describe('getMonthlyHeatmap', () => {
  it('nivel 4 al cumplir la meta (100%+)', () => {
    expect(getMonthlyHeatmap([day('2026-09-01', 10_000)], GOAL)).toEqual({ '2026-09-01': 4 })
  })

  it('nivel 3 entre 50% y 99% de la meta', () => {
    expect(getMonthlyHeatmap([day('2026-09-01', 5_000)], GOAL)).toEqual({ '2026-09-01': 3 })
    expect(getMonthlyHeatmap([day('2026-09-01', 9_999)], GOAL)).toEqual({ '2026-09-01': 3 })
  })

  it('nivel 2 entre 25% y 49% de la meta', () => {
    expect(getMonthlyHeatmap([day('2026-09-01', 2_500)], GOAL)).toEqual({ '2026-09-01': 2 })
    expect(getMonthlyHeatmap([day('2026-09-01', 4_999)], GOAL)).toEqual({ '2026-09-01': 2 })
  })

  it('nivel 1 por debajo del 25% de la meta', () => {
    expect(getMonthlyHeatmap([day('2026-09-01', 2_499)], GOAL)).toEqual({ '2026-09-01': 1 })
    expect(getMonthlyHeatmap([day('2026-09-01', 1_000)], GOAL)).toEqual({ '2026-09-01': 1 })
  })

  it('un día con 0 pasos → nivel 0', () => {
    expect(getMonthlyHeatmap([day('2026-09-01', 0)], GOAL)).toEqual({ '2026-09-01': 0 })
  })

  it('solo aparecen los días con registro', () => {
    const heatmap = getMonthlyHeatmap([day('2026-09-01', 8_000), day('2026-09-03', 2_000)], GOAL)
    expect(Object.keys(heatmap)).toEqual(['2026-09-01', '2026-09-03'])
  })
})

describe('defaultStrideFromHeight', () => {
  it('con altura: zancada estimada = altura × 0,415', () => {
    expect(defaultStrideFromHeight(175)).toBe(72.625)
    expect(defaultStrideFromHeight(170)).toBe(70.55)
  })

  it('sin altura (0, null o undefined) → 70 cm', () => {
    expect(defaultStrideFromHeight(0)).toBe(70)
    expect(defaultStrideFromHeight(null)).toBe(70)
    expect(defaultStrideFromHeight(undefined)).toBe(70)
  })
})