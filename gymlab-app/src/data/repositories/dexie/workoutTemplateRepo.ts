// Repositorio Dexie de templates de sesión rápida (custom del usuario).
import { db } from './db'
import { nextId } from './base'
import type { WorkoutTemplateRepository } from '../types'

export const workoutTemplateRepo: WorkoutTemplateRepository = {
  getAll: () => db.workoutTemplates.toArray(),

  getById: (id) => db.workoutTemplates.get(id),

  create: async (template) => {
    const id = await nextId(db.workoutTemplates)
    await db.workoutTemplates.add({
      ...template,
      id,
      createdAt: new Date().toISOString(),
    } as any)
    return id
  },

  update: async (id, data) => {
    await db.workoutTemplates.update(id, data)
  },

  delete: (id) => db.workoutTemplates.delete(id),
}
