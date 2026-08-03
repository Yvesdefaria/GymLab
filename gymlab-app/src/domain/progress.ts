import type { Workout } from './types'
import { toLocalDateStr } from './dates'

export interface DeloadSignal {
  recentWeeklyAvg: number
  previousWeeklyAvg: number
  dropPct: number
  suggestsDeload: boolean
}

const isoWeekKey = (date: Date): string => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return toLocalDateStr(d)
}

export const detectDeloadSignal = (workouts: Workout[]): DeloadSignal | null => {
  const now = Date.now()
  const DAY = 86_400_000

  const recent = workouts.filter((w) => {
    const t = new Date(w.startedAt).getTime()
    return t >= now - 21 * DAY
  })

  const previous = workouts.filter((w) => {
    const t = new Date(w.startedAt).getTime()
    return t >= now - 42 * DAY && t < now - 21 * DAY
  })

  if (recent.length < 2 || previous.length < 2) return null

  const avg = (list: Workout[]) => {
    const weeks = new Map<string, number>()
    for (const w of list) {
      const key = isoWeekKey(new Date(w.startedAt))
      weeks.set(key, (weeks.get(key) ?? 0) + w.totalVolume)
    }
    const values = Array.from(weeks.values())
    return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)
  }

  const recentWeeklyAvg = avg(recent)
  const previousWeeklyAvg = avg(previous)
  if (previousWeeklyAvg <= 0) return null

  const dropPct = ((previousWeeklyAvg - recentWeeklyAvg) / previousWeeklyAvg) * 100

  return {
    recentWeeklyAvg,
    previousWeeklyAvg,
    dropPct,
    suggestsDeload: dropPct >= 15,
  }
}
