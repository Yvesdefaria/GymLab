// Hook que gestiona la bitácora post-entreno (journal de sesión) por workout.
import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { sessionJournalRepo } from '@/data/repositories'

// Consulta la entrada del journal para un workout concreto y expone guardar/eliminar.
export const useSessionJournal = (workoutId: number | null) => {
  const entry = useLiveQuery(
    () => (workoutId ? sessionJournalRepo.getByWorkout(workoutId) : Promise.resolve(undefined)),
    [workoutId],
  )

  const save = useCallback(
    async (data: {
      energy: 1 | 2 | 3 | 4 | 5
      sleep: 1 | 2 | 3 | 4 | 5
      mood: 1 | 2 | 3 | 4 | 5
      soreness: 1 | 2 | 3 | 4 | 5
      note?: string
    }) => {
      if (!workoutId) return
      await sessionJournalRepo.upsert({ workoutId, ...data })
    },
    [workoutId],
  )

  const remove = useCallback(() => {
    if (!workoutId) return Promise.resolve()
    return sessionJournalRepo.delete(workoutId)
  }, [workoutId])

  return { entry, save, remove }
}
