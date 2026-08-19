// Resumen semanal automático: métricas clave de la semana y comparativa con la anterior.
import type { Workout } from './types'
import { addLocalDays, localDateOf, toLocalDateStr, weekStartKey } from './dates'
import { calcStreak } from './streak'

export type SummaryTone = 'positive' | 'neutral' | 'alert'

export interface WeeklySummary {
  // Semana actual
  sessions: number
  volume: number
  prCount: number
  bestDay: string | null
  bestDayVolume: number
  // Comparativa con semana anterior
  prevSessions: number
  prevVolume: number
  volumePct: number
  sessionsDelta: number
  tone: SummaryTone
  // Rachas
  streakCurrent: number
  streakMax: number
}

// Mejor día de la semana (mayor volumen).
const bestDayOfWeek = (
  workouts: Workout[],
  weekKey: string
): { date: string; volume: number } | null => {
  const byDay = new Map<string, number>()
  for (const w of workouts) {
    if (weekStartKey(localDateOf(w)) !== weekKey) continue
    const d = localDateOf(w)
    byDay.set(d, (byDay.get(d) ?? 0) + w.totalVolume)
  }
  let best: { date: string; volume: number } | null = null
  for (const [date, volume] of byDay) {
    if (!best || volume > best.volume) best = { date, volume }
  }
  return best
}

// Construye el resumen de la semana que contiene `now`; devuelve null sin datos.
export const buildWeeklySummary = (
  workouts: Workout[],
  prCount: number,
  now = new Date()
): WeeklySummary | null => {
  if (workouts.length === 0) return null

  const weekKey = weekStartKey(toLocalDateStr(now))
  const prevWeekKey = addLocalDays(weekKey, -7)

  let sessions = 0
  let volume = 0
  let prevSessions = 0
  let prevVolume = 0

  for (const w of workouts) {
    const key = weekStartKey(localDateOf(w))
    if (key === weekKey) {
      sessions++
      volume += w.totalVolume
    } else if (key === prevWeekKey) {
      prevSessions++
      prevVolume += w.totalVolume
    }
  }

  if (sessions === 0) return null

  const best = bestDayOfWeek(workouts, weekKey)

  const volumePct =
    prevVolume > 0 ? ((volume - prevVolume) / prevVolume) * 100 : volume > 0 ? 100 : 0
  const sessionsDelta = sessions - prevSessions

  const POSITIVE_THRESHOLD = 5
  const ALERT_THRESHOLD = -10
  const tone: SummaryTone =
    prevVolume <= 0 && prevSessions === 0
      ? 'neutral'
      : volumePct >= POSITIVE_THRESHOLD
        ? 'positive'
        : volumePct <= ALERT_THRESHOLD
          ? 'alert'
          : 'neutral'

  const dates = workouts.map((w) => localDateOf(w))
  const streak = calcStreak(dates)

  return {
    sessions,
    volume,
    prCount,
    bestDay: best?.date ?? null,
    bestDayVolume: best?.volume ?? 0,
    prevSessions,
    prevVolume,
    volumePct,
    sessionsDelta,
    tone,
    streakCurrent: streak.currentStreak,
    streakMax: streak.longestStreak,
  }
}
