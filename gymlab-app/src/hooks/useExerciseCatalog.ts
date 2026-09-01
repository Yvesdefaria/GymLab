// Hook y utilidades de filtrado para el catálogo de ejercicios.
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo } from '@/data/repositories'
import { COMMON_EXERCISE_SLUGS } from '@/domain/catalog'
import type { Equipment, Exercise, ExerciseCategory, MuscleGroup } from '@/domain/types'

export type ExerciseCatalogFilters = {
  search: string
  muscle: MuscleGroup | null
  category: ExerciseCategory | null
  equipment: Equipment | null
  onlyFavorites: boolean
  onlyCommon: boolean
}

// Filtros vacíos por defecto para iniciar el catálogo sin criterios aplicados.
export const EMPTY_FILTERS: ExerciseCatalogFilters = {
  search: '',
  muscle: null,
  category: null,
  equipment: null,
  onlyFavorites: false,
  onlyCommon: false,
}

// Consulta todos los ejercicios del catálogo de forma reactiva (incluye estado de carga).
export const useExerciseCatalog = () => {
  const result = useLiveQuery(() => exerciseRepo.getAll(), [])
  return { exercises: result ?? [], loading: result === undefined }
}

// Función pura que aplica todos los filtros activos sobre la lista de ejercicios.
export const filterExercises = (
  exercises: Exercise[],
  filters: ExerciseCatalogFilters,
  favorites: ReadonlySet<number>,
): Exercise[] => {
  const commonSet = new Set(COMMON_EXERCISE_SLUGS)
  const filtered = exercises.filter((ex) => {
    const q = filters.search.trim().toLowerCase()
    const matchSearch =
      !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.equipment.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q)
    const matchMuscle = !filters.muscle || ex.muscleGroup === filters.muscle
    const matchCategory = !filters.category || (ex.category ?? 'strength') === filters.category
    const matchEquipment = !filters.equipment || ex.equipment === filters.equipment
    const matchFav = !filters.onlyFavorites || favorites.has(ex.id)
    const matchCommon = !filters.onlyCommon || commonSet.has(ex.slug)
    return matchSearch && matchMuscle && matchCategory && matchEquipment && matchFav && matchCommon
  })
  // Con «Comunes» activo se respeta el orden canónico de COMMON_EXERCISE_SLUGS.
  if (filters.onlyCommon) {
    const indexOf = new Map(COMMON_EXERCISE_SLUGS.map((slug, i) => [slug, i]))
    filtered.sort((a, b) => (indexOf.get(a.slug) ?? 0) - (indexOf.get(b.slug) ?? 0))
  }
  return filtered
}
