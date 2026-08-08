// Tests de las estadísticas de entrenamiento (frecuencia semanal, duración, volumen por músculo, velas OHLC y objetivo semanal).
import { describe, expect, it } from 'vitest'
import type { Exercise, Workout, WorkoutSet } from './types'
import {
  avgSessionDurationMin,
  buildLoadRangeSeries,
  buildVolumeRangeSeries,
  maxStreakDays,
  trainedDaysInLast,
  volumeByMuscleGroup,
  weeklyFrequency,
  weeklyGoalProgress,
  workoutsInCurrentWeek,
} from './trainingStats'

const workout = (
  id: number,
  localDate: string,
  opts: Partial<Workout> = {}
): Workout => ({
  id,
  startedAt: `${localDate}T18:00:00.000Z`,
  finishedAt: `${localDate}T19:00:00.000Z`,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
  totalVolume: 100,
  ...opts,
})

const set = (
  id: number,
  workoutId: number,
  exerciseId: number,
  setNumber: number,
  weightKg: number,
  opts: Partial<WorkoutSet> = {}
): WorkoutSet => ({
  id,
  workoutId,
  exerciseId,
  setNumber,
  weightKg,
  reps: 10,
  completed: true,
  createdAt: `${new Date().toISOString()}`,
  ...opts,
})

const exercises: Exercise[] = [
  {
    id: 1,
    slug: 'press-banca',
    name: 'Press de banca',
    muscleGroup: 'pecho',
    equipment: 'barra',
    instructions: '',
  },
  {
    id: 2,
    slug: 'sentadilla',
    name: 'Sentadilla',
    muscleGroup: 'pierna',
    equipment: 'barra',
    instructions: '',
  },
]
const exerciseById = new Map(exercises.map((e) => [e.id, e]))

describe('weeklyFrequency', () => {
  it('agrupa por semana calendario (lunes) en orden cronológico', () => {
    const workouts = [
      workout(1, '2026-01-05', { totalVolume: 1 }),
      workout(2, '2026-01-07', { totalVolume: 1 }),
      workout(3, '2026-01-12', { totalVolume: 1 }),
    ]
    expect(weeklyFrequency(workouts)).toEqual([
      { week: '2026-01-05', count: 2 },
      { week: '2026-01-12', count: 1 },
    ])
  })
})

describe('avgSessionDurationMin', () => {
  it('promedia solo las sesiones terminadas', () => {
    const workouts = [
      workout(1, '2026-01-05', { startedAt: '2026-01-05T18:00:00.000Z', finishedAt: '2026-01-05T18:30:00.000Z' }),
      workout(2, '2026-01-06', { startedAt: '2026-01-06T18:00:00.000Z', finishedAt: '2026-01-06T19:30:00.000Z' }),
      workout(3, '2026-01-07', { startedAt: '2026-01-07T18:00:00.000Z', finishedAt: null }),
    ]
    expect(avgSessionDurationMin(workouts)).toBe(60)
  })

  it('devuelve null sin sesiones terminadas', () => {
    expect(avgSessionDurationMin([workout(1, '2026-01-05', { finishedAt: null })])).toBeNull()
  })
})

describe('trainedDaysInLast', () => {
  it('cuenta días distintos entrenados dentro de la ventana', () => {
    const workouts = [
      workout(1, '2026-01-05'),
      workout(2, '2026-01-05'),
      workout(3, '2026-01-20'),
    ]
    expect(trainedDaysInLast(workouts, 10, new Date('2026-01-25T12:00:00'))).toBe(1)
    expect(trainedDaysInLast(workouts, 30, new Date('2026-01-25T12:00:00'))).toBe(2)
  })
})

describe('maxStreakDays', () => {
  it('devuelve la racha más larga de días consecutivos', () => {
    const workouts = [
      workout(1, '2026-01-05'),
      workout(2, '2026-01-06'),
      workout(3, '2026-01-07'),
      workout(4, '2026-01-10'),
      workout(5, '2026-01-11'),
    ]
    expect(maxStreakDays(workouts)).toBe(3)
  })
})

