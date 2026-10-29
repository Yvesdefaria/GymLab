// Serie de volumen por semana para el bloque «Progreso» de la home.
import { addLocalDays, localDateOf, toLocalDateStr, weekStartKey } from './dates'
import type { Workout } from './types'
import { volumeOf, type VolumeByWorkout } from './volume'

export interface WeeklyVolumePoint {
  // Lunes de la semana (YYYY-MM-DD).
  weekStart: string
  volume: number
  isCurrent: boolean
}

// Construye la serie de volumen por semana. En modo ventana (`all = false`) devuelve
// las últimas `weeks` semanas y, si `zeroFill`, incluye las que no tienen entrenos.
// En modo `all` devuelve solo las semanas con datos, sin limitar el historial.
export const buildWeeklyVolumeSeries = (
  workouts: Pick<Workout, 'id' | 'localDate' | 'startedAt'>[],
  volumes: VolumeByWorkout,
  weeks = 5,
  now = new Date(),
  zeroFill = true,
  all = false,
): WeeklyVolumePoint[] => {
  const currentWeek = weekStartKey(toLocalDateStr(now))

  if (all) {
    const byWeek = new Map<string, number>()
    for (const workout of workouts) {
      const key = weekStartKey(localDateOf(workout))
      byWeek.set(key, (byWeek.get(key) ?? 0) + volumeOf(workout, volumes))
    }
    return [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, volume]) => ({ weekStart, volume, isCurrent: weekStart === currentWeek }))
  }

  if (weeks <= 0) return []

  const series: WeeklyVolumePoint[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    series.push({
      weekStart: addLocalDays(currentWeek, -7 * i),
      volume: 0,
      isCurrent: i === 0,
    })
  }

  const byWeek = new Map(series.map((point) => [point.weekStart, point]))
  const hasWorkout = new Set<string>()
  for (const workout of workouts) {
    const key = weekStartKey(localDateOf(workout))
    const point = byWeek.get(key)
    if (!point) continue
    hasWorkout.add(key)
    point.volume += volumeOf(workout, volumes)
  }

  return zeroFill ? series : series.filter((point) => hasWorkout.has(point.weekStart))
}
