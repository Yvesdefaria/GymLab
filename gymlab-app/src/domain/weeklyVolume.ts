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

// Construye las últimas `weeks` semanas (la última es la actual) y suma el
// volumen de cada entreno. Incluye semanas intermedias sin datos como 0 para
// que la serie no mienta sobre la continuidad; la UI decide si dibujarlas.
export const buildWeeklyVolumeSeries = (
  workouts: Pick<Workout, 'id' | 'localDate' | 'startedAt'>[],
  volumes: VolumeByWorkout,
  weeks = 5,
  now = new Date(),
): WeeklyVolumePoint[] => {
  if (weeks <= 0) return []

  const currentWeek = weekStartKey(toLocalDateStr(now))
  const series: WeeklyVolumePoint[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    series.push({
      weekStart: addLocalDays(currentWeek, -7 * i),
      volume: 0,
      isCurrent: i === 0,
    })
  }

  const byWeek = new Map(series.map((point) => [point.weekStart, point]))
  for (const workout of workouts) {
    const point = byWeek.get(weekStartKey(localDateOf(workout)))
    if (point) point.volume += volumeOf(workout, volumes)
  }

  return series
}
