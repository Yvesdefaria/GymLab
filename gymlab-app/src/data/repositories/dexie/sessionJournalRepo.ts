// Repositorio Dexie de bitácora post-entreno: una entrada por workout.
import { db } from './db'
import { nextId } from './base'
import type { SessionJournalRepository } from '../types'

export const sessionJournalRepo: SessionJournalRepository = {
  getAll: () => db.sessionJournals.orderBy('id').toArray(),

  getByWorkout: (workoutId) =>
    db.sessionJournals.where('workoutId').equals(workoutId).first(),

  upsert: async (entry) => {
    const existing = await db.sessionJournals
      .where('workoutId')
      .equals(entry.workoutId)
      .first()

    if (existing) {
      await db.sessionJournals.update(existing.id, {
        energy: entry.energy,
        sleep: entry.sleep,
        mood: entry.mood,
        soreness: entry.soreness,
        note: entry.note,
      })
      return existing.id
    }

    const id = await nextId(db.sessionJournals)
    const row = {
      id,
      workoutId: entry.workoutId,
      energy: entry.energy,
      sleep: entry.sleep,
      mood: entry.mood,
      soreness: entry.soreness,
      note: entry.note,
      createdAt: new Date().toISOString(),
    }
    await db.sessionJournals.add(row)
    return id
  },

  delete: (workoutId) =>
    db.sessionJournals.where('workoutId').equals(workoutId).delete(),
}
