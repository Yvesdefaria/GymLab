// Hook que consulta todas las series registradas (para cálculos globales de volumen y PRs).
import { useLiveList } from './useLiveList'
import { workoutSetRepo } from '@/data/repositories'

// Devuelve el historial completo de series de todos los workouts.
export const useWorkoutSets = () => {
  const sets = useLiveList(() => workoutSetRepo.getAll())
  return { sets }
}
