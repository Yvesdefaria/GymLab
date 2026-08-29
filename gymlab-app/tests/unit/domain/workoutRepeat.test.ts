import { describe, it, expect } from 'vitest'
import { buildRepeatItems, type RepeatSetInput } from '@/domain/workoutRepeat'

const set = (exerciseId: number, setNumber: number, extra: Partial<RepeatSetInput> = {}): RepeatSetInput => ({
  exerciseId,
  setNumber,
  weightKg: 100,
  reps: 8,
  completed: true,
  ...extra,
})

describe('buildRepeatItems', () => {
  it('agrupa las series por ejercicio conservando setNumber', () => {
    const items = buildRepeatItems([set(1, 1), set(2, 1), set(1, 2)], (id) =>
      id === 1 ? 'Sentadilla' : undefined
    )
    expect(items).toHaveLength(2)
    expect(items[0].exerciseName).toBe('Sentadilla')
    expect(items[0].sets.map((s) => s.setNumber)).toEqual([1, 2])
    expect(items[1].sets).toHaveLength(1)
  })

  it('marca todas las series como pendientes (completed false)', () => {
    const items = buildRepeatItems([set(1, 1), set(1, 2)], () => 'X')
    expect(items[0].sets.every((s) => s.completed === false)).toBe(true)
  })

  it('usa fallback de nombre cuando no hay coincidencia', () => {
    const items = buildRepeatItems([set(7, 1)], () => undefined)
    expect(items[0].exerciseName).toBe('Ejercicio 7')
  })

  it('preserva peso/reps, superset, rpe/rir y flags', () => {
    const items = buildRepeatItems(
      [set(1, 1, { supersetGroup: 'A', rpe: 8, rir: 2, weightKg: 120, reps: 6, isWarmup: true })],
      () => 'X'
    )
    expect(items[0].sets[0]).toMatchObject({
      exerciseId: 1,
      supersetGroup: 'A',
      rpe: 8,
      rir: 2,
      weightKg: 120,
      reps: 6,
      isWarmup: true,
    })
  })

  it('genera ids únicos por ejercicio y setNumber', () => {
    const items = buildRepeatItems([set(1, 1), set(1, 2), set(1, 3)], () => 'X')
    const ids = items[0].sets.map((s) => s.id)
    expect(new Set(ids).size).toBe(3)
    expect(ids[0]).toMatch(/^repeat-\d+-1-1$/)
  })
})