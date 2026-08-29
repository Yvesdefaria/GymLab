// Tests de agrupación de superseries en la sesión.
import { describe, expect, it } from 'vitest'
import { groupExercises, isGroupComplete } from '@/domain/sessionGroups'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'

const set = (id: string, completed: boolean): ActiveSet => ({
  id,
  exerciseId: 1,
  exerciseName: 'Fake',
  setNumber: 1,
  weightKg: 60,
  reps: 10,
  completed,
})

const ex = (
  exerciseId: number,
  supersetGroup: string | undefined,
  sets: ActiveSet[]
): ActiveExercise => ({ exerciseId, exerciseName: `Ex${exerciseId}`, supersetGroup, sets })

describe('groupExercises', () => {
  it('agrupa ejercicios consecutivos que comparten superset y separa los solitarios', () => {
    const groups = groupExercises([
      ex(1, 'A', []),
      ex(2, 'A', []),
      ex(3, undefined, []),
      ex(4, 'B', []),
    ])
    expect(groups.map((g) => g.label)).toEqual(['A', null, 'B'])
    expect(groups[0].exercises.map((e) => e.exerciseId)).toEqual([1, 2])
    expect(groups[2].exercises.map((e) => e.exerciseId)).toEqual([4])
  })

  it('no mezcla supersets con el mismo nombre separados por otro ejercicio', () => {
    const groups = groupExercises([ex(1, 'A', []), ex(2, undefined, []), ex(3, 'A', [])])
    expect(groups.map((g) => g.label)).toEqual(['A', null, 'A'])
  })
})

describe('isGroupComplete', () => {
  it('solo es completa si todos los ejercicios tienen todas las series hechas', () => {
    expect(isGroupComplete({ key: 'x', label: null, exercises: [ex(1, undefined, [set('s1', true), set('s2', true)])] })).toBe(true)
    expect(isGroupComplete({ key: 'x', label: null, exercises: [ex(1, undefined, [set('s1', true), set('s2', false)])] })).toBe(false)
    expect(isGroupComplete({ key: 'x', label: null, exercises: [ex(1, undefined, [set('s1', true)]), ex(2, undefined, [set('s2', false)])] })).toBe(false)
  })
})