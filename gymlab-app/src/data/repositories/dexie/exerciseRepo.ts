import { db } from './db'
import type { ExerciseRepository } from '../types'

export const exerciseRepo: ExerciseRepository = {
  getAll: () => db.exercises.toArray(),
  getBySlug: (slug) => db.exercises.where('slug').equals(slug).first(),
  getById: (id) => db.exercises.where('id').equals(id).first(),
}
