import { db } from './db'
import type { GuideRepository } from '../types'

export const guideRepo: GuideRepository = {
  getAll: () => db.guides.toArray(),
  getBySlug: (slug) => db.guides.where('slug').equals(slug).first(),
}
