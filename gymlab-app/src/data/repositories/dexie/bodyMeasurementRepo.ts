import { db } from './db'
import type { BodyMeasurementRepository } from '../types'

export const bodyMeasurementRepo: BodyMeasurementRepository = {
  getAll: () => db.bodyMeasurements.orderBy('localDate').toArray(),
  getByDate: (localDate) => db.bodyMeasurements.where('localDate').equals(localDate).first(),
  async upsert(entry) {
    const existing = await db.bodyMeasurements
      .where('localDate')
      .equals(entry.localDate)
      .first()
    if (existing) {
      await db.bodyMeasurements.update(existing.id, {
        values: { ...existing.values, ...entry.values },
      })
      return existing.id
    }
    const last = await db.bodyMeasurements.orderBy('id').last()
    const id = (last?.id ?? 0) + 1
    await db.bodyMeasurements.add({
      id,
      localDate: entry.localDate,
      values: entry.values,
      createdAt: new Date().toISOString(),
    })
    return id
  },
  delete: (id) => db.bodyMeasurements.where('id').equals(id).delete(),
}
