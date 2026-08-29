// Tests de progreso y chequeos de la sesión en curso.
import { describe, expect, it } from 'vitest'
import { countZeroWeightSets } from '@/domain/sessionProgress'

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
})