describe('volumeByMuscleGroup', () => {
  it('suma el volumen por grupo muscular de las series completadas', () => {
    const workoutsById = new Map<number, Workout>([
      [1, workout(1, '2026-01-05')],
      [2, workout(2, '2026-01-06')],
    ])
    const sets = [
      set(1, 1, 1, 1, 50), // pecho 50×10
      set(2, 1, 1, 2, 60), // pecho 60×10
      set(3, 2, 2, 1, 80), // pierna 80×10
    ]
    const result = volumeByMuscleGroup(sets, workoutsById, exerciseById)
    expect(result[0]).toEqual({ muscle: 'pecho', volume: 1100 })
    expect(result[1]).toEqual({ muscle: 'pierna', volume: 800 })
  })

  it('ignora series sin completar, sin peso o de ejercicios desconocidos', () => {
    const workoutsById = new Map<number, Workout>([[1, workout(1, '2026-01-05')]])
    const sets = [
      set(1, 1, 1, 1, 50, { completed: false }),
      set(2, 1, 1, 1, 50, { weightKg: 0 }),
      set(3, 1, 99, 1, 50),
    ]
    expect(volumeByMuscleGroup(sets, workoutsById, exerciseById)).toEqual([])
  })
})

describe('buildLoadRangeSeries', () => {
  const workoutsById = new Map<number, Workout>([
    [1, workout(1, '2026-01-05')],
    [2, workout(2, '2026-01-09')],
  ])

  it('construye una vela OHLC por sesión del ejercicio (sin calentamientos)', () => {
    const sets = [
      set(1, 1, 1, 1, 60, { isWarmup: true }),
      set(2, 1, 1, 2, 80),
      set(3, 1, 1, 3, 100),
      set(4, 1, 1, 4, 90),
      set(5, 2, 1, 1, 85),
      set(6, 2, 2, 1, 40), // otro ejercicio, se descarta
    ]
    const points = buildLoadRangeSeries(sets, workoutsById, 1)
    expect(points).toEqual([
      { date: '2026-01-05', open: 80, close: 90, high: 100, low: 80 },
      { date: '2026-01-09', open: 85, close: 85, high: 85, low: 85 },
    ])
  })

  it('devuelve vacío si no hay series válidas', () => {
    expect(buildLoadRangeSeries([], workoutsById, 1)).toEqual([])
  })
})

describe('buildVolumeRangeSeries', () => {
  it('agrupa por semana y calcula open/close/high/low del volumen diario', () => {
    const workouts = [
      workout(1, '2026-01-05', { totalVolume: 100 }), // lunes
      workout(2, '2026-01-06', { totalVolume: 300 }),
      workout(3, '2026-01-08', { totalVolume: 200 }),
    ]
    expect(buildVolumeRangeSeries(workouts)).toEqual([
      { week: '2026-01-05', open: 100, close: 200, high: 300, low: 100 },
    ])
  })
})

describe('weeklyGoalProgress', () => {
  it('calcula el progreso de la semana actual sobre el objetivo', () => {
    const workouts = [
      workout(1, '2026-01-05'),
      workout(2, '2026-01-07'),
      workout(3, '2026-01-12'),
    ]
    expect(weeklyGoalProgress(workouts, 4, new Date('2026-01-08T12:00:00'))).toBe(0.5)
    expect(weeklyGoalProgress(workouts, 4, new Date('2026-01-15T12:00:00'))).toBe(0.25)
  })

  it('nunca supera 1 y devuelve 0 con objetivo inválido', () => {
    const workouts = [workout(1, '2026-01-05')]
    expect(weeklyGoalProgress(workouts, 1, new Date('2026-01-08T12:00:00'))).toBe(1)
    expect(weeklyGoalProgress(workouts, 0)).toBe(0)
  })
})

describe('workoutsInCurrentWeek', () => {
  it('cuenta los entrenos de la semana actual', () => {
    const workouts = [
      workout(1, '2026-01-05'),
      workout(2, '2026-01-07'),
      workout(3, '2026-01-12'),
    ]
    expect(workoutsInCurrentWeek(workouts, new Date('2026-01-08T12:00:00'))).toBe(2)
    expect(workoutsInCurrentWeek(workouts, new Date('2026-01-15T12:00:00'))).toBe(1)
  })
})
