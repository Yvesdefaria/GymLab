// Carga el catálogo ampliado de ejercicios (JSON externo) con el seed masivo como respaldo.
// Combina traducción de nombres y asignación de categoría de forma consistente.
import { applyCatalogNames } from '@/data/seed/translations'
import { withCategory } from '@/domain/exerciseCategory'
import { inferZones } from '@/domain/muscleZoneInference'
import type { Exercise } from '@/domain/types'
import { logger } from '@/lib/logger'

// Versión del catálogo: parte del nombre del JSON a descargar.
export const CATALOG_VERSION = 'v2'

// Aplica a cada fila del catálogo los nombres traducidos y la categoría derivada del músculo.
// Rellena zonas inferidas solo si el ejercicio no trae zonas definidas.
const normalize = (rows: unknown[]): Exercise[] =>
  rows.map((row) => {
    const ex = applyCatalogNames(withCategory(row as Exercise))
    return { ...ex, muscleZones: ex.muscleZones?.length ? ex.muscleZones : inferZones(ex) }
  })

// Fallback embebido (821 filas): import dinámico para no cargarlo cuando el
// catálogo remoto sí responde; así el chunk del reseeder queda más liviano.
const loadEmbeddedCatalog = async (): Promise<Exercise[]> => {
  const { seedExercisesExtra } = await import('@/data/seed/exercisesExtra')
  return seedExercisesExtra.map(withCategory).map(applyCatalogNames).map((ex) => ({
    ...ex,
    muscleZones: ex.muscleZones?.length ? ex.muscleZones : inferZones(ex),
  }))
}

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
    logger.warn('catalog', 'catálogo remoto inaccesible: uso el seed embebido', { status: res.status })
  } catch (error) {
    // offline o JSON inválido: seguimos con el seed embebido.
    logger.warn('catalog', 'catálogo remoto inaccesible: uso el seed embebido', { error })
  }
  try {
    return await loadEmbeddedCatalog()
  } catch (error) {
    // R3-002 (F103/T3): el chunk del fallback también puede fallar (cache vieja
    // que apunta a un hash inexistente o primera visita offline). El seed sigue
    // con el catálogo base en vez de rechazar el arranque completo.
    logger.error('catalog', 'fallback embebido inaccesible: seed sin catálogo ampliado', { error })
    return []
  }
}
