// Tests de métricas de serie compartidas (setStats): fecha local y e1rm promedio en rango.
// Captura el comportamiento antes disperso en goalProjection, pastComparison y plateauDetector.
import { describe, expect, it } from 'vitest'
import { setLocalDate, avgE1rmInRange } from '@/domain/setStats'
import type { WorkoutSet } from '@/domain/types'

const makeSet = (overrides: Partial<WorkoutSet> & { createdAt: string }): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 1,
  setNumber: 1,
  completed: true,
  isWarmup: false,
  weightKg: 100,
  reps: 5,
  ...overrides,
})

describe('setLocalDate', () => {
  it('extrae YYYY-MM-DD de un ISO completo', () => {
    expect(setLocalDate({ createdAt: '2026-08-28T21:30:00.000Z' })).toBe('2026-08-28')
  })

  it('deja intacta una fecha de solo día', () => {
    expect(setLocalDate({ createdAt: '2026-08-28' })).toBe('2026-08-28')
  })

  it('convierte un ISO sin zona horaria a fecha local', () => {
    expect(setLocalDate({ createdAt: '2026-08-28T21:30:00' })).toBe('2026-08-28')
  })
})

describe('avgE1rmInRange', () => {
  const sets: WorkoutSet[] = [
    makeSet({ id: 1, exerciseId: 1, weightKg: 100, reps: 5, createdAt: '2026-08-01T10:00:00' }),
    makeSet({ id: 2, exerciseId: 1, weightKg: 100, reps: 10, createdAt: '2026-08-15T10:00:00' }),
    makeSet({ id: 3, exerciseId: 1, weightKg: 80, reps: 5, createdAt: '2026-08-31T10:00:00' }),
    makeSet({ id: 4, exerciseId: 2, weightKg: 60, reps: 8, createdAt: '2026-08-10T10:00:00' }),
    makeSet({ id: 5, exerciseId: 1, completed: false, weightKg: 120, reps: 3, createdAt: '2026-08-10T10:00:00' }),
    makeSet({ id: 6, exerciseId: 1, isWarmup: true, weightKg: 120, reps: 3, createdAt: '2026-08-10T10:00:00' }),
    makeSet({ id: 7, exerciseId: 1, weightKg: 0, reps: 5, createdAt: '2026-08-10T10:00:00' }),
    makeSet({ id: 8, exerciseId: 1, weightKg: 50, reps: 0, createdAt: '2026-08-10T10:00:00' }),
  ]

  it('incluye el inicio del rango y excluye el fin', () => {
    const avg = avgE1rmInRange(sets, '2026-08-01', '2026-08-16', 1)
    const expected = (112.5 + 133.3) / 2
    expect(avg).toBeCloseTo(expected, 5)
  })

  it('ignora series incompletas, calentamientos, peso o reps inválidos', () => {
    expect(avgE1rmInRange(sets, '2026-08-01', '2026-08-16', 1)).toBeCloseTo((112.5 + 133.3) / 2, 5)
  })

  it('filtra por ejercicio cuando se indica', () => {
    expect(avgE1rmInRange(sets, '2026-08-01', '2026-08-31', 2)).toBe(74.5)
  })

  it('sin ejercicio promedia todas las series válidas del rango (excluye el día fin)', () => {
    const allValid = avgE1rmInRange(sets, '2026-08-01', '2026-08-31')
    expect(allValid).toBeGreaterThan(0)
    expect(allValid).toBeCloseTo((112.5 + 133.3 + 74.5) / 3, 1)
  })

  it('devuelve 0 cuando no hay series en el rango', () => {
    expect(avgE1rmInRange(sets, '2026-09-01', '2026-09-30', 1)).toBe(0)
  })

  it('promedia estimaciones Brzycki redondeadas de cada serie', () => {
    const only = [makeSet({ id: 9, weightKg: 100, reps: 5, createdAt: '2026-08-05T10:00:00' })]
    expect(avgE1rmInRange(only, '2026-08-01', '2026-09-01')).toBe(112.5)
  })

  it('trata exerciseId como opcional (undefined equivale a omitirlo)', () => {
    const a = avgE1rmInRange(sets, '2026-08-01', '2026-08-31')
    const b = avgE1rmInRange(sets, '2026-08-01', '2026-08-31', undefined)
    expect(a).toBe(b)
  })
})