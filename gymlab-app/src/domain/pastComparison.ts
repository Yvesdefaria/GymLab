// Comparación con yo del pasado: métricas actuales vs 1, 3, 6 meses atrás.
import type { Workout, WorkoutSet, BodyWeightEntry } from './types'
import { localDateOf, toLocalDateStr, addLocalDays } from './dates'
import { setLocalDate } from './setStats'
import { estimate1RM } from './prs'

export type ComparisonPeriod = '1m' | '3m' | '6m'

export interface PeriodMetrics {
  avgE1rm: number
  weeklyVolume: number
  weightKg: number | null
  workoutsCount: number
}

export interface PeriodComparison {
  period: ComparisonPeriod
  label: string
  current: PeriodMetrics
  past: PeriodMetrics
  deltas: {
    e1rmDelta: number
    e1rmPct: number
    volumeDelta: number
    volumePct: number
    weightDelta: number | null
    weightPct: number | null
  }
}

const periodDays: Record<ComparisonPeriod, number> = { '1m': 30, '3m': 90, '6m': 180 }
const periodLabels: Record<ComparisonPeriod, string> = { '1m': '1 mes', '3m': '3 meses', '6m': '6 meses' }

// Volumen semanal promedio en un período.
const weeklyVolume = (workouts: Workout[], start: string, end: string): number => {
  const inRange = workouts.filter((w) => {
    const d = localDateOf(w)
    return d >= start && d < end
  })
  if (inRange.length === 0) return 0
  const totalVol = inRange.reduce((acc, w) => acc + w.totalVolume, 0)
  const days = Math.max(1, periodDays['1m']) // normalizar a semanal
  return (totalVol / days) * 7
}

// Peso corporal más reciente en un período.
const latestWeight = (entries: BodyWeightEntry[], start: string, end: string): number | null => {
  const inRange = entries
    .filter((e) => e.localDate >= start && e.localDate < end && e.weightKg > 0)
    .sort((a, b) => b.localDate.localeCompare(a.localDate))
  return inRange.length > 0 ? inRange[0].weightKg : null
}

// Entrenos en un período.
const countWorkouts = (workouts: Workout[], start: string, end: string): number =>
  workouts.filter((w) => {
    const d = localDateOf(w)
    return d >= start && d < end
  }).length

// Series elegibles para promedios de e1rm, filtradas una sola vez: evita barrer
// el historial completo en cada una de las 6 ventanas de buildPastComparison.
const eligibleSets = (sets: WorkoutSet[]): WorkoutSet[] =>
  sets.filter((s) => s.completed && !s.isWarmup && s.weightKg > 0 && s.reps > 0)

// e1rm promedio en [start, end) con el mismo orden de reducción que antes
// (filter preserva orden → sumas idénticas a avgE1rmInRange global).
const avgE1rmWindow = (eligible: WorkoutSet[], start: string, end: string): number => {
  const inRange = eligible.filter((s) => {
    const d = setLocalDate(s)
    return d >= start && d < end
  })
  if (inRange.length === 0) return 0
  const total = inRange.reduce((acc, s) => acc + estimate1RM(s.weightKg, s.reps), 0)
  return total / inRange.length
}

// Calcula comparaciones para todos los períodos.
export const buildPastComparison = (
  workouts: Workout[],
  sets: WorkoutSet[],
  bodyWeightEntries: BodyWeightEntry[],
  now = new Date()
): PeriodComparison[] => {
  const nowStr = toLocalDateStr(now)

  // Filtro de elegibilidad calculado una sola vez, fuera del loop de períodos.
  const eligible = eligibleSets(sets)

  return (['1m', '3m', '6m'] as ComparisonPeriod[]).map((period) => {
    const days = periodDays[period]
    const currentStart = addLocalDays(nowStr, -days)
    const pastStart = addLocalDays(nowStr, -days * 2)
    const pastEnd = currentStart

    const current: PeriodMetrics = {
      avgE1rm: Math.round(avgE1rmWindow(eligible, currentStart, nowStr) * 10) / 10,
      weeklyVolume: Math.round(weeklyVolume(workouts, currentStart, nowStr)),
      weightKg: latestWeight(bodyWeightEntries, currentStart, nowStr),
      workoutsCount: countWorkouts(workouts, currentStart, nowStr),
    }

    const past: PeriodMetrics = {
      avgE1rm: Math.round(avgE1rmWindow(eligible, pastStart, pastEnd) * 10) / 10,
      weeklyVolume: Math.round(weeklyVolume(workouts, pastStart, pastEnd)),
      weightKg: latestWeight(bodyWeightEntries, pastStart, pastEnd),
      workoutsCount: countWorkouts(workouts, pastStart, pastEnd),
    }

    const e1rmPct = past.avgE1rm > 0 ? Math.round(((current.avgE1rm - past.avgE1rm) / past.avgE1rm) * 100) : 0
    const volumePct = past.weeklyVolume > 0 ? Math.round(((current.weeklyVolume - past.weeklyVolume) / past.weeklyVolume) * 100) : 0
    const weightPct = past.weightKg != null && current.weightKg != null && past.weightKg > 0
      ? Math.round(((current.weightKg - past.weightKg) / past.weightKg) * 100)
      : null

    return {
      period,
      label: periodLabels[period],
      current,
      past,
      deltas: {
        e1rmDelta: Math.round((current.avgE1rm - past.avgE1rm) * 10) / 10,
        e1rmPct,
        volumeDelta: current.weeklyVolume - past.weeklyVolume,
        volumePct,
        weightDelta: current.weightKg != null && past.weightKg != null
          ? Math.round((current.weightKg - past.weightKg) * 10) / 10
          : null,
        weightPct,
      },
    }
  })
}
