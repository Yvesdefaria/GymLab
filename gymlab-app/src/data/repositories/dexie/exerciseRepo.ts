// Repositorio Dexie de ejercicios: lecturas sobre el catálogo sembrado.
import { db } from './db'
import { getBySlug } from './base'
import type { ExerciseRepository } from '../types'

export const exerciseRepo: ExerciseRepository = {
  getAll: () => db.exercises.toArray(),
  getBySlug: (slug) => getBySlug(db.exercises, slug),
  getById: (id) => db.exercises.where('id').equals(id).first(),
}
