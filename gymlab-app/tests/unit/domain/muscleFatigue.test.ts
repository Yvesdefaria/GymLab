// F120/W1 — comportamiento de lastTrainedByMuscle con el mapa id→músculo del
// proveedor único (antes recibía el catálogo completo y construía el Map adentro).
// Se prueban valores exactos: la última fecha por músculo solo considera series
// completadas y workouts presentes en la lista.
import { describe, expect, it } from 'vitest'
import { fatigueMap, hoursSince, lastTrainedByMuscle } from '@/domain/muscleFatigue'
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
      pecho: new Date('2026-09-05T10:00:00.000Z'),
      espalda: new Date('2026-09-05T10:00:00.000Z'),
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

describe('fatiga con hora real (H7)', () => {
  it('ayer a las 20:00 consultado a las 09:00 son 13 h, no 33 h', () => {
    const now = new Date('2026-10-21T09:00:00')
    const at = new Date('2026-10-20T20:00:00')
    expect(hoursSince(at, now)).toBeCloseTo(13, 5)
    expect(fatigueMap({ pecho: at }, now).pecho).toBe('sore')
  })

  it('ayer a las 08:00 consultado a las 09:00 son 25 h → fatigued', () => {
    const now = new Date('2026-10-21T09:00:00')
    const at = new Date('2026-10-20T08:00:00')
    expect(hoursSince(at, now)).toBeCloseTo(25, 5)
    expect(fatigueMap({ pecho: at }, now).pecho).toBe('fatigued')
  })

  it('usa finishedAt cuando la sesión está cerrada', () => {
    const muscles = new Map<number, MuscleGroup>([[10, 'pecho']])
    const finished = {
      ...workout(1, '2026-09-01'),
      startedAt: '2026-09-01T10:00:00.000Z',
      finishedAt: '2026-09-01T12:00:00.000Z',
    }
    expect(
      lastTrainedByMuscle([finished], [set({ workoutId: 1, exerciseId: 10 })], muscles)
    ).toEqual({ pecho: new Date('2026-09-01T12:00:00.000Z') })
  })

  it('cae a startedAt cuando finishedAt es null', () => {
    const muscles = new Map<number, MuscleGroup>([[10, 'pecho']])
    const open = {
      ...workout(2, '2026-09-02'),
      startedAt: '2026-09-02T10:00:00.000Z',
      finishedAt: null,
    }
    expect(
      lastTrainedByMuscle([open], [set({ workoutId: 2, exerciseId: 10 })], muscles)
    ).toEqual({ pecho: new Date('2026-09-02T10:00:00.000Z') })
  })
})
