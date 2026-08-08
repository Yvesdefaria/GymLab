// Hooks que leen y guardan las notas personales asociadas a un ejercicio.
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseNoteRepo } from '@/data/repositories'

// Consulta la nota de un ejercicio concreto y permite actualizarla.
export const useExerciseNote = (exerciseId: number) => {
  const note = useLiveQuery(() => exerciseNoteRepo.get(exerciseId), [exerciseId]) ?? ''
  return {
    note,
    setNote: (value: string) => exerciseNoteRepo.set(exerciseId, value),
  }
}

// Devuelve un Map<exerciseId, nota> solo con las notas de los ejercicios solicitados.
export const useExerciseNotesMap = (exerciseIds: number[]) => {
  const notes = useLiveQuery(async () => {
    if (exerciseIds.length === 0) return []
    return exerciseNoteRepo.getAll()
  }, [exerciseIds.join(',')]) ?? []

  const map = new Map<number, string>()
  for (const row of notes) {
    if (exerciseIds.includes(row.exerciseId)) map.set(row.exerciseId, row.note)
  }
  return map
}
