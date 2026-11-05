// Helpers puros de los héroes de /estadisticas (rediseño C1). Sin React, sin
// Dexie: la UI solo formatea y presenta.
import type { Workout } from './types'
import { toLocalDateStr } from './dates'
import { type VolumeByWorkout } from './volume'
import { compareWeekVolume } from './weekVolume'

export type VolumeHero = {
  current: number
  previous: number
  deltaPct: number | null
}

// Volumen de la semana calendario (lunes–domingo) y delta contra la anterior.
// Si la semana anterior no tiene volumen, no se inventa un −100%.
export const buildVolumeHero = (
  workouts: Workout[],
  volumes: VolumeByWorkout,
  today: string = toLocalDateStr(),
): VolumeHero => {
  const comparison = compareWeekVolume(workouts, volumes, today)
  return {
    current: comparison.current,
    previous: comparison.previous,
    deltaPct: comparison.deltaPct,
  }
}
