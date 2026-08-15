// Repositorio Dexie de medidas corporales: una fila por día; upsert por fecha.
import { db } from './db'
import { getByDate, upsertByDate } from './base'
import type { BodyMeasurementRepository } from '../types'

export const bodyMeasurementRepo: BodyMeasurementRepository = {
  getAll: () => db.bodyMeasurements.orderBy('localDate').toArray(),
  getByDate: (localDate) => getByDate(db.bodyMeasurements, localDate),
  upsert: (entry) =>
    upsertByDate(
      db.bodyMeasurements,
      entry.localDate,
      { values: entry.values },
      // Si ya hay registro del día se fusionan las zonas; si no, se crea con id incremental.
      (existing, incoming) => ({ values: { ...existing.values, ...incoming.values } }),
    ),
  delete: (id) => db.bodyMeasurements.where('id').equals(id).delete(),
}
