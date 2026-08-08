// Hook que consulta todas las series registradas (para cálculos globales de volumen y PRs).
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutSetRepo } from '@/data/repositories'

// Devuelve el historial completo de series de todos los workouts.
export const useWorkoutSets = () => {
  const sets = useLiveQuery(() => workoutSetRepo.getAll(), []) ?? []
  return { sets }
}
