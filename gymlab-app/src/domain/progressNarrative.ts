// Narrativa de progreso: compara las últimas 4 semanas con las 4 anteriores para generar insights.
import type { Workout, PRRecord } from './types'
import { localDateOf, toLocalDateStr, weekStartKey, addLocalDays } from './dates'

export type TrendDirection = 'up' | 'down' | 'stable'

export interface MetricTrend {
  current: number
  previous: number
  pctChange: number
  direction: TrendDirection
}

export interface ProgressNarrative {
  strength: MetricTrend
  frequency: MetricTrend
  volume: MetricTrend
  narrative: string
  tone: 'positive' | 'neutral' | 'alert'
}

const DIRECTION_THRESHOLD = 5

const classifyDirection = (pct: number): TrendDirection =>
  pct >= DIRECTION_THRESHOLD ? 'up' : pct <= -DIRECTION_THRESHOLD ? 'down' : 'stable'

// Promedio de e1rm de los PRs de un período.
const avgE1rm = (prs: PRRecord[]): number => {
  if (prs.length === 0) return 0
  return prs.reduce((acc, pr) => acc + pr.estimated1RM, 0) / prs.length
}

// Divide workouts en dos bloques de 4 semanas: reciente vs anterior.
const splitWeeks = (
  workouts: Workout[],
  now: Date
): { recent: Workout[]; previous: Workout[] } => {
  const nowStr = toLocalDateStr(now)
  const recentStart = addLocalDays(nowStr, -28)
  const prevStart = addLocalDays(nowStr, -56)

  const recent: Workout[] = []
  const previous: Workout[] = []

  for (const w of workouts) {
    const d = localDateOf(w)
    if (d >= recentStart) recent.push(w)
    else if (d >= prevStart) previous.push(w)
  }

  return { recent, previous }
}

// Misma lógica para PRs.
const splitPRWeeks = (
  prs: PRRecord[],
  now: Date
): { recent: PRRecord[]; previous: PRRecord[] } => {
  const nowStr = toLocalDateStr(now)
  const recentStart = addLocalDays(nowStr, -28)
  const prevStart = addLocalDays(nowStr, -56)

  const recent: PRRecord[] = []
  const previous: PRRecord[] = []

  for (const pr of prs) {
    const d = pr.date.length === 10 ? pr.date : pr.date.slice(0, 10)
    if (d >= recentStart) recent.push(pr)
    else if (d >= prevStart) previous.push(pr)
  }

  return { recent, previous }
}

// Número de semanas distintas con entrenos en un bloque.
const weeksTrained = (workouts: Workout[]): number => {
  const weeks = new Set(workouts.map((w) => weekStartKey(localDateOf(w))))
  return weeks.size
}

export const buildProgressNarrative = (
  workouts: Workout[],
  prs: PRRecord[],
  now = new Date()
): ProgressNarrative | null => {
  if (workouts.length < 4) return null

  const { recent, previous } = splitWeeks(workouts, now)
  const { recent: recentPRs, previous: prevPRs } = splitPRWeeks(prs, now)

  // Necesitamos datos en al menos 1 bloque para comparar.
  if (recent.length === 0 && previous.length === 0) return null

  const recentWeeks = Math.max(1, weeksTrained(recent))
  const prevWeeks = Math.max(1, weeksTrained(previous))

  const strengthCurrent = avgE1rm(recentPRs)
  const strengthPrev = avgE1rm(prevPRs)
  const strengthPct =
    strengthPrev > 0 ? ((strengthCurrent - strengthPrev) / strengthPrev) * 100 : 0

  const freqCurrent = recent.length / recentWeeks
  const freqPrev = previous.length / prevWeeks
  const freqPct = freqPrev > 0 ? ((freqCurrent - freqPrev) / freqPrev) * 100 : 0

  const volCurrent = recent.reduce((a, w) => a + w.totalVolume, 0) / recentWeeks
  const volPrev = previous.reduce((a, w) => a + w.totalVolume, 0) / prevWeeks
  const volPct = volPrev > 0 ? ((volCurrent - volPrev) / volPrev) * 100 : 0

  const strength: MetricTrend = {
    current: Math.round(strengthCurrent),
    previous: Math.round(strengthPrev),
    pctChange: Math.round(strengthPct),
    direction: classifyDirection(strengthPct),
  }

  const frequency: MetricTrend = {
    current: Math.round(freqCurrent * 10) / 10,
    previous: Math.round(freqPrev * 10) / 10,
    pctChange: Math.round(freqPct),
    direction: classifyDirection(freqPct),
  }

  const volume: MetricTrend = {
    current: Math.round(volCurrent),
    previous: Math.round(volPrev),
    pctChange: Math.round(volPct),
    direction: classifyDirection(volPct),
  }

  // Narrativa textual.
  const parts: string[] = []
  if (strength.direction === 'up') parts.push('Tu fuerza subió')
  else if (strength.direction === 'down') parts.push('Tu fuerza bajó')

  if (frequency.direction === 'up') parts.push('tu frecuencia subió')
  else if (frequency.direction === 'down') parts.push('tu frecuencia bajó')

  if (volume.direction === 'up') parts.push('y el volumen creció')
  else if (volume.direction === 'down') parts.push('y el volumen bajó')

  const narrative =
    parts.length > 0
      ? parts.join(', ') + '.'
      : 'Mantienes un ritmo estable.'

  const trends = [strength.direction, frequency.direction, volume.direction]
  const upCount = trends.filter((t) => t === 'up').length
  const downCount = trends.filter((t) => t === 'down').length
  const tone = upCount >= 2 ? 'positive' : downCount >= 2 ? 'alert' : 'neutral'

  return { strength, frequency, volume, narrative, tone }
}
