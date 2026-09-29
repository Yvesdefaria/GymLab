// Convención del repo: se testea la lógica pura exportada del hook (el glue
// React + debounce se cubre con la regresión e2e de /logros y /pasos).
// Revisión de F109 (A1/A2): el key de cambio de useAchievements debe detectar
// ediciones que conservan longitudes y totales —distribución de pasos,
// tiempos de sesión y proteína por día— porque sus medidas dependen de eso.
import { describe, expect, it } from 'vitest'
import {
  mealProteinByDayDigest,
  stepDaysDigest,
  workoutTimesDigest,
} from '@/hooks/useAchievements'
import type { DailyStepsEntry, MealEntry, Workout } from '@/domain/types'

const stepDay = (localDate: string, steps: number, distanceKm = 0): DailyStepsEntry => ({
  id: 1,
  localDate,
  steps,
  distanceKm,
  calories: 0,
  source: 'manual',
  syncedAt: '2026-09-01T00:00:00.000Z',
})

const workout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 1,
  startedAt: '2026-09-01T10:00:00.000Z',
  finishedAt: '2026-09-01T11:00:00.000Z',
  routineId: null,
  routineDayId: null,
  localDate: '2026-09-01',
  notes: '',
  totalVolume: 0,
  ...overrides,
})

const meal = (id: number, localDate: string, proteinG: number): MealEntry => ({
  id,
  localDate,
  mealType: 'almuerzo',
  items: [{ foodId: 1, foodKey: 'chickenBreast', grams: 100, kcal: 165, proteinG, carbsG: 0, fatG: 3.6 }],
  createdAt: '2026-09-01T12:00:00.000Z',
})

describe('stepDaysDigest', () => {
  it('detecta una edición compensatoria (mismos count/total, distinta distribución)', () => {
    const before = [stepDay('2026-09-01', 9_999), stepDay('2026-09-02', 1)]
    // 9.999+1 → 10.000+0: cantidad de días y total siguen siendo 2 y 10.000.
    const after = [stepDay('2026-09-01', 10_000), stepDay('2026-09-02', 0)]
    expect(after.reduce((sum, d) => sum + d.steps, 0)).toBe(
      before.reduce((sum, d) => sum + d.steps, 0)
    )
    expect(stepDaysDigest(after)).not.toBe(stepDaysDigest(before))
  })

  it('incluye la distancia diaria (pasos-50km) aunque los pasos no cambien', () => {
    const before = [stepDay('2026-09-01', 10_000, 7)]
    const after = [stepDay('2026-09-01', 10_000, 8)]
    expect(stepDaysDigest(after)).not.toBe(stepDaysDigest(before))
  })
})

describe('workoutTimesDigest', () => {
  it('detecta un cambio de finishedAt sin cambiar la cantidad de sesiones', () => {
    const before = [workout()]
    const after = [workout({ finishedAt: '2026-09-01T12:30:00.000Z' })]
    expect(workoutTimesDigest(after)).not.toBe(workoutTimesDigest(before))
  })
})

describe('mealProteinByDayDigest', () => {
  it('detecta mover proteína entre días con el mismo total global', () => {
    const before = [meal(1, '2026-09-01', 60), meal(2, '2026-09-02', 40)]
    const after = [meal(1, '2026-09-01', 40), meal(2, '2026-09-02', 60)]
    expect(mealProteinByDayDigest(after)).not.toBe(mealProteinByDayDigest(before))
  })

  it('suma las comidas de un mismo día (maxDailyProteinG es por día)', () => {
    const digest = mealProteinByDayDigest([
      meal(1, '2026-09-01', 60),
      meal(2, '2026-09-01', 50),
    ])
    expect(digest).toBe('2026-09-01:110')
  })
})
