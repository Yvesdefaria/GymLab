import { db } from './db'
import { nextId } from './base'
import type { PeriodizationRepository } from '../types'

export const periodizationRepo: PeriodizationRepository = {
  getAll: () => db.periodizationPlans.toArray(),
  getActive: () => db.periodizationPlans.where('isActive').equals(1).first(),
  async create(plan) {
    const id = await nextId(db.periodizationPlans)
    await db.periodizationPlans.add({ ...plan, id, createdAt: new Date().toISOString() })
    return id
  },
  update: (id, changes) => db.periodizationPlans.where('id').equals(id).modify(changes),
  delete: (id) => db.periodizationPlans.where('id').equals(id).delete(),
  async setActive(id) {
    await db.periodizationPlans.toCollection().modify({ isActive: false })
    await db.periodizationPlans.where('id').equals(id).modify({ isActive: true })
  },
}
