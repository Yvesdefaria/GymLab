import type { MetaRow } from '@/domain/types'
import { db } from './db'

export interface MetaRepository {
  get(key: string): Promise<MetaRow | undefined>
  set(key: string, value: string): Promise<unknown>
  getJson<T>(key: string, fallback: T): Promise<T>
  setJson<T>(key: string, value: T): Promise<unknown>
}

export const metaRepo: MetaRepository = {
  get: (key) => db.meta.get(key),
  set: (key, value) => db.meta.put({ key, value }),
  getJson: async <T>(key: string, fallback: T): Promise<T> => {
    const row = await db.meta.get(key)
    if (!row) return fallback
    try {
      return JSON.parse(row.value) as T
    } catch {
      return fallback
    }
  },
  setJson: <T>(key: string, value: T) => db.meta.put({ key, value: JSON.stringify(value) }),
}
