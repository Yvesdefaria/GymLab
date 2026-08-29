// Tests del motor de sugerencias adaptativas y de la forma de entrada de la sesión.
import { describe, expect, it } from 'vitest'
import { completedSetsForSuggestions, getAdaptiveSuggestions } from '@/domain/adaptiveRoutine'
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

describe('getAdaptiveSuggestions', () => {
  it('respeta el flag `completed` del input (la entrada viene filtrada a series hechas)', () => {
    const sets = [
      { exerciseId: 10, weightKg: 120, reps: 4, setNumber: 1, completed: true },
      { exerciseId: 10, weightKg: 120, reps: 4, setNumber: 2, completed: true },
    ]
    const prs = [{ exerciseId: 10, weightKg: 95, reps: 5, date: '2026-08-01', estimated1RM: 105 }]
    const suggestions = getAdaptiveSuggestions(sets, [10], prs)
    // Promedio real de e1RM (~131) > PR anterior (105) → sugiere subir peso.
    const s = suggestions.find((x) => x.exerciseId === 10)!
    expect(s.reason).toBe('increase')
    expect(s.reasonText).toContain('Subir peso')
  })

  it('marca `maintain` sin datos suficientes', () => {
    const suggestions = getAdaptiveSuggestions([], [10], [])
    expect(suggestions.find((x) => x.exerciseId === 10)!.reason).toBe('maintain')
  })
})