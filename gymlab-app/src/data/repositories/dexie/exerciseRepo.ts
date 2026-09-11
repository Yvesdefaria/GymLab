// Repositorio Dexie de ejercicios: lecturas sobre el catálogo sembrado.
import { db } from './db'
import { getBySlug } from './base'
import type { ExerciseRepository } from '../types'

export const exerciseRepo: ExerciseRepository = {
  getAll: () => db.exercises.toArray(),
  getBySlug: (slug) => getBySlug(db.exercises, slug),
  getById: (id) => db.exercises.where('id').equals(id).first(),
  // Una sola consulta anyOf; sin ids devuelve [] directamente (sin tocar la tabla).
  getByIds: (ids) =>
    ids.length === 0 ? Promise.resolve([]) : db.exercises.where('id').anyOf(ids).toArray(),
}
