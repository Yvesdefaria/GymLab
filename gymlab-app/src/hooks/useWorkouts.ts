import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo, workoutSetRepo } from '@/data/repositories'

export const useWorkouts = () => {
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  return { workouts }
}

export const useWorkout = (id: number | null) => {
  const workout = useLiveQuery(
    () => (id ? workoutRepo.getById(id) : undefined),
    [id]
  )
  const sets = useLiveQuery(
    () => (id ? workoutSetRepo.getByWorkout(id) : []),
    [id]
  ) ?? []
  return { workout, sets }
}

export const useRecentWorkouts = (limit = 5) => {
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  return { workouts: workouts.slice(0, limit) }
}
