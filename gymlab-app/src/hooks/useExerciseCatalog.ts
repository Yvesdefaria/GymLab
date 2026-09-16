// Hook y utilidades de filtrado para el catálogo de ejercicios.
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo } from '@/data/repositories'
import { COMMON_EXERCISE_SLUGS } from '@/domain/catalog'
import type { Equipment, Exercise, ExerciseCategory, MuscleGroup, MuscleZone } from '@/domain/types'

export type ExerciseCatalogFilters = {
  search: string
  muscle: MuscleGroup | null
  zone: MuscleZone | null
  category: ExerciseCategory | null
  // Consulta puntual y efímera de equipo (selector de sesión). NO es «mi gym»:
  // la disponibilidad persistida viaja aparte, como parámetro de filterExercises.
  equipmentQuery: Equipment | null
  onlyFavorites: boolean
  onlyCommon: boolean
}

// Filtros vacíos por defecto para iniciar el catálogo sin criterios aplicados.
export const EMPTY_FILTERS: ExerciseCatalogFilters = {
  search: '',
  muscle: null,
  zone: null,
  category: null,
  equipmentQuery: null,
  onlyFavorites: false,
  onlyCommon: false,
}

// Consulta todos los ejercicios del catálogo de forma reactiva (incluye estado de carga).
export const useExerciseCatalog = () => {
  const result = useLiveQuery(() => exerciseRepo.getAll(), [])
  return { exercises: result ?? [], loading: result === undefined }
}

// Función pura que aplica todos los filtros activos sobre la lista de ejercicios.
// `availableEquipment` es el equipamiento declarado por el usuario («mi gym»): es una
// preferencia persistida, no un filtro efímero de la barra. Vacío = sin filtro (se ve todo),
// de modo que nunca se esconde el catálogo por no haber configurado nada todavía.
export const filterExercises = (
  exercises: Exercise[],
  filters: ExerciseCatalogFilters,
  favorites: ReadonlySet<number>,
  availableEquipment: readonly Equipment[] = [],
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
    const matchZone = !filters.zone || (ex.muscleZones ?? []).includes(filters.zone)
    const matchCategory = !filters.category || (ex.category ?? 'strength') === filters.category
    const matchEquipmentQuery = !filters.equipmentQuery || ex.equipment === filters.equipmentQuery
    const matchEquipment =
      availableEquipment.length === 0 || availableEquipment.includes(ex.equipment)
    const matchFav = !filters.onlyFavorites || favorites.has(ex.id)
    const matchCommon = !filters.onlyCommon || commonSet.has(ex.slug)
    return (
      matchSearch &&
      matchMuscle &&
      matchZone &&
      matchCategory &&
      matchEquipmentQuery &&
      matchEquipment &&
      matchFav &&
      matchCommon
    )
  })
  // Con «Comunes» activo se respeta el orden canónico de COMMON_EXERCISE_SLUGS.
  if (filters.onlyCommon) {
    const indexOf = new Map(COMMON_EXERCISE_SLUGS.map((slug, i) => [slug, i]))
    filtered.sort((a, b) => (indexOf.get(a.slug) ?? 0) - (indexOf.get(b.slug) ?? 0))
  }
  return filtered
}
