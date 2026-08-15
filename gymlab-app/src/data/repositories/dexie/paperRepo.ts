// Repositorio Dexie de papers de la biblioteca (solo lectura).
import { db } from './db'
import { getBySlug } from './base'
import type { PaperRepository } from '../types'

export const paperRepo: PaperRepository = {
  getAll: () => db.papers.toArray(),
  getBySlug: (slug) => getBySlug(db.papers, slug),
}
