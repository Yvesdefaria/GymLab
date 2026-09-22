// Tests de caracterización del dominio de benchmarks: estimación de 1RM (Brzycki),
// recordatorio de re-test, mejora entre tests, orden por fecha y último resultado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RECOMMENDED_WEEKS_BETWEEN_TESTS,
  calcImprovement,
  estimate1RM,
  getLatest,
  shouldRetest,
  sortByDate,
} from '@/domain/benchmark'
import type { BenchmarkExercise } from '@/domain/benchmark'
import type { BenchmarkResult } from '@/domain/types'

// Fila de benchmark ya calculada: e1rm es el único campo que comparan mejora y orden.
const mkResult = (
  id: number,
  exercise: BenchmarkExercise,
  e1rm: number,
  testedAt: string,
): BenchmarkResult => ({ id, exercise, weightKg: e1rm, reps: 5, e1rm, testedAt })

describe('estimate1RM', () => {
  it('aplica la fórmula de Brzycki exacta: 100 kg x 5 reps → 112.5', () => {
    expect(estimate1RM(100, 5)).toBe(112.5)
  })

  it('devuelve el peso tal cual con 1 repetición', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })

  it('estima ~106.67 con 80 kg x 10 reps', () => {
    expect(estimate1RM(80, 10)).toBeCloseTo(106.67, 1)
  })

  it('devuelve 0 con 0 repeticiones', () => {
    expect(estimate1RM(100, 0)).toBe(0)
  })

  it('devuelve 0 con peso negativo', () => {
    expect(estimate1RM(-5, 5)).toBe(0)
  })
})

describe('RECOMMENDED_WEEKS_BETWEEN_TESTS', () => {
  it('recomienda 6 semanas entre tests', () => {
    expect(RECOMMENDED_WEEKS_BETWEEN_TESTS).toBe(6)
  })
})

describe('shouldRetest', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve true sin test previo (nunca se testeó)', () => {
    expect(shouldRetest(null)).toBe(true)
  })

  it('devuelve false a las 4 semanas', () => {
    expect(shouldRetest('2026-02-01T12:00:00Z')).toBe(false)
  })

  it('devuelve false a los 41 días (5 semanas y 6 días)', () => {
    expect(shouldRetest('2026-01-19T12:00:00Z')).toBe(false)
  })

  it('devuelve true a los 42 días exactos (el umbral es >= 6 semanas)', () => {
    expect(shouldRetest('2026-01-18T12:00:00Z')).toBe(true)
  })

  it('devuelve true pasadas ~7 semanas', () => {
    expect(shouldRetest('2026-01-10T12:00:00Z')).toBe(true)
  })
})

describe('calcImprovement', () => {
  it('devuelve null sin benchmark previo', () => {
    expect(calcImprovement(mkResult(2, 'sentadilla', 120, '2026-02-01T12:00:00Z'), null)).toBeNull()
  })

  it('calcula delta y porcentaje de mejora', () => {
    const current = mkResult(2, 'sentadilla', 120, '2026-02-01T12:00:00Z')
    const previous = mkResult(1, 'sentadilla', 100, '2026-01-01T12:00:00Z')
    expect(calcImprovement(current, previous)).toEqual({ delta: 20, pct: 20 })
  })

  it('calcula delta y porcentaje de retroceso', () => {
    const current = mkResult(2, 'sentadilla', 90, '2026-02-01T12:00:00Z')
    const previous = mkResult(1, 'sentadilla', 100, '2026-01-01T12:00:00Z')
    expect(calcImprovement(current, previous)).toEqual({ delta: -10, pct: -10 })
  })

  it('evita la división por cero con e1rm previo 0 (pct 0)', () => {
    const current = mkResult(2, 'sentadilla', 100, '2026-02-01T12:00:00Z')
    const previous = mkResult(1, 'sentadilla', 0, '2026-01-01T12:00:00Z')
    expect(calcImprovement(current, previous)).toEqual({ delta: 100, pct: 0 })
  })
})

describe('sortByDate', () => {
  const oldSquat = mkResult(1, 'sentadilla', 100, '2026-01-10T12:00:00Z')
  const bench = mkResult(2, 'banca', 90, '2026-03-01T12:00:00Z')
  const newSquat = mkResult(3, 'sentadilla', 110, '2026-02-01T12:00:00Z')

  it('ordena de más reciente a más antiguo', () => {
    expect(sortByDate([oldSquat, bench, newSquat]).map((r) => r.id)).toEqual([2, 3, 1])
  })

  it('no muta el array original', () => {
    const original = [oldSquat, bench, newSquat]
    const sorted = sortByDate(original)
    expect(original.map((r) => r.id)).toEqual([1, 2, 3])
    expect(sorted).not.toBe(original)
  })
})

describe('getLatest', () => {
  it('devuelve el test más reciente del ejercicio pedido', () => {
    const oldSquat = mkResult(1, 'sentadilla', 100, '2026-01-01T12:00:00Z')
    const newSquat = mkResult(2, 'sentadilla', 110, '2026-02-01T12:00:00Z')
    const bench = mkResult(3, 'banca', 90, '2026-03-01T12:00:00Z')
    expect(getLatest([oldSquat, newSquat, bench], 'sentadilla')).toBe(newSquat)
  })

  it('devuelve null con lista vacía', () => {
    expect(getLatest([], 'sentadilla')).toBeNull()
  })
})
