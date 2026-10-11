// Tests de agrupación de superseries en la sesión.
import { describe, expect, it } from 'vitest'
import {
  clampGroupIndex,
  firstIncompleteGroupIndex,
  groupExercises,
  groupFingerprint,
  groupsCompletionSignature,
  isGroupComplete,
  nextAutoAdvance,
  nextIncompleteGroupIndex,
  uniqueGroupKeys,
} from '@/domain/sessionGroups'
import type { CompletionRow, ExerciseGroup } from '@/domain/sessionGroups'
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

// Grupo de ejercicios reales del test: `ReturnType<typeof groupExercises>` resuelve a la
// constraint genérica (sets sin `id`) y ya no satisface las funciones que leen la huella.
type ActiveGroup = ExerciseGroup<ActiveExercise>

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
  const signature = (groups: ActiveGroup[]) =>
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

  it('con superserie incompleta y suelto completo resume ambos bits y la huella', () => {
    const groups = groupExercises([
      ex(1, 'A', [set('s1', true)]),
      ex(2, 'A', [set('s2', false)]),
      ex(3, undefined, [set('s3', true)]),
    ])
    expect(signature(groups)).toBe('A:0:s1|s2|solo-3:1:s3')
  })

  it('cambia si un grupo gana una serie aunque la completitud no cambie', () => {
    const before = groupExercises([ex(1, undefined, [set('s1', false)])])
    const after = groupExercises([ex(1, undefined, [set('s1', false), set('s2', false)])])
    expect(signature(before)).not.toBe(signature(after))
  })
})

