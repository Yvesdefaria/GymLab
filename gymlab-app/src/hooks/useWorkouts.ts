// Hooks que consultan los workouts guardados y sus series asociadas.
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo, workoutSetRepo } from '@/data/repositories'

// Devuelve todos los workouts registrados para listados y estadísticas.
export const useWorkouts = () => {
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  return { workouts }
}

// Devuelve un workout concreto junto con sus series para la vista de detalle.
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
