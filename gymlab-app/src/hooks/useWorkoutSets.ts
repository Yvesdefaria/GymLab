import { useLiveQuery } from 'dexie-react-hooks'
import { workoutSetRepo } from '@/data/repositories'

export const useWorkoutSets = () => {
  const sets = useLiveQuery(() => workoutSetRepo.getAll(), []) ?? []
  return { sets }
}
