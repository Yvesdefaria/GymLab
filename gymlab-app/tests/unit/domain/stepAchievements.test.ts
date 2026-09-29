// Tests TDD de los logros de pasos (F84a): 8 logros definidos con umbrales fijos
// y evaluación pura sobre el histórico diario (racha, ventanas semanales/mensuales,
// acumulado total y maratón).
import { describe, expect, it } from 'vitest'
import {
  STEP_ACHIEVEMENTS,
  deriveStepStats,
  getUnlockedStepAchievements,
  getStepAchievementsWithStatus,
} from '@/domain/stepAchievements'
import { addLocalDays } from '@/domain/dates'
import type { DailyStepsEntry } from '@/domain/types'

const day = (localDate: string, steps: number): DailyStepsEntry => ({
  id: 1,
  localDate,
  steps,
  distanceKm: 0,
  calories: 0,
  source: 'manual',
  syncedAt: '2026-09-07T10:00:00.000Z',
})

// Días consecutivos desde `start`, todos con `steps`.
const run = (start: string, daysCount: number, steps: number): DailyStepsEntry[] =>
  Array.from({ length: daysCount }, (_, i) => day(addLocalDays(start, i), steps))

// Solo los ids desbloqueados, en el orden de STEP_ACHIEVEMENTS.
const ids = (days: DailyStepsEntry[]): string[] => getUnlockedStepAchievements(days).map((a) => a.id)

describe('STEP_ACHIEVEMENTS', () => {
  it('define 8 logros con ids únicos y claves i18n e icono', () => {
    const allIds = STEP_ACHIEVEMENTS.map((a) => a.id)
    expect(allIds).toHaveLength(8)
    expect(new Set(allIds).size).toBe(8)
    for (const a of STEP_ACHIEVEMENTS) {
      expect(a.titleKey).toBeTruthy()
      expect(a.descriptionKey).toBeTruthy()
      expect(a.icon).toBeTruthy()
    }
  })
})

