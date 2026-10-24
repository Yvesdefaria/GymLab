// Conteo de ejercicios por rutina para el catálogo: una lectura agregada por tabla.
// Dexie re-ejecuta la query cuando cambian routineDays o routineItems.
import { useLiveQuery } from 'dexie-react-hooks'
import { routineRepo } from '@/data/repositories'

const EMPTY_COUNTS: Record<number, number> = {}

export const useRoutineExerciseCounts = () => {
  const counts = useLiveQuery(() => routineRepo.getExerciseCounts())
  return { counts: counts ?? EMPTY_COUNTS }
}
