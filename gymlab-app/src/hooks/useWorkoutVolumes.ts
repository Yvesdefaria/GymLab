// Volumen de entrenamiento por workout, derivado de las series (sin columna cacheada).
import { useMemo } from 'react'
import { buildVolumeByWorkout } from '@/domain/volume'
import { useWorkoutSets } from './useWorkoutSets'

export const useWorkoutVolumes = () => {
  const { sets } = useWorkoutSets()
  return useMemo(() => buildVolumeByWorkout(sets), [sets])
}
