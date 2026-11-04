// Señales de desbalance (F137.3): abandono, consistencia semanal, antagonistas y rango de reps.
// Puras: reciben series/entrenos/ejercicios ya cargados y no tocan React ni Dexie.
import { diffLocalDays } from './dates'
import { attributeVolume, type VolumeGroup } from './volumeGroup'
import {
  forEachVolumeSet,
  type VolumeExerciseSample,
  type VolumeGroupStat,
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

export const REST_MIN_DAYS = 2
export const REST_MAX_DAYS = 10

export type RestStatus = 'ok' | 'under' | 'detrained'

export interface RestBetweenExposures {
  group: VolumeGroup
  gaps: number[]
  median: number
  exposures: number
  status: RestStatus
}

const medianOf = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

// Mediana de días entre días con trabajo directo del mismo grupo dentro de la ventana.
// No mide el hueco hasta hoy: eso lo cubre `lastTrainedByVolumeGroup`.
export const restBetweenExposuresByVolumeGroup = (
  sets: readonly VolumeSetSample[],
  workoutsById: ReadonlyMap<number, VolumeWorkoutSample>,
  exercisesById: ReadonlyMap<number, VolumeExerciseSample>,
  windowStart: string,
  windowEnd: string,
): Partial<Record<VolumeGroup, RestBetweenExposures>> => {
  const daysByGroup = new Map<VolumeGroup, Set<string>>()
  forEachVolumeSet(
    sets,
    workoutsById,
    exercisesById,
    ({ exercise, day }) => {
      const attribution = attributeVolume(exercise)
      if (attribution.kind !== 'group') return
      const days = daysByGroup.get(attribution.group) ?? new Set<string>()
      days.add(day)
      daysByGroup.set(attribution.group, days)
    },
    { start: windowStart, end: windowEnd },
  )

  const result: Partial<Record<VolumeGroup, RestBetweenExposures>> = {}
  for (const [group, daySet] of daysByGroup) {
    const days = [...daySet].sort()
    if (days.length < 2) continue
    const gaps = days.slice(1).map((day, index) => diffLocalDays(days[index], day))
    const median = medianOf(gaps)
    const status: RestStatus =
      median < REST_MIN_DAYS ? 'under' : median > REST_MAX_DAYS ? 'detrained' : 'ok'
    result[group] = { group, gaps, median, exposures: days.length, status }
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

export const PAIR_GROUPS: Record<AntagonistPair, [VolumeGroup, VolumeGroup]> = {
  'pecho/espalda': ['pecho', 'espalda'],
  'biceps/triceps': ['biceps', 'triceps'],
}

export type VolumeSignal =
  | { kind: 'deficit'; group: VolumeGroup; gap: number }
  | { kind: 'abandoned'; group: VolumeGroup; daysAgo: number }
  | {
      kind: 'antagonist'
      pair: AntagonistPair
      stronger: VolumeGroup
      weaker: VolumeGroup
      ratio: number
    }

// Hasta `limit` señales accionables, una por grupo y por tipo cuando se puede.
// Orden: déficit más grande, abandono más antiguo, antagonista; luego más déficits.
export const buildActionableSignals = ({
  stats,
  lastTrained,
  antagonists,
  limit = 3,
}: {
  stats: readonly VolumeGroupStat[]
  lastTrained: Partial<Record<VolumeGroup, LastTrainedEntry>>
  antagonists: readonly AntagonistRatio[]
  limit?: number
}): VolumeSignal[] => {
  const signals: VolumeSignal[] = []
  const seen = new Set<VolumeGroup>()
  const deficits = stats
    .filter((entry) => entry.alert && entry.state === 'bajo')
    .sort((a, b) => b.target.min - b.weekly - (a.target.min - a.weekly))
  const abandoned = (Object.entries(lastTrained) as [VolumeGroup, LastTrainedEntry][])
    .filter(([, entry]) => isAbandoned(entry))
    .sort((a, b) => b[1].daysAgo - a[1].daysAgo)

  const addDeficit = (entry: VolumeGroupStat) => {
    seen.add(entry.group)
    signals.push({
      kind: 'deficit',
      group: entry.group,
      gap: Math.max(1, Math.ceil(entry.target.min - entry.weekly)),
    })
  }

  const biggestDeficit = deficits.find((entry) => !seen.has(entry.group))
  if (biggestDeficit && signals.length < limit) addDeficit(biggestDeficit)

  if (signals.length < limit) {
    const nextAbandoned = abandoned.find(([group]) => !seen.has(group))
    if (nextAbandoned) {
      seen.add(nextAbandoned[0])
      signals.push({ kind: 'abandoned', group: nextAbandoned[0], daysAgo: nextAbandoned[1].daysAgo })
    }
  }

  if (signals.length < limit) {
    const antagonist = antagonists.find((entry) => entry.alert)
    if (antagonist) {
      const [groupA, groupB] = PAIR_GROUPS[antagonist.pair]
      const stronger = antagonist.a >= antagonist.b ? groupA : groupB
      const weaker = stronger === groupA ? groupB : groupA
      signals.push({ kind: 'antagonist', pair: antagonist.pair, stronger, weaker, ratio: antagonist.ratio })
    }
  }

  for (const extra of deficits) {
    if (signals.length >= limit) break
    if (seen.has(extra.group)) continue
    addDeficit(extra)
  }

  return signals.slice(0, limit)
}
