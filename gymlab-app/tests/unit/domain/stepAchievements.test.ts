// Tests TDD de las medidas de pasos (F109.1): deriveStepStats devuelve las
// magnitudes numéricas (total, máximo diario, racha ≥10k, ventana de 7 días y
// mes calendario) que alimentan el sistema unificado de medallas. La definición
// y evaluación de los logros de pasos vive ahora en el catálogo general.
import { describe, expect, it } from 'vitest'
import { deriveStepStats } from '@/domain/stepAchievements'
import type { DailyStepsEntry } from '@/domain/types'

describe('deriveStepStats', () => {
  const day = (localDate: string, steps: number, distanceKm = 0): DailyStepsEntry => ({
    id: 1,
    localDate,
    steps,
    distanceKm,
    calories: 0,
    source: 'manual',
    syncedAt: '2026-09-01T00:00:00.000Z',
  })

  it('sin días devuelve todo en 0', () => {
    expect(deriveStepStats([])).toEqual({
      stepsTotal: 0,
      stepsMaxDay: 0,
      steps10kRun: 0,
      steps7dWindow: 0,
      stepsMonth: 0,
      distanceKm: 0,
    })
  })

  it('suma total, máximo diario y distancia', () => {
    const stats = deriveStepStats([day('2026-09-01', 8_000, 6.1), day('2026-09-02', 12_500, 9.4)])
    expect(stats.stepsTotal).toBe(20_500)
    expect(stats.stepsMaxDay).toBe(12_500)
    expect(stats.distanceKm).toBeCloseTo(15.5)
  })

  it('steps10kRun mide la racha más larga de días ≥10k (un día flojo la corta)', () => {
    const stats = deriveStepStats([
      day('2026-09-01', 10_200),
      day('2026-09-02', 11_000),
      day('2026-09-03', 9_400), // corta la serie
      day('2026-09-04', 10_500),
      day('2026-09-05', 12_000),
      day('2026-09-06', 10_100),
    ])
    expect(stats.steps10kRun).toBe(3)
  })

  it('steps7dWindow toma la mejor ventana de 7 días calendario', () => {
    const stats = deriveStepStats([
      day('2026-09-01', 30_000),
      day('2026-09-04', 25_000),
      day('2026-09-20', 60_000),
    ])
    expect(stats.steps7dWindow).toBe(60_000)
  })

  it('stepsMonth toma el mejor mes calendario', () => {
    const stats = deriveStepStats([
      day('2026-08-30', 20_000),
      day('2026-09-01', 25_000),
      day('2026-09-15', 25_000),
      day('2026-09-28', 25_000),
    ])
    expect(stats.stepsMonth).toBe(75_000)
  })
})
