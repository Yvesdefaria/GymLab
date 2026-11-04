import { describe, expect, it } from 'vitest'
import {
  ABANDON_DAYS,
  antagonistRatios,
  isAbandoned,
  lastTrainedByVolumeGroup,
  repDistributionByVolumeGroup,
  weeklyDirectByGroup,
} from '@/domain/volumeSignals'
import type { VolumeExerciseSample, VolumeSetSample, VolumeWorkoutSample } from '@/domain/volumeModel'

const workouts = new Map<number, VolumeWorkoutSample>([
  [1, { localDate: '2026-11-02' }],
  [2, { localDate: '2026-10-30' }],
  [3, { localDate: '2026-10-09' }],
])

const exercises = new Map<number, VolumeExerciseSample>([
  [10, { muscleGroup: 'pecho', name: 'Press de banca', slug: 'press-banca' }],
  [11, { muscleGroup: 'triceps', name: 'Extensión de tríceps', slug: 'extension-triceps' }],
  [12, { muscleGroup: 'espalda', name: 'Remo con barra', slug: 'remo' }],
  [13, { muscleGroup: 'biceps', name: 'Curl con barra', slug: 'curl' }],
  [14, {
    muscleGroup: 'pierna',
    name: 'Sentadilla',
    slug: 'sentadilla',
    muscleZones: ['pierna:cuadriceps'],
  }],
])

const set = (
  exerciseId: number,
  workoutId = 1,
  extra: Partial<VolumeSetSample> = {},
): VolumeSetSample => ({ exerciseId, workoutId, completed: true, ...extra })

const WINDOW_START = '2026-10-08'
const WINDOW_END = '2026-11-04'
const TODAY = '2026-11-04'

describe('lastTrainedByVolumeGroup', () => {
  it('usa la fecha más reciente por grupo', () => {
    const result = lastTrainedByVolumeGroup([set(14, 2), set(14, 1)], workouts, exercises, TODAY)
    expect(result.cuadriceps).toEqual({ date: '2026-11-02', daysAgo: 2 })
  })

  it('ignora calentamientos e incompletas', () => {
    const result = lastTrainedByVolumeGroup(
      [set(14, 1, { isWarmup: true }), set(14, 1, { completed: false })],
      workouts,
      exercises,
      TODAY,
    )
    expect(result.cuadriceps).toBeUndefined()
  })

  it('marca abandono solo por encima del umbral', () => {
    expect(ABANDON_DAYS).toBe(10)
    expect(isAbandoned({ date: '2026-10-20', daysAgo: 11 })).toBe(true)
    expect(isAbandoned({ date: '2026-10-21', daysAgo: 10 })).toBe(false)
    expect(isAbandoned(undefined)).toBe(false)
  })
})

describe('weeklyDirectByGroup', () => {
  it('reparte en 4 semanas y cuenta las semanas en cero', () => {
    const result = weeklyDirectByGroup([set(14, 3), set(14, 2)], workouts, exercises, WINDOW_START, WINDOW_END)
    expect(result.cuadriceps?.weeks).toEqual([1, 0, 0, 1])
    expect(result.cuadriceps?.zeroWeeks).toBe(2)
  })

  it('no incluye grupos sin series en la ventana', () => {
    const result = weeklyDirectByGroup([set(14, 1)], workouts, exercises, WINDOW_START, WINDOW_END)
    expect(result.pecho).toBeUndefined()
  })
})

describe('antagonistRatios', () => {
  it('alerta cuando un lado duplica al otro', () => {
    const [pushPull] = antagonistRatios({ pecho: 20, espalda: 10 })
    expect(pushPull.pair).toBe('pecho/espalda')
    expect(pushPull.alert).toBe(true)
    expect(pushPull.ratio).toBeCloseTo(21 / 11, 3)
  })

  it('no alerta con lados equilibrados', () => {
    const [pushPull] = antagonistRatios({ pecho: 10, espalda: 10 })
    expect(pushPull.ratio).toBe(1)
    expect(pushPull.alert).toBe(false)
  })

  it('no alerta con muestra chica', () => {
    const [pushPull] = antagonistRatios({ pecho: 2, espalda: 1 })
    expect(pushPull.alert).toBe(false)
  })

  it('evalúa también bíceps y tríceps', () => {
    const [, arms] = antagonistRatios({ biceps: 30, triceps: 5 })
    expect(arms.pair).toBe('biceps/triceps')
    expect(arms.alert).toBe(true)
  })
})

describe('repDistributionByVolumeGroup', () => {
  it('clasifica fuerza, hipertrofia y resistencia', () => {
    const result = repDistributionByVolumeGroup(
      [set(14, 1, { reps: 3 }), set(14, 1, { reps: 8 }), set(14, 1, { reps: 20 })],
      workouts,
      exercises,
      WINDOW_START,
      WINDOW_END,
    )
    expect(result.cuadriceps).toMatchObject({ strength: 1, hypertrophy: 1, endurance: 1, total: 3 })
  })

  it('ignora series sin reps o con reps 0', () => {
    const result = repDistributionByVolumeGroup(
      [set(14, 1), set(14, 1, { reps: 0 })],
      workouts,
      exercises,
      WINDOW_START,
      WINDOW_END,
    )
    expect(result.cuadriceps).toBeUndefined()
  })
})
