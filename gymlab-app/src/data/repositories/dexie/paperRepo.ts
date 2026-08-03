import { db } from './db'
import type { PaperRepository } from '../types'

export const paperRepo: PaperRepository = {
  getAll: () => db.papers.toArray(),
  getBySlug: (slug) => db.papers.where('slug').equals(slug).first(),
}
