// Conteo de series por grupo de volumen (F137) en una ventana local inclusiva.
// Directas = 1; sinérgicas = 0,5. Una sola pasada por serie: los mapas los arma el consumidor.
import { toLocalDateStr } from './dates'
import type { ExerciseCategory, MuscleGroup, MuscleZone } from './types'
import { attributeVolume, synergistsOf, type VolumeGroup } from './volumeGroup'

export const WINDOW_DAYS = 28

export interface VolumeSetSample {
  completed: boolean
  isWarmup?: boolean
  workoutId: number
  exerciseId: number
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

// Cardio, movilidad y estiramiento no son series de volumen muscular.
const isStrengthWork = (exercise: VolumeExerciseSample): boolean =>
  !exercise.category || exercise.category === 'strength'

// Visita solo las series completas, no-calentamiento, de workouts existentes, dentro de
// la ventana y de ejercicios de fuerza.
const forEachSetInWindow = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  windowStart: string,
  windowEnd: string,
  visit: (exercise: VolumeExerciseSample) => void,
): void => {
  for (const set of sets) {
    if (!set.completed || set.isWarmup) continue
    const workout = workoutsById.get(set.workoutId)
    if (!workout) continue
    const day = dayOf(workout)
    if (!day || day < windowStart || day > windowEnd) continue
    const exercise = exercisesById.get(set.exerciseId)
    if (!exercise || !isStrengthWork(exercise)) continue
    visit(exercise)
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

  forEachSetInWindow(sets, workoutsById, exercisesById, windowStart, windowEnd, (exercise) => {
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
  })

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

  forEachSetInWindow(sets, workoutsById, exercisesById, windowStart, windowEnd, (exercise) => {
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
  })

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
