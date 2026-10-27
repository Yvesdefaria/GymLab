// La migración v17 debe reconstruir PRs y volumen con una sola regla. Este test
// fija los bordes que más duelen: warmup, reps fuera del cap e idempotencia.
import { describe, expect, it } from 'vitest'
import { rebuildPrsAndVolumes } from '@/data/migrations/rebuildPrsAndVolumes'
import type { WorkoutSet } from '@/domain/types'

const set = (over: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 7,
  setNumber: 1,
  weightKg: 80,
  reps: 5,
  completed: true,
  createdAt: '2026-10-20T18:05:00.000Z',
  ...over,
})

describe('rebuildPrsAndVolumes', () => {
  it('reconstruye un récord por reps y excluye el warmup del volumen y del PR', () => {
    const result = rebuildPrsAndVolumes([
      set({ id: 1, weightKg: 40, reps: 20, isWarmup: true }), // 800, fuera
      set({ id: 2, weightKg: 80, reps: 5 }), // 400
      set({ id: 3, weightKg: 80, reps: 5 }), // 400
      set({ id: 4, weightKg: 100, reps: 1 }), // 100
      set({ id: 5, weightKg: 60, reps: 12 }), // 720
    ])

    expect(result.volumeByWorkout.get(1)).toBe(1620)
    expect(result.prs).toHaveLength(3)
    expect(result.prs.find((pr) => pr.reps === 1)?.weightKg).toBe(100)
    expect(result.prs.find((pr) => pr.reps === 5)?.weightKg).toBe(80)
    expect(result.prs.find((pr) => pr.reps === 12)?.weightKg).toBe(60)
    expect(result.prs.some((pr) => pr.reps === 20)).toBe(false)
  })

  it('suma volumen de una serie de 13 reps pero no la convierte en PR', () => {
    const result = rebuildPrsAndVolumes([set({ weightKg: 50, reps: 13 })])
    expect(result.volumeByWorkout.get(1)).toBe(650)
    expect(result.prs).toHaveLength(0)
  })

  it('ignora series incompletas o sin peso', () => {
    const result = rebuildPrsAndVolumes([
      set({ completed: false }),
      set({ id: 2, weightKg: 0 }),
      set({ id: 3, reps: 0 }),
    ])
    expect(result.volumeByWorkout.size).toBe(0)
    expect(result.prs).toHaveLength(0)
  })

  it('se queda con el mayor peso por ejercicio y reps', () => {
    const result = rebuildPrsAndVolumes([
      set({ id: 1, weightKg: 80, reps: 5 }),
      set({ id: 2, weightKg: 85, reps: 5 }),
      set({ id: 3, exerciseId: 9, weightKg: 120, reps: 5 }),
    ])
    expect(result.prs.find((pr) => pr.exerciseId === 7 && pr.reps === 5)?.weightKg).toBe(85)
    expect(result.prs.find((pr) => pr.exerciseId === 9 && pr.reps === 5)?.weightKg).toBe(120)
  })

  it('es idempotente: el mismo input devuelve el mismo resultado', () => {
    const sets = [set({ id: 1 }), set({ id: 2, weightKg: 85 })]
    expect(rebuildPrsAndVolumes(sets)).toEqual(rebuildPrsAndVolumes(sets))
  })
})
