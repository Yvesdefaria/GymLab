import { db } from './db'
import { nextId } from './base'
import type { FoodItem } from '@/domain/types'

export const foodRepo = {
  getAll: () => db.foods.toArray(),
  getById: (id: number) => db.foods.get(id),
  add: async (food: Omit<FoodItem, 'id'>) => {
    const id = await nextId(db.foods)
    await db.foods.add({ ...food, id })
    return id
  },
  delete: (id: number) => db.foods.where('id').equals(id).delete(),
}
