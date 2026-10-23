// Helpers puros de los héroes de /estadisticas (rediseño C1). Sin React, sin
// Dexie: la UI solo formatea y presenta.
import type { Workout } from './types'
import { addLocalDays, toLocalDateStr, weekStartKey } from './dates'

export type VolumeHero = {
  current: number
  previous: number
  deltaPct: number | null
}

// Volumen de la semana calendario (lunes–domingo) y delta contra la anterior.
// Si la semana anterior no tiene volumen, no se inventa un −100%.
export const buildVolumeHero = (
  workouts: Workout[],
  today: string = toLocalDateStr(),
): VolumeHero => {
  const currentWeek = weekStartKey(today)
  const previousWeek = addLocalDays(currentWeek, -7)
  let current = 0
  let previous = 0

  for (const workout of workouts) {
    const week = weekStartKey(workout.localDate)
    if (week === currentWeek) current += workout.totalVolume || 0
    else if (week === previousWeek) previous += workout.totalVolume || 0
  }

  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : null
  return { current, previous, deltaPct }
}
