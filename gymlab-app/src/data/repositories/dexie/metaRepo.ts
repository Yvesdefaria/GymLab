import type { MetaRow } from '@/domain/types'
import { db } from './db'

export interface MetaRepository {
  get(key: string): Promise<MetaRow | undefined>
  set(key: string, value: string): Promise<unknown>
}

export const metaRepo: MetaRepository = {
  get: (key) => db.meta.get(key),
  set: (key, value) => db.meta.put({ key, value }),
}
