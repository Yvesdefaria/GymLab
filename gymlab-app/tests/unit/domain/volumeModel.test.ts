import { describe, expect, it } from 'vitest'
import {
  buildCoverageReport,
  countVolumeSets,
  toWeeklySets,
  WINDOW_DAYS,
  type VolumeExerciseSample,
  type VolumeSetSample,
  type VolumeWorkoutSample,
} from '@/domain/volumeModel'

const workouts = new Map<number, VolumeWorkoutSample>([
  [1, { localDate: '2026-11-04' }],
  [2, { localDate: '2026-09-01' }],
])

const exercises = new Map<number, VolumeExerciseSample>([
  [10, { muscleGroup: 'pecho', name: 'Press de banca', slug: 'press-banca', muscleZones: ['pecho:medio'] }],
  [11, {
    muscleGroup: 'triceps',
    name: 'Extensión de tríceps',
    slug: 'extension-triceps',
    muscleZones: ['triceps:lateral'],
  }],
  [12, { muscleGroup: 'pierna', name: 'Sentadilla', slug: 'sentadilla', muscleZones: ['pierna:cuadriceps'] }],
  [13, { muscleGroup: 'pierna', name: 'Ejercicio raro', slug: 'raro' }],
  [14, { muscleGroup: 'espalda', name: 'Peso muerto convencional', slug: 'peso-muerto' }],
  [15, { muscleGroup: 'espalda', name: 'Peso muerto rumano', slug: 'peso-muerto-rumano' }],
  [16, { muscleGroup: 'hombro', name: 'Press militar', slug: 'press-militar' }],
  [17, { muscleGroup: 'pierna', name: 'Bicicleta', slug: 'bicicleta', category: 'cardio' }],
])

const set = (
  exerciseId: number,
  workoutId = 1,
  extra: Partial<VolumeSetSample> = {},
): VolumeSetSample => ({ exerciseId, workoutId, completed: true, ...extra })

const WINDOW_START = '2026-10-08'
const WINDOW_END = '2026-11-04'

const count = (sets: VolumeSetSample[]) =>
  countVolumeSets(sets, workouts, exercises, WINDOW_START, WINDOW_END)

describe('countVolumeSets', () => {
  it('cuenta directas y suma 0,5 a los sinérgicos del press de banca', () => {
    const result = count([set(10), set(10), set(10), set(10), set(11), set(11)])
    expect(result.direct.pecho).toBe(4)
    expect(result.direct.triceps).toBe(2)
    expect(result.effective.pecho).toBe(4)
    expect(result.effective.triceps).toBe(4)
  })

  it('ignora calentamientos, series incompletas y series fuera de la ventana', () => {
    const result = count([
      set(10, 1, { isWarmup: true }),
      set(10, 1, { completed: false }),
      set(10, 2),
      set(10),
    ])
    expect(result.total).toBe(1)
    expect(result.direct.pecho).toBe(1)
  })

  it('el peso muerto convencional reparte isquios 1,0 y sinérgicos 0,5', () => {
    const result = count([set(14), set(14)])
    expect(result.direct.isquios).toBe(2)
    expect(result.effective.isquios).toBe(2)
    expect(result.effective.gluteo).toBe(1)
    expect(result.effective.espalda).toBe(1)
    expect(result.effective.cuadriceps).toBe(1)
    expect(result.effective.antebrazo).toBe(1)
  })

  it('el rumano no suma cuádriceps', () => {
    const result = count([set(15)])
    expect(result.direct.isquios).toBe(1)
    expect(result.effective.gluteo).toBe(0.5)
    expect(result.effective.espalda).toBe(0.5)
    expect(result.effective.cuadriceps).toBeUndefined()
  })

  it('marca las series sin grupo de volumen como sin clasificar', () => {
    const result = count([set(13), set(12)])
    expect(result.unclassified).toBe(1)
    expect(result.excluded).toBe(0)
    expect(result.total).toBe(2)
    expect(result.direct.cuadriceps).toBe(1)
  })

  it('excluye por diseño el hombro anterior y no lo cuenta como sin clasificar', () => {
    const result = count([set(16)])
    expect(result.excluded).toBe(1)
    expect(result.unclassified).toBe(0)
    expect(result.effective.triceps).toBe(0.5)
  })

  it('no cuenta cardio ni movilidad como volumen muscular', () => {
    const result = count([set(17)])
    expect(result.total).toBe(0)
    expect(result.direct).toEqual({})
  })
})

describe('buildCoverageReport', () => {
  it('mide la cobertura por grupo del catálogo', () => {
    const report = buildCoverageReport([set(12), set(13), set(10)], workouts, exercises, WINDOW_START, WINDOW_END)
    expect(report.total).toBe(3)
    expect(report.classified).toBe(2)
    expect(report.unknown).toBe(1)
    expect(report.excluded).toBe(0)
    expect(report.pct).toBeCloseTo(66.67, 1)
    expect(report.byCoarseGroup.pierna).toEqual({ total: 2, classified: 1, excluded: 0, unknown: 1 })
    expect(report.byCoarseGroup.pecho).toEqual({ total: 1, classified: 1, excluded: 0, unknown: 0 })
  })

  it('las excluidas por diseño no bajan el porcentaje', () => {
    const report = buildCoverageReport([set(12), set(13), set(16)], workouts, exercises, WINDOW_START, WINDOW_END)
    expect(report.classified).toBe(1)
    expect(report.unknown).toBe(1)
    expect(report.excluded).toBe(1)
    expect(report.pct).toBe(50)
  })

  it('sin series no divide por cero', () => {
    const report = buildCoverageReport([], workouts, exercises, WINDOW_START, WINDOW_END)
    expect(report.total).toBe(0)
    expect(report.pct).toBe(0)
  })
})

describe('toWeeklySets', () => {
  it('convierte a series por semana', () => {
    expect(toWeeklySets(12, 4)).toBe(3)
  })

  it('protege las semanas en cero', () => {
    expect(toWeeklySets(12, 0)).toBe(0)
  })

  it('la ventana por defecto son 28 días', () => {
    expect(WINDOW_DAYS).toBe(28)
  })
})
