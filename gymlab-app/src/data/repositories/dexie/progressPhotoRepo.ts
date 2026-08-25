import { db } from './db'
import { nextId } from './base'
import type { ProgressPhotoRepository } from '../types'

export const progressPhotoRepo: ProgressPhotoRepository = {
  getAll: () => db.progressPhotos.toArray(),
  getByDate: (localDate) => db.progressPhotos.where('localDate').equals(localDate).first(),
  async upsert(entry) {
    const existing = await db.progressPhotos.where('localDate').equals(entry.localDate).first()
    if (existing) {
      await db.progressPhotos.where('id').equals(existing.id).modify(entry)
      return existing.id
    }
    const id = await nextId(db.progressPhotos)
    await db.progressPhotos.add({ ...entry, id, createdAt: new Date().toISOString() })
    return id
  },
  delete: (id) => db.progressPhotos.where('id').equals(id).delete(),
}
