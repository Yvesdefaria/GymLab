// Récords personales por ejercicio (clave exerciseId); put hace de upsert.
import { db } from './db'
import type { PRRepository } from '../types'

export const prRepo: PRRepository = {
  getAll: () => db.prs.toArray(),
  getByExercise: (exerciseId) =>
    db.prs.where('exerciseId').equals(exerciseId).first(),
  upsert: (pr) => db.prs.put(pr),
}
