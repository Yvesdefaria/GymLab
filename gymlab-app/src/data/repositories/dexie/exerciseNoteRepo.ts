import { db } from './db'
import type { ExerciseNoteRepository } from '../types'

export const exerciseNoteRepo: ExerciseNoteRepository = {
  async get(exerciseId) {
    const row = await db.exerciseNotes.where('exerciseId').equals(exerciseId).first()
    return row?.note ?? ''
  },
  async set(exerciseId, note) {
    const row = await db.exerciseNotes.where('exerciseId').equals(exerciseId).first()
    if (row) return db.exerciseNotes.update(exerciseId, { note, updatedAt: new Date().toISOString() })
    return db.exerciseNotes.add({
      exerciseId,
      note,
      updatedAt: new Date().toISOString(),
    })
  },
}
