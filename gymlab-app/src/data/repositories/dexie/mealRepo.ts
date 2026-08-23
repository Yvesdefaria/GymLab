import { db } from './db'
import { nextId } from './base'
import type { MealRepository } from '../types'

export const mealRepo: MealRepository = {
  getAll: () => db.mealEntries.toArray(),
  getByDate: (localDate) =>
    db.mealEntries.where('localDate').equals(localDate).toArray(),
  async add(meal) {
    const id = await nextId(db.mealEntries)
    await db.mealEntries.add({ ...meal, id, createdAt: new Date().toISOString() })
    return id
  },
  delete: (id) => db.mealEntries.where('id').equals(id).delete(),
}
