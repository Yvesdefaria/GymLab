import { db } from './db'
import { nextId } from './base'
import type { SupplementRepository } from '../types'

export const supplementRepo: SupplementRepository = {
  getAll: () => db.supplements.toArray(),
  async add(s) {
    const id = await nextId(db.supplements)
    await db.supplements.add({ ...s, id, createdAt: new Date().toISOString() })
    return id
  },
  update: (id, changes) => db.supplements.where('id').equals(id).modify(changes),
  delete: (id) => db.supplements.where('id').equals(id).delete(),
}
