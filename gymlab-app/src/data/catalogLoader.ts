import { seedExercisesExtra } from '@/data/seed/exercisesCatalog'
import { applyCatalogNames } from '@/data/seed/translations'
import { withCategory } from '@/domain/exerciseCategory'
import type { Exercise } from '@/domain/types'

export const CATALOG_VERSION = 'v1'

const normalize = (rows: unknown[]): Exercise[] =>
  rows.map((row) => applyCatalogNames(withCategory(row as Exercise)))

export const loadCatalog = async (): Promise<Exercise[]> => {
  try {
    const res = await fetch(`/catalog/exercises-${CATALOG_VERSION}.json`, {
      cache: 'no-cache',
    })
    if (res.ok) {
      const rows = (await res.json()) as unknown[]
      return normalize(rows)
    }
  } catch {
    // offline / fallback
  }
  return seedExercisesExtra.map(withCategory).map(applyCatalogNames)
}
