// Nota de sesión unificada (F84): vive SOLO en Workout.notes. La leen el sheet
// post-entreno y el panel del detalle; el guardado pasa por workoutRepo.update.
import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo } from '@/data/repositories'

// Save del hook exportado para test (patrón del repo: lógica pura del hook).
export const saveWorkoutNote = async (
  update: (id: number, patch: { notes: string }) => Promise<unknown>,
  workoutId: number | null,
  value: string,
): Promise<void> => {
  if (workoutId === null) return
  await update(workoutId, { notes: value.trim() })
}

export const useWorkoutNote = (workoutId: number | null) => {
  // Default undefined = «cargando», distinto de «vacía»: la precarga no debe
  // pisar lo que el usuario escribe antes de que la query resuelva.
  const note = useLiveQuery(
    async () => {
      if (!workoutId) return ''
      const workout = await workoutRepo.getById(workoutId)
      return workout?.notes ?? ''
    },
    [workoutId],
    undefined
  )

  const save = useCallback(
    async (value: string) =>
      saveWorkoutNote((id, patch) => workoutRepo.update(id, patch), workoutId, value),
    [workoutId]
  )

  return { note, ready: note !== undefined, save }
}
