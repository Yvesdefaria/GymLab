import type { Workout } from './types'
import { toLocalDateStr, addLocalDays } from './dates'

export type InsightTone = 'positive' | 'neutral' | 'alert'

export interface WeeklyVolumeInsight {
  currentWeekVolume: number
  previousWeekVolume: number
  deltaPct: number
  tone: InsightTone
  weekKey: string
  previousWeekKey: string
}

const POSITIVE_THRESHOLD_PCT = 5
const ALERT_THRESHOLD_PCT = -10

const weekStartKey = (date: Date): string => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return toLocalDateStr(d)
}

export const computeWeeklyVolumeInsight = (
  workouts: Workout[],
  now = new Date()
): WeeklyVolumeInsight | null => {
  if (workouts.length < 2) return null

  const weekKey = weekStartKey(now)
  const previousWeekKey = addLocalDays(weekKey, -7)

  let currentWeekVolume = 0
  let previousWeekVolume = 0
  for (const w of workouts) {
    const key = weekStartKey(new Date(w.startedAt))
    if (key === weekKey) currentWeekVolume += w.totalVolume
    else if (key === previousWeekKey) previousWeekVolume += w.totalVolume
  }

  if (currentWeekVolume <= 0 && previousWeekVolume <= 0) return null

  const deltaPct =
    previousWeekVolume > 0
      ? ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100
      : 100

  const tone: InsightTone =
    previousWeekVolume <= 0
      ? 'neutral'
      : deltaPct >= POSITIVE_THRESHOLD_PCT
        ? 'positive'
        : deltaPct <= ALERT_THRESHOLD_PCT
          ? 'alert'
          : 'neutral'

  return {
    currentWeekVolume,
    previousWeekVolume,
    deltaPct,
    tone,
    weekKey,
    previousWeekKey,
  }
}
