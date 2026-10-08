// Migración de la nota de sesión (F84): mueve journal.note a workouts.notes y
// limpia el campo viejo (fuente única). Se usa en el upgrade v15 y en el import
// de backups previos.
import type { Transaction } from 'dexie'
import { mergeSessionNotes } from '@/domain/sessionNotes'

export const migrateJournalNotesToWorkouts = async (tx: Transaction): Promise<void> => {
  const journals = await tx.table('sessionJournals').toArray()
  for (const journal of journals) {
    const journalNote = typeof journal.note === 'string' ? journal.note.trim() : ''
    if (!journalNote) continue
    const workout = await tx.table('workouts').get(journal.workoutId)
    // Huérfano (workout borrado): no hay dónde unificar; no se toca.
    if (!workout) continue
    await tx.table('workouts').update(journal.workoutId, {
      notes: mergeSessionNotes(workout.notes ?? '', journalNote),
    })
    await tx.table('sessionJournals').update(journal.id, { note: undefined })
  }
}
