// Señales de desbalance (F137.3): abandono, consistencia semanal, antagonistas y rango de reps.
// Puras: reciben series/entrenos/ejercicios ya cargados y no tocan React ni Dexie.
import { diffLocalDays } from './dates'
import { attributeVolume, type VolumeGroup } from './volumeGroup'
import {
  forEachVolumeSet,
  type VolumeExerciseSample,
  type VolumeSetSample,
  type VolumeWorkoutSample,
} from './volumeModel'

// Días sin trabajo directo a partir de los cuales el grupo se marca como abandonado.
export const ABANDON_DAYS = 10
// Diferencia máxima entre antagonistas (con suavizado +1 para evitar división por cero).
export const ANTAGONIST_RATIO_MAX = 1.5
// Debajo de estas series combinadas el ratio es ruido, no señal.
export const ANTAGONIST_MIN_SETS = 6
export const REP_STRENGTH_MAX = 5
export const REP_HYPERTROPHY_MAX = 15

export interface LastTrainedEntry {
  date: string
  daysAgo: number
}

export const lastTrainedByVolumeGroup = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  today: string,
): Partial<Record<VolumeGroup, LastTrainedEntry>> => {
  const last: Partial<Record<VolumeGroup, string>> = {}
  forEachVolumeSet(sets, workoutsById, exercisesById, ({ exercise, day }) => {
    const attribution = attributeVolume(exercise)
    if (attribution.kind !== 'group') return
    const previous = last[attribution.group]
    if (!previous || day > previous) last[attribution.group] = day
  })

  const result: Partial<Record<VolumeGroup, LastTrainedEntry>> = {}
  for (const [group, date] of Object.entries(last) as [VolumeGroup, string][]) {
    result[group] = { date, daysAgo: diffLocalDays(date, today) }
  }
  return result
}

export const isAbandoned = (entry: LastTrainedEntry | undefined): boolean =>
  entry !== undefined && entry.daysAgo > ABANDON_DAYS

export interface WeeklyConsistency {
  group: VolumeGroup
  weeks: number[]
  zeroWeeks: number
}

export const weeklyDirectByGroup = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  windowStart: string,
  windowEnd: string,
  weeks = 4,
): Partial<Record<VolumeGroup, WeeklyConsistency>> => {
  const buckets: Partial<Record<VolumeGroup, number[]>> = {}
  forEachVolumeSet(
    sets,
    workoutsById,
    exercisesById,
    ({ exercise, day }) => {
      const attribution = attributeVolume(exercise)
      if (attribution.kind !== 'group') return
      const index = Math.min(weeks - 1, Math.max(0, Math.floor(diffLocalDays(windowStart, day) / 7)))
      const row = (buckets[attribution.group] ??= Array.from({ length: weeks }, () => 0))
      row[index] += 1
    },
    { start: windowStart, end: windowEnd },
  )

  const result: Partial<Record<VolumeGroup, WeeklyConsistency>> = {}
  for (const [group, weeksRow] of Object.entries(buckets) as [VolumeGroup, number[]][]) {
    result[group] = {
      group,
      weeks: weeksRow,
      zeroWeeks: weeksRow.filter((value) => value === 0).length,
    }
  }
  return result
}

export type AntagonistPair = 'pecho/espalda' | 'biceps/triceps'

export interface AntagonistRatio {
  pair: AntagonistPair
  a: number
  b: number
  ratio: number
  alert: boolean
}

export const antagonistRatios = (
  direct: Partial<Record<VolumeGroup, number>>,
): AntagonistRatio[] => {
  const build = (pair: AntagonistPair, groupA: VolumeGroup, groupB: VolumeGroup): AntagonistRatio => {
    const a = direct[groupA] ?? 0
    const b = direct[groupB] ?? 0
    const ratio = (Math.max(a, b) + 1) / (Math.min(a, b) + 1)
    return {
      pair,
      a,
      b,
      ratio,
      alert: a + b >= ANTAGONIST_MIN_SETS && ratio > ANTAGONIST_RATIO_MAX,
    }
  }
  return [build('pecho/espalda', 'pecho', 'espalda'), build('biceps/triceps', 'biceps', 'triceps')]
}

export interface RepDistribution {
  group: VolumeGroup
  strength: number
  hypertrophy: number
  endurance: number
  total: number
}

export const repDistributionByVolumeGroup = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  windowStart: string,
  windowEnd: string,
): Partial<Record<VolumeGroup, RepDistribution>> => {
  const result: Partial<Record<VolumeGroup, RepDistribution>> = {}
  forEachVolumeSet(
    sets,
    workoutsById,
    exercisesById,
    ({ exercise, set }) => {
      const reps = set.reps ?? 0
      if (reps <= 0) return
      const attribution = attributeVolume(exercise)
      if (attribution.kind !== 'group') return
      const entry = (result[attribution.group] ??= {
        group: attribution.group,
        strength: 0,
        hypertrophy: 0,
        endurance: 0,
        total: 0,
      })
      if (reps <= REP_STRENGTH_MAX) entry.strength += 1
      else if (reps <= REP_HYPERTROPHY_MAX) entry.hypertrophy += 1
      else entry.endurance += 1
      entry.total += 1
    },
    { start: windowStart, end: windowEnd },
  )
  return result
}
