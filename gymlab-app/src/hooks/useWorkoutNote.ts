// Nota de sesión unificada (F84): vive SOLO en Workout.notes. La leen el sheet
// post-entreno y el panel del detalle; el guardado pasa por workoutRepo.update.
import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo } from '@/data/repositories'

export const useWorkoutNote = (workoutId: number | null) => {
  const note = useLiveQuery(
    async () => {
      if (!workoutId) return ''
      const workout = await workoutRepo.getById(workoutId)
      return workout?.notes ?? ''
    },
    [workoutId],
    ''
  )

  const save = useCallback(
    async (value: string) => {
      if (!workoutId) return
      await workoutRepo.update(workoutId, { notes: value.trim() })
    },
    [workoutId]
  )

  return { note: note ?? '', save }
}
