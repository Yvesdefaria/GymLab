// F139.4 — Fuente única del par semana actual/anterior para el volumen: semana
// calendario (lunes–domingo), delta y tono. `previous = 0` es neutro (delta null):
// un porcentaje desde cero no está definido y no se inventa un +100 %.
import type { Workout } from './types'
import { addLocalDays, localDateOf, toLocalDateStr, weekStartKey } from './dates'
import { volumeOf, type VolumeByWorkout } from './volume'

export type WeekVolumeTone = 'positive' | 'neutral' | 'alert'

// Umbrales de variación (%) para clasificar el tono. Única definición.
export const WEEK_VOLUME_POSITIVE_PCT = 5
export const WEEK_VOLUME_ALERT_PCT = -10

export interface WeekVolumeComparison {
  current: number
  previous: number
  deltaPct: number | null
  tone: WeekVolumeTone
  currentWeekKey: string
  previousWeekKey: string
}

export const compareWeekVolume = (
  workouts: Workout[],
  volumes: VolumeByWorkout,
  today: string = toLocalDateStr(),
): WeekVolumeComparison => {
  const currentWeekKey = weekStartKey(today)
  const previousWeekKey = addLocalDays(currentWeekKey, -7)

  let current = 0
  let previous = 0
  for (const workout of workouts) {
    const week = weekStartKey(localDateOf(workout))
    if (week === currentWeekKey) current += volumeOf(workout, volumes)
    else if (week === previousWeekKey) previous += volumeOf(workout, volumes)
  }

  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : null
  const tone: WeekVolumeTone =
    deltaPct === null
      ? 'neutral'
      : deltaPct >= WEEK_VOLUME_POSITIVE_PCT
        ? 'positive'
        : deltaPct <= WEEK_VOLUME_ALERT_PCT
          ? 'alert'
          : 'neutral'

  return { current, previous, deltaPct, tone, currentWeekKey, previousWeekKey }
}
