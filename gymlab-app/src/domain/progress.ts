// Señal de deload a partir de la evolución del volumen semanal medio del historial reciente.
import type { Workout } from './types'
import { addLocalDays, localDateOf, toLocalDateStr, weekStartKey } from './dates'
import { volumeOf, type VolumeByWorkout } from './volume'

export interface DeloadSignal {
  recentWeeklyAvg: number
  previousWeeklyAvg: number
  dropPct: number
  suggestsDeload: boolean
}

// Compara la media semanal de las últimas 3 semanas con las 3 anteriores y sugiere deload si cae ≥15 %.
// F139.2: ventanas y agrupación por fecha local y semana que empieza el lunes (weekStartKey),
// como el resto del dominio; antes usaba startedAt, Date.now() y una semana que empezaba el domingo.
export const detectDeloadSignal = (
  workouts: Workout[],
  volumes: VolumeByWorkout,
  now: Date = new Date()
): DeloadSignal | null => {
  const today = toLocalDateStr(now)
  const recentStart = addLocalDays(today, -21)
  const previousStart = addLocalDays(today, -42)
  const tomorrow = addLocalDays(today, 1)

  const inWindow = (w: Workout, start: string, end: string): boolean => {
    const day = localDateOf(w)
    return day >= start && day < end
  }

  const recent = workouts.filter((w) => inWindow(w, recentStart, tomorrow))
  const previous = workouts.filter((w) => inWindow(w, previousStart, recentStart))

  if (recent.length < 2 || previous.length < 2) return null

  const avg = (list: Workout[]) => {
    // Media por semana para que entrenos sueltos de un mismo día no inflen la señal.
    const weeks = new Map<string, number>()
    for (const w of list) {
      const key = weekStartKey(localDateOf(w))
      weeks.set(key, (weeks.get(key) ?? 0) + volumeOf(w, volumes))
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
