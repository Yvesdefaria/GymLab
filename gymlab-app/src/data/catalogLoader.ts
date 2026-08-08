// Carga el catálogo ampliado de ejercicios (JSON externo) con el seed masivo como respaldo.
// Combina traducción de nombres y asignación de categoría de forma consistente.
import { seedExercisesExtra } from '@/data/seed/exercisesCatalog'
import { applyCatalogNames } from '@/data/seed/translations'
import { withCategory } from '@/domain/exerciseCategory'
import type { Exercise } from '@/domain/types'

// Versión del catálogo: parte del nombre del JSON a descargar.
export const CATALOG_VERSION = 'v1'

// Aplica a cada fila del catálogo los nombres traducidos y la categoría derivada del músculo.
const normalize = (rows: unknown[]): Exercise[] =>
  rows.map((row) => applyCatalogNames(withCategory(row as Exercise)))

// Intenta descargar el catálogo; si falla (offline) usa el seed embebido como fallback.
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
