// F120/W1 — comportamiento de lastTrainedByMuscle con el mapa id→músculo del
// proveedor único (antes recibía el catálogo completo y construía el Map adentro).
// Se prueban valores exactos: la última fecha por músculo solo considera series
// completadas y workouts presentes en la lista.
import { describe, expect, it } from 'vitest'
import { lastTrainedByMuscle } from '@/domain/muscleFatigue'
import type { MuscleGroup, Workout, WorkoutSet } from '@/domain/types'

const workout = (id: number, localDate: string): Workout => ({
  id,
  startedAt: `${localDate}T10:00:00.000Z`,
  finishedAt: null,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
  totalVolume: 0,
})

const set = (
  overrides: Partial<WorkoutSet> & { workoutId: number; exerciseId: number }
): WorkoutSet => ({
  id: overrides.workoutId * 100 + overrides.exerciseId,
  setNumber: 1,
  weightKg: 100,
  reps: 5,
  completed: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
})

describe('lastTrainedByMuscle (mapa id→músculo)', () => {
  it('devuelve la última fecha por músculo de las series completadas', () => {
    const workouts = [workout(1, '2026-09-01'), workout(2, '2026-09-05')]
    const sets = [
      set({ workoutId: 1, exerciseId: 10 }), // pecho el 01
      set({ workoutId: 2, exerciseId: 10 }), // pecho el 05 (más reciente)
      set({ workoutId: 2, exerciseId: 20 }), // espalda el 05
    ]
    const muscles = new Map<number, MuscleGroup>([
      [10, 'pecho'],
      [20, 'espalda'],
    ])

    expect(lastTrainedByMuscle(workouts, sets, muscles)).toEqual({
      pecho: '2026-09-05',
      espalda: '2026-09-05',
    })
  })

  it('ignora series incompletas, ejercicios sin músculo en el mapa y workouts ausentes', () => {
    const workouts = [workout(1, '2026-09-01')]
    const sets = [
      set({ workoutId: 1, exerciseId: 10, completed: false }),
      set({ workoutId: 1, exerciseId: 99 }), // sin entrada en el mapa
      set({ workoutId: 3, exerciseId: 10 }), // workout no listado
    ]
    const muscles = new Map<number, MuscleGroup>([[10, 'pierna']])

    expect(lastTrainedByMuscle(workouts, sets, muscles)).toEqual({})
  })

  it('sin series devuelve un mapa vacío', () => {
    expect(lastTrainedByMuscle([], [], new Map())).toEqual({})
  })
})
