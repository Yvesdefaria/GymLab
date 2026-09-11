// Hooks que leen y guardan las notas personales asociadas a un ejercicio.
import { useMemo } from 'react'
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
// El Map se memoiza sobre el resultado de la query para mantener estable su referencia
// entre renders: un consumidor memoizado (p. ej. ExerciseBlock vía noteFor) no se
// re-renderiza por una nota y otra sin cambios.
export const useExerciseNotesMap = (exerciseIds: number[]) => {
  const notes = useLiveQuery(async () => {
    if (exerciseIds.length === 0) return []
    // Consulta indexada en vez de cargar todas las notas y filtrar en JS.
    return exerciseNoteRepo.getByExerciseIds(exerciseIds)
  }, [exerciseIds.join(',')]) ?? []

  return useMemo(() => {
    const map = new Map<number, string>()
    for (const row of notes) {
      map.set(row.exerciseId, row.note)
    }
    return map
  }, [notes])
}