describe('getUnlockedStepAchievements', () => {
  it('sin registros → 0 logros', () => {
    expect(ids([])).toEqual([])
  })

  it('un día con 0 pasos no cuenta como registro (0 logros)', () => {
    expect(ids([day('2026-09-07', 0)])).toEqual([])
  })

  it('primer día con pasos → primeros-pasos', () => {
    expect(ids([day('2026-09-07', 500)])).toEqual(['primeros-pasos'])
  })

  it('un día de 10.000 pasos → primeros-pasos + diez-mil-dia', () => {
    expect(ids([day('2026-09-07', 10_000)])).toEqual(['primeros-pasos', 'diez-mil-dia'])
  })

  it('9.999 pasos no desbloquea diez-mil-dia (umbral inclusivo)', () => {
    expect(ids([day('2026-09-07', 9_999)])).toEqual(['primeros-pasos'])
  })

  it('7 días seguidos de 10.000 → racha-7-dias', () => {
    expect(ids(run('2026-09-01', 7, 10_000))).toEqual([
      'primeros-pasos',
      'diez-mil-dia',
      'racha-7-dias',
      'cincuenta-mil-semana',
    ])
  })

  it('6 días seguidos no desbloquea racha-7-dias', () => {
    expect(ids(run('2026-09-01', 6, 10_000))).toEqual([
      'primeros-pasos',
      'diez-mil-dia',
      'cincuenta-mil-semana',
    ])
  })

  it('un día por debajo del umbral corta la racha (3+3 → sin racha-7)', () => {
    const days = [
      ...run('2026-09-01', 3, 10_000),
      day('2026-09-04', 9_999),
      ...run('2026-09-05', 3, 10_000),
    ]
    expect(ids(days)).toEqual(['primeros-pasos', 'diez-mil-dia', 'cincuenta-mil-semana'])
  })

  it('30 días seguidos de 10.000 → racha-30-dias', () => {
    const expected = [
      'primeros-pasos',
      'diez-mil-dia',
      'racha-7-dias',
      'racha-30-dias',
      'cincuenta-mil-semana',
      'doscientos-mil-mes',
    ]
    expect(ids(run('2026-06-01', 30, 10_000))).toEqual(expected)
  })

  it('29 días seguidos no desbloquea racha-30-dias', () => {
    expect(ids(run('2026-06-01', 29, 10_000))).not.toContain('racha-30-dias')
  })

  it('una semana de 7.500/día (52.500) → cincuenta-mil-semana', () => {
    expect(ids(run('2026-09-01', 7, 7_500))).toContain('cincuenta-mil-semana')
  })

  it('6 días de 8.000 (48.000) no llegan a 50k semanales', () => {
    expect(ids(run('2026-09-01', 6, 8_000))).not.toContain('cincuenta-mil-semana')
  })

  it('un mes de 7.500/día (202.500 en junio) → doscientos-mil-mes', () => {
    expect(ids(run('2026-06-01', 27, 7_500))).toContain('doscientos-mil-mes')
  })

  it('26 días de 7.500 (195.000) no llegan a 200k mensuales', () => {
    expect(ids(run('2026-06-01', 26, 7_500))).not.toContain('doscientos-mil-mes')
  })

  it('100 días de 10.000 → millon-total (1.000.000 acumulado)', () => {
    expect(ids(run('2026-06-01', 100, 10_000))).toContain('millon-total')
  })

  it('99 días de 10.000 (990.000) no desbloquea millon-total', () => {
    expect(ids(run('2026-06-01', 99, 10_000))).not.toContain('millon-total')
  })

  it('un día de 42.000 pasos → maraton', () => {
    expect(ids([day('2026-09-07', 42_000)])).toEqual(['primeros-pasos', 'diez-mil-dia', 'maraton'])
  })

  it('41.999 pasos no es maratón', () => {
    expect(ids([day('2026-09-07', 41_999)])).not.toContain('maraton')
  })

  it('los logros salen en el orden de definición (escalada natural)', () => {
    const unlocked = ids(run('2026-06-01', 100, 10_000))
    expect(unlocked).toEqual([
      'primeros-pasos',
      'diez-mil-dia',
      'racha-7-dias',
      'racha-30-dias',
      'cincuenta-mil-semana',
      'doscientos-mil-mes',
      'millon-total',
    ])
  })
})

describe('getStepAchievementsWithStatus (galería de /logros, F84f)', () => {
  it('devuelve siempre los 8 logros en orden de definición', () => {
    const withStatus = getStepAchievementsWithStatus([])
    expect(withStatus).toHaveLength(8)
    expect(withStatus.map((s) => s.def.id)).toEqual(STEP_ACHIEVEMENTS.map((a) => a.id))
  })

  it('sin registros → los 8 bloqueados', () => {
    const withStatus = getStepAchievementsWithStatus([])
    expect(withStatus.every((s) => !s.unlocked)).toBe(true)
  })

  it('los desbloqueados coinciden con getUnlockedStepAchievements', () => {
    const days = run('2026-09-01', 7, 10_000)
    const withStatus = getStepAchievementsWithStatus(days)
    const expected = getUnlockedStepAchievements(days).map((a) => a.id)
    expect(withStatus.filter((s) => s.unlocked).map((s) => s.def.id)).toEqual(expected)
  })

  it('cada entrada conserva la def completa (claves i18n, icono y check)', () => {
    for (const { def, unlocked } of getStepAchievementsWithStatus([])) {
      expect(def.titleKey).toBeTruthy()
      expect(def.descriptionKey).toBeTruthy()
      expect(def.icon).toBeTruthy()
      expect(typeof def.check).toBe('function')
      expect(typeof unlocked).toBe('boolean')
    }
  })
})

// F109.1: medidas numéricas para el sistema unificado de medallas.
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