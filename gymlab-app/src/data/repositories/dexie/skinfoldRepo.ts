// Repositorio Dexie de pliegues cutáneos: una fila por día; upsert por fecha.
import { db } from './db'
import { getByDate, upsertByDate } from './base'
import type { SkinfoldRepository } from '../types'

export const skinfoldRepo: SkinfoldRepository = {
  getAll: () => db.skinfolds.orderBy('localDate').toArray(),
  getByDate: (localDate) => getByDate(db.skinfolds, localDate),
  upsert: (entry) =>
    upsertByDate(db.skinfolds, entry.localDate, {
      sex: entry.sex,
      age: entry.age,
      weightKg: entry.weightKg,
      sites: entry.sites,
    }),
  delete: (id) => db.skinfolds.where('id').equals(id).delete(),
}
