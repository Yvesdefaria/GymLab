// Tests de la forma de entrada del motor de sugerencias de sesión (F97.2): la antigua
// `adaptiveRoutine` se retiró y `completedSetsForSuggestions` vive ahora en sessionSuggestions.
import { describe, expect, it } from 'vitest'
import { completedSetsForSuggestions } from '@/domain/sessionSuggestions'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'

const set = (id: string, completed: boolean, weightKg: number, reps: number): ActiveSet => ({
  id,
  exerciseId: 1,
  exerciseName: 'Fake',
  setNumber: 1,
  weightKg,
  reps,
  completed,
})

const ex = (exerciseId: number, sets: ActiveSet[]): ActiveExercise => ({
  exerciseId,
  exerciseName: `Ex${exerciseId}`,
  sets,
})

describe('completedSetsForSuggestions', () => {
  it('devuelve solo series completadas con peso, marcadas como completadas (forma del motor)', () => {
    const result = completedSetsForSuggestions([
      ex(1, [set('s1', true, 40, 8), set('s2', true, 0, 8)]),
      ex(2, [set('s3', false, 60, 8)]),
    ])
    expect(result).toEqual([
      { exerciseId: 1, weightKg: 40, reps: 8, rpe: undefined, rir: undefined, setNumber: 1, completed: true },
    ])
  })

  it('devuelve [] sin series completadas con peso', () => {
    expect(completedSetsForSuggestions([ex(1, [set('s1', true, 0, 8)])])).toEqual([])
  })
})