// 113a/113.R3-002/R3-001: la decisión pura del auto-avance que antes vivía dentro del
// efecto de SessionCarousel (no montable sin jsdom). La identidad entre renders es la huella
// estable del grupo (composición de set-ids), no una heurística sobre el texto de la key:
// el renombre por borrado/colisión no atribuye transiciones ajenas (113b/R3-001) y las keys
// intactas siguen avanzando en el mismo pase (113.R3-002).
describe('nextAutoAdvance (113a/113.R3-002/R3-001)', () => {
  const groupsOf = (exercises: ActiveExercise[]) => groupExercises(exercises)
  // Flujo real de dos pasos, como el componente: primer render con el mapa vacío, segundo
  // con el mapa persistido del render anterior.
  const step = (
    previous: ReadonlyMap<string, CompletionRow>,
    groups: ActiveGroup[]
  ) => nextAutoAdvance(previous, groups, uniqueGroupKeys(groups))

  it('E1 groupFingerprint: compone los set-ids del grupo en orden de render', () => {
    const [group] = groupExercises([
      ex(1, 'A', [set('sa', false), set('sb', false)]),
      ex(2, 'A', [set('sc', false)]),
    ])
    expect(groupFingerprint(group)).toBe('sa|sb|sc')
    // Mismo contenido reconstruido → misma huella (el renombre de keys no la toca).
    const [rebuilt] = groupExercises([
      ex(1, 'A', [set('sa', false), set('sb', true)]),
      ex(2, 'A', [set('sc', false)]),
    ])
    expect(groupFingerprint(rebuilt)).toBe(groupFingerprint(group))
    // Agregar una serie cambia la huella.
    const [extended] = groupExercises([
      ex(1, 'A', [set('sa', false), set('sb', false), set('sd', false)]),
      ex(2, 'A', [set('sc', false)]),
    ])
    expect(groupFingerprint(extended)).not.toBe(groupFingerprint(group))
  })

  it('E2 avanza al siguiente incompleto en la transición incompleto→completo', () => {
    const r1 = step(
      new Map(),
      groupsOf([ex(1, undefined, [set('s1', false)]), ex(2, undefined, [set('s2', false)])])
    )
    const r2 = step(
      r1.current,
      groupsOf([ex(1, undefined, [set('s1', true)]), ex(2, undefined, [set('s2', false)])])
    )
    expect(r2.target).toBe(1)
    expect(r2.current.get('solo-1')).toEqual({ complete: true, fingerprint: 's1' })
    expect(r2.current.get('solo-2')).toEqual({ complete: false, fingerprint: 's2' })
  })

  it('E3 rename R3-001: el superviviente renombrado no hereda la transición de la key', () => {
    const r1 = step(
      new Map(),
      groupsOf([
        ex(7, undefined, [set('sa', false)]),
        ex(7, undefined, [set('sb', true)]),
        ex(8, undefined, [set('sc', false)]),
      ])
    )
    const r2 = step(
      r1.current,
      groupsOf([ex(7, undefined, [set('sb', true)]), ex(8, undefined, [set('sc', false)])])
    )
    expect(r2.target).toBeNull()
  })

  it('E4 113b inverso: el eliminado completo y el superviviente incompleto no avanzan', () => {
    const r1 = step(
      new Map(),
      groupsOf([
        ex(7, undefined, [set('sa', true)]),
        ex(7, undefined, [set('sb', false)]),
        ex(8, undefined, [set('sc', false)]),
      ])
    )
    const r2 = step(
      r1.current,
      groupsOf([ex(7, undefined, [set('sb', false)]), ex(8, undefined, [set('sc', false)])])
    )
    expect(r2.target).toBeNull()
  })

  it('E5 guard label literal «Push #2»: el reordenamiento de keys homónimas no avanza', () => {
    const r1 = step(
      new Map(),
      groupsOf([
        ex(1, 'Push #2', [set('p1', false)]),
        ex(2, undefined, [set('s2', false)]),
        ex(3, 'Push #2', [set('p3', true)]),
        ex(4, undefined, [set('s4', false)]),
      ])
    )
    const r2 = step(
      r1.current,
      groupsOf([
        ex(2, undefined, [set('s2', false)]),
        ex(3, 'Push #2', [set('p3', true)]),
        ex(4, undefined, [set('s4', false)]),
      ])
    )
    expect(r2.target).toBeNull()
  })

  it('E6 guard regresión labels distintos: «A#2» intacto sí avanza al completarse', () => {
    const r1 = step(
      new Map(),
      groupsOf([
        ex(1, 'A', [set('a1', false)]),
        ex(2, 'A#2', [set('b2', false)]),
        ex(3, undefined, [set('c3', false)]),
      ])
    )
    const r2 = step(
      r1.current,
      groupsOf([ex(2, 'A#2', [set('b2', true)]), ex(3, undefined, [set('c3', false)])])
    )
    expect(r2.target).toBe(1)
  })

  it('E7 per-grupo 113.R3-002: A completa y B se borra en el MISMO pase → avanza por A', () => {
    const r1 = step(
      new Map(),
      groupsOf([
        ex(1, undefined, [set('s1', false)]),
        ex(2, undefined, [set('s2', false)]),
        ex(3, undefined, [set('s3', false)]),
      ])
    )
    const r2 = step(
      r1.current,
      groupsOf([ex(1, undefined, [set('s1', true)]), ex(3, undefined, [set('s3', false)])])
    )
    expect(r2.target).toBe(1)
  })

  it('E8 un grupo nuevo no dispara por sí mismo: avanza la transición real y el nuevo es el destino', () => {
    const r1 = step(new Map(), groupsOf([ex(1, undefined, [set('s1', false)])]))
    const r2 = step(
      r1.current,
      groupsOf([ex(1, undefined, [set('s1', true)]), ex(3, undefined, [set('s3', false)])])
    )
    expect(r2.target).toBe(1)
  })

  it('E9 un grupo sin series cuenta como incompleto (destino válido)', () => {
    const r1 = step(
      new Map(),
      groupsOf([ex(1, undefined, [set('s1', false)]), ex(2, undefined, [])])
    )
    const r2 = step(
      r1.current,
      groupsOf([ex(1, undefined, [set('s1', true)]), ex(2, undefined, [])])
    )
    expect(r2.target).toBe(1)
  })

  it('E10 composición cambiada no atribuye: la huella cambió aunque la completitud no', () => {
    const r1 = step(new Map(), groupsOf([ex(1, undefined, [set('s1', false)])]))
    const r2 = step(
      r1.current,
      groupsOf([ex(1, undefined, [set('s1', true), set('s2', false)])])
    )
    expect(r2.target).toBeNull()
  })

  it('E11 flujo addSet→completar: el ref refrescado por composición atribuye la transición real', () => {
    const r1 = step(
      new Map(),
      groupsOf([ex(1, undefined, [set('s1', false)]), ex(2, undefined, [set('p2', false)])])
    )
    const r2 = step(
      r1.current,
      groupsOf([
        ex(1, undefined, [set('s1', false), set('s2', false)]),
        ex(2, undefined, [set('p2', false)]),
      ])
    )
    expect(r2.target).toBeNull()
    const r3 = step(
      r2.current,
      groupsOf([
        ex(1, undefined, [set('s1', true), set('s2', true)]),
        ex(2, undefined, [set('p2', false)]),
      ])
    )
    expect(r3.target).toBe(1)
  })

  it('E12 sin destino: si no queda ningún incompleto después no hay avance', () => {
    const r1 = step(new Map(), groupsOf([ex(1, undefined, [set('s1', false)])]))
    const r2 = step(r1.current, groupsOf([ex(1, undefined, [set('s1', true)])]))
    expect(r2.target).toBeNull()
  })
})
