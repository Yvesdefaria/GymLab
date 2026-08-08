// Notas personales por ejercicio: una fila por exerciseId; lectura/escritura upsert.
import { db } from './db'
import type { ExerciseNoteRepository } from '../types'

export const exerciseNoteRepo: ExerciseNoteRepository = {
  getAll: () => db.exerciseNotes.toArray(),
  async get(exerciseId) {
    // Devuelve la nota o cadena vacía si el ejercicio aún no tiene.
    const row = await db.exerciseNotes.where('exerciseId').equals(exerciseId).first()
    return row?.note ?? ''
  },
  async set(exerciseId, note) {
    // Actualiza si existe; si no, crea la fila (nota vacía no debe existir).
    const row = await db.exerciseNotes.where('exerciseId').equals(exerciseId).first()
    if (row) return db.exerciseNotes.update(exerciseId, { note, updatedAt: new Date().toISOString() })
    return db.exerciseNotes.add({
      exerciseId,
      note,
      updatedAt: new Date().toISOString(),
    })
  },
}
