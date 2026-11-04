// Conteo de series por grupo de volumen (F137) en una ventana local inclusiva.
// Directas = 1; sinérgicas = 0,5. Una sola pasada por serie: los mapas los arma el consumidor.
import { toLocalDateStr } from './dates'
import type { ExerciseCategory, MuscleGroup, MuscleZone } from './types'
import {
  VOLUME_GROUPS,
  attributeVolume,
  synergistsOf,
  volumeTarget,
  type VolumeGroup,
  type VolumeTarget,
} from './volumeGroup'

export const WINDOW_DAYS = 28

export interface VolumeSetSample {
  completed: boolean
  isWarmup?: boolean
  workoutId: number
  exerciseId: number
  reps?: number
}

export interface VolumeWorkoutSample {
  localDate?: string | null
  finishedAt?: string | null
}

export interface VolumeExerciseSample {
  muscleGroup: MuscleGroup
  name: string
  slug?: string
  externalId?: string
  muscleZones?: MuscleZone[]
  category?: ExerciseCategory
}

export interface VolumeCounts {
  direct: Partial<Record<VolumeGroup, number>>
  effective: Partial<Record<VolumeGroup, number>>
  excluded: number
  unclassified: number
  total: number
}

export interface CoverageGroupEntry {
  total: number
  classified: number
  excluded: number
  unknown: number
}

export interface CoverageReport {
  total: number
  classified: number
  excluded: number
  unknown: number
  pct: number
  byCoarseGroup: Partial<Record<MuscleGroup, CoverageGroupEntry>>
}

const addTo = (acc: Partial<Record<VolumeGroup, number>>, group: VolumeGroup, amount: number): void => {
  acc[group] = (acc[group] ?? 0) + amount
}

const dayOf = (workout: VolumeWorkoutSample): string => {
  const local = workout.localDate?.slice(0, 10)
  if (local) return local
  return workout.finishedAt ? toLocalDateStr(new Date(workout.finishedAt)) : ''
}

// Día local del entreno (localDate manda; fallback al timestamp en fecha local).
export const workoutLocalDay = (workout: VolumeWorkoutSample): string => dayOf(workout)

// Cardio, movilidad y estiramiento no son series de volumen muscular.
const isStrengthWork = (exercise: VolumeExerciseSample): boolean =>
  !exercise.category || exercise.category === 'strength'

export interface VolumeSetContext {
  exercise: VolumeExerciseSample
  day: string
  set: VolumeSetSample
}

// Iterador único (F137): completa, no-calentamiento, workout existente, fuerza y ventana opcional.
export const forEachVolumeSet = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  visit: (context: VolumeSetContext) => void,
  window?: { start: string; end: string },
): void => {
  for (const set of sets) {
    if (!set.completed || set.isWarmup) continue
    const workout = workoutsById.get(set.workoutId)
    if (!workout) continue
    const day = dayOf(workout)
    if (!day) continue
    if (window && (day < window.start || day > window.end)) continue
    const exercise = exercisesById.get(set.exerciseId)
    if (!exercise || !isStrengthWork(exercise)) continue
    visit({ exercise, day, set })
  }
}

export const countVolumeSets = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  windowStart: string,
  windowEnd: string,
): VolumeCounts => {
  const direct: Partial<Record<VolumeGroup, number>> = {}
  const effective: Partial<Record<VolumeGroup, number>> = {}
  let excluded = 0
  let unclassified = 0
  let total = 0

  forEachVolumeSet(
    sets,
    workoutsById,
    exercisesById,
    ({ exercise }) => {
      total += 1
      const attribution = attributeVolume(exercise)
      if (attribution.kind === 'group') {
        addTo(direct, attribution.group, 1)
        addTo(effective, attribution.group, 1)
      } else if (attribution.kind === 'excluded') {
        excluded += 1
      } else {
        unclassified += 1
      }
      for (const synergist of synergistsOf(exercise)) {
        addTo(effective, synergist.group, synergist.factor)
      }
    },
    { start: windowStart, end: windowEnd },
  )

  return { direct, effective, excluded, unclassified, total }
}

