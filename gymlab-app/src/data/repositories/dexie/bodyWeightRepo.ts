// Repositorio Dexie del peso corporal: una fila por día; upsert por fecha.
import { db } from './db'
import { getByDate, upsertByDate } from './base'
import type { BodyWeightRepository } from '../types'

export const bodyWeightRepo: BodyWeightRepository = {
  getAll: () => db.bodyWeight.orderBy('localDate').toArray(),
  getByDate: (localDate) => getByDate(db.bodyWeight, localDate),
  upsert: (entry) =>
    upsertByDate(
      db.bodyWeight,
      entry.localDate,
      { weightKg: entry.weightKg, note: entry.note },
      // Misma fecha → actualiza el peso conservando la nota previa si no se envía otra.
      (existing, incoming) => ({ weightKg: incoming.weightKg, note: incoming.note ?? existing.note }),
    ),
  delete: (id) => db.bodyWeight.where('id').equals(id).delete(),
}
