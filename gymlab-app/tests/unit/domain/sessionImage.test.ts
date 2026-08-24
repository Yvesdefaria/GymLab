// Tests de exportación de sesión como imagen (F75).
import { describe, it, expect } from 'vitest'
import { prepareSessionImage } from '@/domain/sessionImage'
import type { Workout, WorkoutSet } from '@/domain/types'

const makeWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 1,
  startedAt: '2025-08-24T10:00:00Z',
  finishedAt: '2025-08-24T11:00:00Z',
  routineId: null,
  routineDayId: null,
  localDate: '2025-08-24',
  notes: '',
  totalVolume: 1200,
  ...overrides,
})

const makeSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 10,
  setNumber: 1,
  weightKg: 80,
  reps: 8,
  completed: true,
  createdAt: '2025-08-24T10:05:00Z',
  ...overrides,
})

// ─── Duración ──────────────────────────────────────────────────

describe('prepareSessionImage — duración', () => {
  it('calcula duración en minutos entre startedAt y finishedAt', () => {
    const workout = makeWorkout({
      startedAt: '2025-08-24T10:00:00Z',
      finishedAt: '2025-08-24T11:00:00Z',
    })
    const result = prepareSessionImage(workout, [], new Map(), 0)
    expect(result.duration).toBe('60 min')
  })

  it('redondea duración al minuto más cercano', () => {
    const workout = makeWorkout({
      startedAt: '2025-08-24T10:00:00Z',
      finishedAt: '2025-08-24T10:45:30Z',
    })
    const result = prepareSessionImage(workout, [], new Map(), 0)
    expect(result.duration).toBe('46 min')
  })

  it('si finishedAt es null, usa Date.now() (duración >= 0)', () => {
    const workout = makeWorkout({ finishedAt: null })
    const result = prepareSessionImage(workout, [], new Map(), 0)
    const mins = parseInt(result.duration)
    expect(mins).toBeGreaterThanOrEqual(0)
  })
})

// ─── Agrupación de ejercicios ──────────────────────────────────

describe('prepareSessionImage — ejercicios', () => {
  it('agrupa series completadas por ejercicio', () => {
    const sets = [
      makeSet({ exerciseId: 10, completed: true, weightKg: 80, reps: 8 }),
      makeSet({ id: 2, exerciseId: 10, setNumber: 2, completed: true, weightKg: 85, reps: 6 }),
      makeSet({ id: 3, exerciseId: 20, completed: true, weightKg: 50, reps: 10 }),
    ]
    const names = new Map([[10, 'Press banca'], [20, 'Curl']])
    const result = prepareSessionImage(makeWorkout(), sets, names, 0)
    expect(result.exercises).toHaveLength(2)
  })

  it('ignora series no completadas', () => {
    const sets = [
      makeSet({ exerciseId: 10, completed: true }),
      makeSet({ id: 2, exerciseId: 10, completed: false }),
    ]
    const names = new Map([[10, 'Press banca']])
    const result = prepareSessionImage(makeWorkout(), sets, names, 0)
    expect(result.exercises[0].sets).toBe(1)
  })

  it('usa nombre del mapa o fallback "Ejercicio {id}"', () => {
    const sets = [makeSet({ exerciseId: 99, completed: true })]
    const names = new Map<number, string>()
    const result = prepareSessionImage(makeWorkout(), sets, names, 0)
    expect(result.exercises[0].name).toBe('Ejercicio 99')
  })

  it('calcula peso máximo por ejercicio', () => {
    const sets = [
      makeSet({ exerciseId: 10, weightKg: 80 }),
      makeSet({ id: 2, exerciseId: 10, weightKg: 90 }),
      makeSet({ id: 3, exerciseId: 10, weightKg: 70 }),
    ]
    const names = new Map([[10, 'Press']])
    const result = prepareSessionImage(makeWorkout(), sets, names, 0)
    expect(result.exercises[0].weight).toBe(90)
  })

  it('retorna array vacío si no hay series completadas', () => {
    const sets = [makeSet({ completed: false })]
    const result = prepareSessionImage(makeWorkout(), sets, new Map(), 0)
    expect(result.exercises).toHaveLength(0)
  })
})

// ─── Campos estáticos ──────────────────────────────────────────

describe('prepareSessionImage — campos estáticos', () => {
  it('date = workout.localDate', () => {
    const result = prepareSessionImage(makeWorkout({ localDate: '2025-12-25' }), [], new Map(), 0)
    expect(result.date).toBe('2025-12-25')
  })

  it('volume = workout.totalVolume', () => {
    const result = prepareSessionImage(makeWorkout({ totalVolume: 5000 }), [], new Map(), 0)
    expect(result.volume).toBe(5000)
  })

  it('prCount se pasa sin modificar', () => {
    const result = prepareSessionImage(makeWorkout(), [], new Map(), 7)
    expect(result.prCount).toBe(7)
  })

  it('appName es GymLab', () => {
    const result = prepareSessionImage(makeWorkout(), [], new Map(), 0)
    expect(result.appName).toBe('GymLab')
  })
})

// ─── Integración ───────────────────────────────────────────────

describe('prepareSessionImage — integración', () => {
  it('pipeline completo con datos variados', () => {
    const workout = makeWorkout({
      startedAt: '2025-08-24T09:00:00Z',
      finishedAt: '2025-08-24T10:30:00Z',
      totalVolume: 3500,
      localDate: '2025-08-24',
    })
    const sets = [
      makeSet({ exerciseId: 1, completed: true, weightKg: 100, reps: 5 }),
      makeSet({ id: 2, exerciseId: 1, completed: true, weightKg: 100, reps: 5 }),
      makeSet({ id: 3, exerciseId: 2, completed: true, weightKg: 60, reps: 10 }),
      makeSet({ id: 4, exerciseId: 2, completed: false, weightKg: 60, reps: 10 }),
      makeSet({ id: 5, exerciseId: 3, completed: true, weightKg: 40, reps: 12 }),
    ]
    const names = new Map([[1, 'Sentadilla'], [2, 'Peso muerto'], [3, 'Remo']])
    const result = prepareSessionImage(workout, sets, names, 2)

    expect(result.date).toBe('2025-08-24')
    expect(result.duration).toBe('90 min')
    expect(result.volume).toBe(3500)
    expect(result.exercises).toHaveLength(3)
    expect(result.prCount).toBe(2)
    expect(result.appName).toBe('GymLab')
  })
})