// % de series atribuibles a una banda, por grupo del catálogo (insumo de F138).
// Las excluidas por diseño (hombro anterior, aductores) no bajan el porcentaje.
export const buildCoverageReport = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  windowStart: string,
  windowEnd: string,
): CoverageReport => {
  const byCoarseGroup: CoverageReport['byCoarseGroup'] = {}
  let total = 0
  let classified = 0
  let excluded = 0
  let unknown = 0

  forEachVolumeSet(
    sets,
    workoutsById,
    exercisesById,
    ({ exercise }) => {
      total += 1
      const entry = (byCoarseGroup[exercise.muscleGroup] ??= {
        total: 0,
        classified: 0,
        excluded: 0,
        unknown: 0,
      })
      entry.total += 1
      const attribution = attributeVolume(exercise)
      if (attribution.kind === 'group') {
        classified += 1
        entry.classified += 1
      } else if (attribution.kind === 'excluded') {
        excluded += 1
        entry.excluded += 1
      } else {
        unknown += 1
        entry.unknown += 1
      }
    },
    { start: windowStart, end: windowEnd },
  )

  return {
    total,
    classified,
    excluded,
    unknown,
    pct: classified + unknown > 0 ? (classified / (classified + unknown)) * 100 : 0,
    byCoarseGroup,
  }
}

// Series por semana; con ventanas parciales el caller pasa las semanas reales.
export const toWeeklySets = (sets: number, weeks: number): number =>
  weeks > 0 ? sets / weeks : 0

// ------------------------- Bandas y estados (F137.2) -------------------------

// Con menos cobertura que esto no se alerta: no se sabe a qué músculo atribuir las series.
export const BAND_COVERAGE_MIN_PCT = 90

export type BandState =
  | 'sin-datos'
  | 'datos-parciales'
  | 'sin-clasificar'
  | 'bajo'
  | 'dentro'
  | 'alto'

export interface VolumeGroupStat {
  group: VolumeGroup
  direct: number
  effective: number
  weekly: number
  target: VolumeTarget
  state: BandState
  alert: boolean
}

// Un grupo de volumen hereda la cobertura de su grupo del catálogo.
const COARSE_GROUP_OF: Record<VolumeGroup, MuscleGroup> = {
  cuadriceps: 'pierna',
  isquios: 'pierna',
  gemelos: 'pierna',
  gluteo: 'gluteo',
  pecho: 'pecho',
  espalda: 'espalda',
  hombro: 'hombro',
  biceps: 'biceps',
  triceps: 'triceps',
  abdomen: 'abdomen',
  trapecios: 'trapecios',
  antebrazo: 'antebrazo',
}

const coveragePctOf = (report: CoverageReport, coarse: MuscleGroup): number => {
  const entry = report.byCoarseGroup[coarse]
  if (!entry) return 100
  const eligible = entry.classified + entry.unknown
  return eligible > 0 ? (entry.classified / eligible) * 100 : 100
}

export interface VolumeStatsInput {
  counts: VolumeCounts
  coverage: CoverageReport
  weeks: number
  partial?: boolean
  // La rutina activa programa el grupo (para trapecios).
  scheduled?: Partial<Record<VolumeGroup, boolean>>
}

export const buildVolumeStats = ({
  counts,
  coverage,
  weeks,
  partial = false,
  scheduled = {},
}: VolumeStatsInput): VolumeGroupStat[] =>
  VOLUME_GROUPS.map((group) => {
    const direct = counts.direct[group] ?? 0
    const effective = counts.effective[group] ?? 0
    const target = volumeTarget(group)
    const weekly = toWeeklySets(direct, weeks)
    const hasData = direct > 0 || effective > 0
    const covered = coveragePctOf(coverage, COARSE_GROUP_OF[group]) >= BAND_COVERAGE_MIN_PCT

    let state: BandState
    if (!hasData) state = 'sin-datos'
    else if (partial || weeks <= 0) state = 'datos-parciales'
    else if (!covered) state = 'sin-clasificar'
    else if (weekly < target.min) state = 'bajo'
    else if (weekly > target.max) state = 'alto'
    else state = 'dentro'

    const alertAllowed =
      target.alert === 'always' ||
      (target.alert === 'only-if-trained' && scheduled[group] === true)

    return {
      group,
      direct,
      effective,
      weekly,
      target,
      state,
      alert: alertAllowed && (state === 'bajo' || state === 'alto'),
    }
  })
