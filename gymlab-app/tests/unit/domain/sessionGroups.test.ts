// Tests de agrupación de superseries en la sesión.
import { describe, expect, it } from 'vitest'
import {
  clampGroupIndex,
  firstIncompleteGroupIndex,
  groupExercises,
  groupsCompletionSignature,
  isGroupComplete,
  nextIncompleteGroupIndex,
  uniqueGroupKeys,
} from '@/domain/sessionGroups'
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

  it('no fusiona ejercicios sueltos consecutivos: cada suelto es su propio grupo', () => {
    const groups = groupExercises([ex(1, undefined, []), ex(2, undefined, [])])
    expect(groups.map((g) => g.label)).toEqual([null, null])
    expect(groups.map((g) => g.exercises.map((e) => e.exerciseId))).toEqual([[1], [2]])
  })
})

describe('isGroupComplete', () => {
  it('solo es completa si todos los ejercicios tienen todas las series hechas', () => {
    expect(isGroupComplete({ key: 'x', label: null, exercises: [ex(1, undefined, [set('s1', true), set('s2', true)])] })).toBe(true)
    expect(isGroupComplete({ key: 'x', label: null, exercises: [ex(1, undefined, [set('s1', true), set('s2', false)])] })).toBe(false)
    expect(isGroupComplete({ key: 'x', label: null, exercises: [ex(1, undefined, [set('s1', true)]), ex(2, undefined, [set('s2', false)])] })).toBe(false)
  })
})

describe('firstIncompleteGroupIndex', () => {
  it('devuelve el primer grupo incompleto', () => {
    const groups = groupExercises([
      ex(1, undefined, [set('s1', true)]),
      ex(2, undefined, [set('s2', false)]),
      ex(3, undefined, [set('s3', false)]),
    ])
    expect(firstIncompleteGroupIndex(groups)).toBe(1)
  })

  it('con todos completos devuelve 0 (el carrusel arranca en el primero)', () => {
    const groups = groupExercises([ex(1, undefined, [set('s1', true)])])
    expect(firstIncompleteGroupIndex(groups)).toBe(0)
  })

  it('con lista vacía devuelve 0', () => {
    expect(firstIncompleteGroupIndex([])).toBe(0)
  })
})

describe('nextIncompleteGroupIndex', () => {
  it('devuelve el siguiente incompleto después de un índice', () => {
    const groups = groupExercises([
      ex(1, undefined, [set('s1', true)]),
      ex(2, undefined, [set('s2', true)]),
      ex(3, undefined, [set('s3', false)]),
    ])
    expect(nextIncompleteGroupIndex(groups, 1)).toBe(2)
  })

  it('devuelve null si no queda ningún incompleto después', () => {
    const groups = groupExercises([ex(1, undefined, [set('s1', true)])])
    expect(nextIncompleteGroupIndex(groups, 0)).toBeNull()
  })
})

describe('clampGroupIndex', () => {
  it('recorta al último índice válido (anterior) cuando el índice quedó fuera', () => {
    expect(clampGroupIndex(3, 2)).toBe(1)
  })

  it('conserva los índices válidos', () => {
    expect(clampGroupIndex(1, 3)).toBe(1)
  })

  it('con cero grupos devuelve 0', () => {
    expect(clampGroupIndex(2, 0)).toBe(0)
  })
})

// F120/CAR-1: el efecto de auto-avance del carrusel se firma con este string en vez
// de `groups` por identidad, para no reconstruir el mapa de transiciones por tecla.
describe('groupsCompletionSignature (F120/CAR-1)', () => {
  const signature = (groups: ReturnType<typeof groupExercises>) =>
    groupsCompletionSignature(groups, uniqueGroupKeys(groups))

  it('es idéntica entre renders con grupos reconstruidos pero igual estado', () => {
    const build = () =>
      groupExercises([ex(1, undefined, [set('s1', false)]), ex(2, 'A', [set('s2', true)])])
    expect(signature(build())).toBe(signature(build()))
  })

  it('cambia cuando cualquier grupo pasa a completo', () => {
    const before = groupExercises([ex(1, undefined, [set('s1', false)])])
    const after = groupExercises([ex(1, undefined, [set('s1', true)])])
    expect(signature(before)).not.toBe(signature(after))
  })

  it('cambia si la composición (claves) cambia aunque los bits de completitud no', () => {
    const one = groupExercises([ex(1, undefined, [set('s1', false)])])
    const other = groupExercises([ex(2, undefined, [set('s2', false)])])
    expect(signature(one)).not.toBe(signature(other))
  })

  it('con superserie incompleta y suelto completo resume ambos bits', () => {
    const groups = groupExercises([
      ex(1, 'A', [set('s1', true)]),
      ex(2, 'A', [set('s2', false)]),
      ex(3, undefined, [set('s3', true)]),
    ])
    expect(signature(groups)).toBe('A:0|solo-3:1')
  })
})