import { describe, expect, it } from 'vitest'
import {
  ABANDON_DAYS,
  antagonistRatios,
  buildActionableSignals,
  isAbandoned,
  lastTrainedByVolumeGroup,
  PAIR_GROUPS,
  repDistributionByVolumeGroup,
  REST_MAX_DAYS,
  REST_MIN_DAYS,
  restBetweenExposuresByVolumeGroup,
  weeklyDirectByGroup,
} from '@/domain/volumeSignals'
import type { VolumeExerciseSample, VolumeGroupStat, VolumeSetSample, VolumeWorkoutSample } from '@/domain/volumeModel'
import type { VolumeGroup } from '@/domain/volumeGroup'

const workouts = new Map<number, VolumeWorkoutSample>([
  [1, { localDate: '2026-11-02' }],
  [2, { localDate: '2026-10-30' }],
  [3, { localDate: '2026-10-09' }],
  [4, { localDate: '2026-11-01' }],
  [5, { localDate: '2026-10-31' }],
  [6, { localDate: '2026-10-26' }],
  [7, { localDate: '2026-10-23' }],
  [8, { localDate: '2026-10-20' }],
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

describe('restBetweenExposuresByVolumeGroup', () => {
  it('mide la mediana de los huecos entre exposiciones', () => {
    // 09, 30 oct y 02 nov → huecos 21 y 3 → mediana 12
    const result = restBetweenExposuresByVolumeGroup(
      [set(14, 3), set(14, 2), set(14, 1)],
      workouts,
      exercises,
      WINDOW_START,
      WINDOW_END,
    )
    expect(result.cuadriceps).toMatchObject({ exposures: 3, median: 12, status: 'detrained' })
    expect(REST_MAX_DAYS).toBe(10)
  })

  it('marca sin recuperación cuando entrena días consecutivos', () => {
    // 31 oct y 01 nov → hueco 1
    const result = restBetweenExposuresByVolumeGroup(
      [set(14, 5), set(14, 4)],
      workouts,
      exercises,
      WINDOW_START,
      WINDOW_END,
    )
    expect(result.cuadriceps).toMatchObject({ exposures: 2, median: 1, status: 'under' })
    expect(REST_MIN_DAYS).toBe(2)
  })

  it('deja ok con tres días entre exposiciones', () => {
    // 20, 23 y 26 oct → huecos 3 y 3
    const result = restBetweenExposuresByVolumeGroup(
      [set(14, 8), set(14, 7), set(14, 6)],
      workouts,
      exercises,
      WINDOW_START,
      WINDOW_END,
    )
    expect(result.cuadriceps).toMatchObject({ median: 3, status: 'ok' })
  })

  it('promedia los dos huecos centrales con cantidad par', () => {
    // 09, 20, 23, 26 y 30 oct → huecos 11, 3, 3 y 4 → mediana (3 + 4) / 2 = 3,5
    const result = restBetweenExposuresByVolumeGroup(
      [set(14, 3), set(14, 8), set(14, 7), set(14, 6), set(14, 2)],
      workouts,
      exercises,
      WINDOW_START,
      WINDOW_END,
    )
    expect(result.cuadriceps).toMatchObject({ exposures: 5, median: 3.5 })
  })

  it('no incluye grupos con una sola exposición', () => {
    const result = restBetweenExposuresByVolumeGroup([set(14, 1)], workouts, exercises, WINDOW_START, WINDOW_END)
    expect(result.cuadriceps).toBeUndefined()
  })

  it('ignora calentamientos y series incompletas', () => {
    const result = restBetweenExposuresByVolumeGroup(
      [set(14, 1), set(14, 2, { isWarmup: true }), set(14, 3, { completed: false })],
      workouts,
      exercises,
      WINDOW_START,
      WINDOW_END,
    )
    expect(result.cuadriceps).toBeUndefined()
  })
})

const stat = (
  group: VolumeGroup,
  weekly: number,
  state: VolumeGroupStat['state'] = 'bajo',
  alert = true,
): VolumeGroupStat => ({
  group,
  direct: weekly * 4,
  effective: weekly * 4,
  weekly,
  target: { min: 12, max: 16, alert: 'always' },
  state,
  alert,
})

describe('buildActionableSignals', () => {
  it('elige el déficit más grande con su acción', () => {
    const [signal] = buildActionableSignals({
      stats: [stat('cuadriceps', 6), stat('isquios', 8)],
      lastTrained: {},
      antagonists: [],
    })
    expect(signal).toEqual({ kind: 'deficit', group: 'cuadriceps', gap: 6 })
  })

  it('agrega el abandono más antiguo sin repetir grupo', () => {
    const signals = buildActionableSignals({
      stats: [stat('cuadriceps', 6)],
      lastTrained: {
        cuadriceps: { date: '2026-10-01', daysAgo: 34 },
        espalda: { date: '2026-10-20', daysAgo: 15 },
      },
      antagonists: [],
    })
    expect(signals.map((signal) => signal.kind)).toEqual(['deficit', 'abandoned'])
    expect(signals[1]).toMatchObject({ kind: 'abandoned', group: 'espalda', daysAgo: 15 })
  })

  it('agrega el antagonista desbalanceado', () => {
    const signals = buildActionableSignals({
      stats: [stat('cuadriceps', 6)],
      lastTrained: {},
      antagonists: antagonistRatios({ pecho: 30, espalda: 10 }),
    })
    expect(signals[1]).toEqual({
      kind: 'antagonist',
      pair: 'pecho/espalda',
      stronger: 'pecho',
      weaker: 'espalda',
      ratio: 31 / 11,
    })
  })

  it('no repite el grupo en dos señales', () => {
    const signals = buildActionableSignals({
      stats: [stat('cuadriceps', 6)],
      lastTrained: { cuadriceps: { date: '2026-10-01', daysAgo: 34 } },
      antagonists: [],
    })
    expect(signals).toHaveLength(1)
  })

  it('devuelve vacío sin señales y respeta el límite', () => {
    expect(
      buildActionableSignals({ stats: [stat('pecho', 12, 'dentro', false)], lastTrained: {}, antagonists: [] }),
    ).toEqual([])
    const many = buildActionableSignals({
      stats: [stat('cuadriceps', 1), stat('isquios', 2), stat('pecho', 3), stat('espalda', 4)],
      lastTrained: {},
      antagonists: [],
      limit: 2,
    })
    expect(many).toHaveLength(2)
  })

  it('mapea cada par antagonista a sus grupos', () => {
    expect(PAIR_GROUPS['pecho/espalda']).toEqual(['pecho', 'espalda'])
    expect(PAIR_GROUPS['biceps/triceps']).toEqual(['biceps', 'triceps'])
  })
})
