// Resumen semanal automático: métricas clave de la semana y comparativa con la anterior.
import type { PRRecord, StreakResult, Workout } from './types'
import { localDateOf, toLocalDateStr, weekStartKey } from './dates'
import { countPrsInWeek } from './prs'
import { volumeOf, type VolumeByWorkout } from './volume'
import { compareWeekVolume } from './weekVolume'

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
  // null = sin volumen previo: no hay porcentaje real que mostrar.
  volumePct: number | null
  sessionsDelta: number
  tone: SummaryTone
  // Rachas
  streakCurrent: number
  streakMax: number
}

// Mejor día de la semana (mayor volumen).
const bestDayOfWeek = (
  workouts: Workout[],
  volumes: VolumeByWorkout,
  weekKey: string
): { date: string; volume: number } | null => {
  const byDay = new Map<string, number>()
  for (const w of workouts) {
    if (weekStartKey(localDateOf(w)) !== weekKey) continue
    const d = localDateOf(w)
    byDay.set(d, (byDay.get(d) ?? 0) + volumeOf(w, volumes))
  }
  let best: { date: string; volume: number } | null = null
  for (const [date, volume] of byDay) {
    if (!best || volume > best.volume) best = { date, volume }
  }
  return best
}

// Construye el resumen de la semana que contiene `now`; devuelve null sin datos.
// El recuento de PRs de la semana se calcula aquí (una sola fuente, ver domain/prs.ts).
// La racha llega resuelta (F103/T8): la home la comparte con el resto de tarjetas en
// vez de recalcularla una vez por consumidor.
export const buildWeeklySummary = (
  workouts: Workout[],
  prs: PRRecord[],
  streak: StreakResult,
  volumes: VolumeByWorkout,
  now = new Date()
): WeeklySummary | null => {
  if (workouts.length === 0) return null

  const prCount = countPrsInWeek(prs, now)
  const week = compareWeekVolume(workouts, volumes, toLocalDateStr(now))

  let sessions = 0
  let prevSessions = 0
  for (const w of workouts) {
    const key = weekStartKey(localDateOf(w))
    if (key === week.currentWeekKey) sessions++
    else if (key === week.previousWeekKey) prevSessions++
  }

  if (sessions === 0) return null

  const best = bestDayOfWeek(workouts, volumes, week.currentWeekKey)
  const sessionsDelta = sessions - prevSessions

  return {
    sessions,
    volume: week.current,
    prCount,
    bestDay: best?.date ?? null,
    bestDayVolume: best?.volume ?? 0,
    prevSessions,
    prevVolume: week.previous,
    volumePct: week.deltaPct,
    sessionsDelta,
    tone: week.tone,
    streakCurrent: streak.currentStreak,
    streakMax: streak.longestStreak,
  }
}
