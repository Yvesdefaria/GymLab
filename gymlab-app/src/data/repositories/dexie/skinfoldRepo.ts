// Repositorio Dexie de pliegues cutáneos: una fila por día; upsert por fecha.
import { db } from './db'
import type { SkinfoldRepository } from '../types'

export const skinfoldRepo: SkinfoldRepository = {
  getAll: () => db.skinfolds.orderBy('localDate').toArray(),
  getByDate: (localDate) => db.skinfolds.where('localDate').equals(localDate).first(),
  async upsert(entry) {
    // Misma fecha → actualiza la medición; si no, crea fila con id incremental.
    const existing = await db.skinfolds.where('localDate').equals(entry.localDate).first()
    if (existing) {
      await db.skinfolds.update(existing.id, {
        sex: entry.sex,
        age: entry.age,
        weightKg: entry.weightKg,
        sites: entry.sites,
      })
      return existing.id
    }
    const last = await db.skinfolds.orderBy('id').last()
    const id = (last?.id ?? 0) + 1
    await db.skinfolds.add({
      id,
      localDate: entry.localDate,
      sex: entry.sex,
      age: entry.age,
      weightKg: entry.weightKg,
      sites: entry.sites,
      createdAt: new Date().toISOString(),
    })
    return id
  },
  delete: (id) => db.skinfolds.where('id').equals(id).delete(),
}
