// Hook y utilidades de filtrado para el catálogo de ejercicios.
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo } from '@/data/repositories'
import { CATEGORY_LABELS } from '@/domain/exerciseCategory'
import type { Exercise, ExerciseCategory, MuscleGroup } from '@/domain/types'

// Opciones disponibles para el filtro de equipamiento del catálogo.
export const EQUIPMENT_OPTIONS = [
  'barra', 'mancuernas', 'maquina', 'polea', 'peso corporal',
  'banco', 'kettlebell', 'banda', 'otro',
] as const

// Categorías de ejercicio por las que se puede filtrar.
export const CATEGORY_OPTIONS: ExerciseCategory[] = [
  'strength', 'stretch', 'cardio', 'mobility',
]

export type ExerciseCatalogFilters = {
  search: string
  muscle: MuscleGroup | null
  category: ExerciseCategory | null
  equipment: string | null
  onlyWithPhoto: boolean
  onlyFavorites: boolean
}

// Filtros vacíos por defecto para iniciar el catálogo sin criterios aplicados.
export const EMPTY_FILTERS: ExerciseCatalogFilters = {
  search: '',
  muscle: null,
  category: null,
  equipment: null,
  onlyWithPhoto: false,
  onlyFavorites: false,
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
): Exercise[] =>
  exercises.filter((ex) => {
    const q = filters.search.trim().toLowerCase()
    const matchSearch =
      !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.equipment.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q)
    const matchMuscle = !filters.muscle || ex.muscleGroup === filters.muscle
    const matchCategory = !filters.category || (ex.category ?? 'strength') === filters.category
    const matchEquipment = !filters.equipment || ex.equipment === filters.equipment
    const matchPhoto = !filters.onlyWithPhoto || (ex.imageUrls?.length ?? 0) > 0
    const matchFav = !filters.onlyFavorites || favorites.has(ex.id)
    return matchSearch && matchMuscle && matchCategory && matchEquipment && matchPhoto && matchFav
  })

// Devuelve la etiqueta legible de una categoría de ejercicio.
export const categoryLabel = (category?: ExerciseCategory) =>
  CATEGORY_LABELS[category ?? 'strength']
