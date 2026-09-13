// Tests del agregador de historial de carga reciente (F97.4).
// Convención del repo: se testea la lógica pura exportada del hook
// (ver useExerciseCatalog.test.ts → filterExercises); el glue React/IndexedDB se
// cubre con el build y la regresión e2e.
import { describe, expect, it } from 'vitest'
import { aggregateRecentLoadAverages, RECENT_HISTORY_DAYS } from '@/hooks/useRecentLoadHistory'
import type { WorkoutSet } from '@/domain/types'

const ws = (
  workoutId: number,
  exerciseId: number,
  weightKg: number,
  overrides: Partial<WorkoutSet> = {}
): WorkoutSet => ({
  id: workoutId * 1000 + exerciseId,
  workoutId,
  exerciseId,
  setNumber: 1,
  weightKg,
  reps: 8,
  completed: true,
  createdAt: `2026-08-${String(workoutId).padStart(2, '0')}T10:00:00.000Z`,
  ...overrides,
})

describe('aggregateRecentLoadAverages', () => {
  it('agrupa por ejercicio y promedia el top set de sus últimas sesiones', () => {
    const sets = [
      ws(1, 10, 100),
      ws(2, 10, 110),
      ws(1, 20, 80),
    ]
    const averages = aggregateRecentLoadAverages(sets)
    expect(averages.get(10)).toBe(105)
    expect(averages.get(20)).toBe(80)
    expect(averages.size).toBe(2)
  })

  it('excluye warmups y series no completadas por ejercicio', () => {
    const sets = [
      ws(1, 10, 150, { isWarmup: true }),
      ws(1, 10, 200, { completed: false }),
      ws(1, 10, 100),
    ]
    expect(aggregateRecentLoadAverages(sets).get(10)).toBe(100)
  })

  it('omite los ejercicios sin datos válidos', () => {
    const sets = [ws(1, 10, 100), ws(1, 20, 80, { isWarmup: true })]
    const averages = aggregateRecentLoadAverages(sets)
    expect(averages.has(10)).toBe(true)
    expect(averages.has(20)).toBe(false)
  })

  it('devuelve un map vacío sin series', () => {
    expect(aggregateRecentLoadAverages([]).size).toBe(0)
  })

  it('limita la ventana a las N sesiones más recientes por ejercicio', () => {
    // La sesión más vieja (id 1) vale 60; las cinco recientes valen 100.
    const sets = [
      ws(1, 10, 60),
      ws(2, 10, 100),
      ws(3, 10, 100),
      ws(4, 10, 100),
      ws(5, 10, 100),
      ws(6, 10, 100),
    ]
    expect(aggregateRecentLoadAverages(sets).get(10)).toBe(100)
  })

  it('la ventana de historial por defecto es de 90 días', () => {
    expect(RECENT_HISTORY_DAYS).toBe(90)
  })
})
