// Repositorio Dexie de guías informativas (solo lectura).
import { db } from './db'
import { getBySlug } from './base'
import type { GuideRepository } from '../types'

export const guideRepo: GuideRepository = {
  getAll: () => db.guides.toArray(),
  getBySlug: (slug) => getBySlug(db.guides, slug),
}
