// Repositorio Dexie del peso corporal: una fila por día; upsert por fecha.
import { db } from './db'
import type { BodyWeightRepository } from '../types'

export const bodyWeightRepo: BodyWeightRepository = {
  getAll: () => db.bodyWeight.orderBy('localDate').toArray(),
  getByDate: (localDate) => db.bodyWeight.where('localDate').equals(localDate).first(),
  async upsert(entry) {
    // Misma fecha → actualiza el peso conservando la nota previa si no se envía otra.
    const existing = await db.bodyWeight.where('localDate').equals(entry.localDate).first()
    if (existing) {
      await db.bodyWeight.update(existing.id, {
        weightKg: entry.weightKg,
        note: entry.note ?? existing.note,
      })
      return existing.id
    }
    const last = await db.bodyWeight.orderBy('id').last()
    const id = (last?.id ?? 0) + 1
    await db.bodyWeight.add({
      id,
      localDate: entry.localDate,
      weightKg: entry.weightKg,
      note: entry.note,
      createdAt: new Date().toISOString(),
    })
    return id
  },
  delete: (id) => db.bodyWeight.where('id').equals(id).delete(),
}
