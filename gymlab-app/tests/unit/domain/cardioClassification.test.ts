/**
 * Regresión: el cardio se decide por la categoría real del ejercicio en el catálogo,
 * NUNCA por tener durationSeconds. Plancha, estiramientos y movilidad también se miden
 * en segundos, y una serie de fuerza contaminada con duración no debe verse como cardio.
 */
import { describe, expect, it } from 'vitest'
import { isCardioCategory } from '@/domain/exerciseCategory'
import { cardioExercisesWithData } from '@/domain/trainingStats'
import type { Exercise, ExerciseCategory, WorkoutSet } from '@/domain/types'

const makeExercise = (id: number, category: ExerciseCategory): Exercise => ({
  id,
  slug: `ex-${id}`,
  name: `Ejercicio ${id}`,
  muscleGroup: 'pecho',
  equipment: 'peso corporal',
  instructions: '',
  category,
})

const makeSet = (overrides: Partial<WorkoutSet>): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 1,
  setNumber: 1,
  weightKg: 0,
  reps: 0,
  completed: true,
  createdAt: '2026-09-14T10:00:00.000Z',
  ...overrides,
})

describe('isCardioCategory', () => {
  it('solo la categoría cardio es cardio', () => {
    expect(isCardioCategory('cardio')).toBe(true)
    expect(isCardioCategory('strength')).toBe(false)
    expect(isCardioCategory('stretch')).toBe(false)
    expect(isCardioCategory('mobility')).toBe(false)
    expect(isCardioCategory(undefined)).toBe(false)
  })
})

describe('cardioExercisesWithData', () => {
  it('excluye un ejercicio de fuerza con durationSeconds (serie contaminada)', () => {
    const pushups = makeExercise(42, 'strength')
    const sets = [makeSet({ exerciseId: 42, weightKg: 0, reps: 20, durationSeconds: 45 })]
    expect(cardioExercisesWithData(sets, [pushups])).toEqual([])
  })

  it('excluye un ejercicio por tiempo pero no cardio (plancha) aunque tenga duración', () => {
    const plank = makeExercise(36, 'strength')
    const sets = [makeSet({ exerciseId: 36, durationSeconds: 60 })]
    expect(cardioExercisesWithData(sets, [plank])).toEqual([])
  })

  it('incluye un ejercicio cardio con duración completada', () => {
    const run = makeExercise(500, 'cardio')
    const sets = [makeSet({ exerciseId: 500, durationSeconds: 1200, distanceMeters: 3000 })]
    expect(cardioExercisesWithData(sets, [run]).map((e) => e.id)).toEqual([500])
  })

  it('incluye cardio con solo distancia y descarta series sin completar', () => {
    const bike = makeExercise(501, 'cardio')
    const sets = [
      makeSet({ id: 1, exerciseId: 501, distanceMeters: 5000 }),
      makeSet({ id: 2, exerciseId: 501, completed: false, durationSeconds: 600 }),
    ]
    expect(cardioExercisesWithData(sets, [bike]).map((e) => e.id)).toEqual([501])
  })
})
