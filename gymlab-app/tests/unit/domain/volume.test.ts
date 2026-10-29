// Volumen de entrenamiento: una sola política para todas las pantallas.
import { describe, expect, it } from 'vitest'
import { calcBodyweightReps, calcSessionVolume, calcTotalVolume } from '@/domain/volume'

const set = (over: Partial<Parameters<typeof calcTotalVolume>[0][number]> = {}) => ({
  completed: true,
  weightKg: 100,
  reps: 5,
  ...over,
})

describe('calcTotalVolume', () => {
  it('suma solo series de trabajo', () => {
    expect(
      calcTotalVolume([
        set({ weightKg: 40, reps: 20, isWarmup: true }), // 800, no cuenta
        set({ weightKg: 80, reps: 5 }), // 400
        set({ weightKg: 80, reps: 5 }), // 400
        set({ completed: false, weightKg: 100, reps: 5 }), // no cuenta
      ])
    ).toBe(800)
  })

  it('devuelve 0 sin series válidas', () => {
    expect(calcTotalVolume([set({ isWarmup: true }), set({ completed: false })])).toBe(0)
  })
})

describe('calcBodyweightReps', () => {
  it('suma reps de series sin carga y excluye warmups e incompletas', () => {
    expect(
      calcBodyweightReps([
        set({ weightKg: 0, reps: 10 }),
        set({ weightKg: 0, reps: 8 }),
        set({ weightKg: 0, reps: 12, isWarmup: true }),
        set({ weightKg: 0, reps: 5, completed: false }),
        set({ weightKg: 20, reps: 5 }),
      ])
    ).toBe(18)
  })
})

describe('calcSessionVolume', () => {
  it('incluye calentamientos completados para el total informativo', () => {
    expect(
      calcSessionVolume([
        set({ weightKg: 40, reps: 20, isWarmup: true }), // 800
        set({ weightKg: 80, reps: 5 }), // 400
        set({ completed: false, weightKg: 100, reps: 5 }), // no cuenta
      ])
    ).toBe(1200)
  })
})
