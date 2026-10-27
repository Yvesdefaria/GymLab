// Tests de progreso y chequeos de la sesión en curso.
import { describe, expect, it } from 'vitest'
import { computeSessionStats, countZeroWeightSets } from '@/domain/sessionProgress'

type LikeSet = {
  completed: boolean
  weightKg: number
}
type LikeExercise = { sets: LikeSet[] }

describe('countZeroWeightSets', () => {
  it('cuenta solo series completadas sin peso', () => {
    const exercises: LikeExercise[] = [
      { sets: [{ completed: true, weightKg: 0 }, { completed: true, weightKg: 60 }] },
      { sets: [{ completed: true, weightKg: 0 }, { completed: false, weightKg: 0 }] },
    ]
    expect(countZeroWeightSets(exercises)).toBe(2)
  })

  it('devuelve 0 si todas las series completadas tienen peso', () => {
    const exercises: LikeExercise[] = [
      { sets: [{ completed: true, weightKg: 40 }, { completed: false, weightKg: 0 }] },
    ]
    expect(countZeroWeightSets(exercises)).toBe(0)
  })

  it('no cuenta un calentamiento sin peso como serie pendiente', () => {
    const exercises = [
      { sets: [{ completed: true, weightKg: 0, reps: 0, isWarmup: true }] },
    ]
    expect(countZeroWeightSets(exercises)).toBe(0)
  })
})

describe('computeSessionStats', () => {
  it('excluye los calentamientos del volumen de entrenamiento', () => {
    const stats = computeSessionStats([
      {
        sets: [
          { completed: true, weightKg: 40, reps: 20, isWarmup: true }, // 800, no cuenta
          { completed: true, weightKg: 80, reps: 5 }, // 400
          { completed: false, weightKg: 100, reps: 5 },
        ],
      },
    ])
    expect(stats.totalVolume).toBe(400)
    expect(stats.completedSets).toBe(2)
    expect(stats.totalSets).toBe(3)
  })
})