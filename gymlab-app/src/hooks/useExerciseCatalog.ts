import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo } from '@/data/repositories'
import { CATEGORY_LABELS } from '@/domain/exerciseCategory'
import type { Exercise, ExerciseCategory, MuscleGroup } from '@/domain/types'

export const EQUIPMENT_OPTIONS = [
  'barra', 'mancuernas', 'maquina', 'polea', 'peso corporal',
  'banco', 'kettlebell', 'banda', 'otro',
] as const

export const CATEGORY_OPTIONS: ExerciseCategory[] = [
  'strength', 'stretch', 'cardio', 'mobility',
]

export const muscleGroupEmoji: Record<MuscleGroup, string> = {
  pecho: '🏋️',
  espalda: '💪',
  biceps: '💪',
  triceps: '💪',
  hombro: '🏋️',
  pierna: '🦵',
  gluteo: '🦵',
  abdomen: '🧱',
  trapecios: '🏋️',
  antebrazo: '💪',
  cardio: '❤️',
}

export type ExerciseCatalogFilters = {
  search: string
  muscle: MuscleGroup | null
  category: ExerciseCategory | null
  equipment: string | null
  onlyWithPhoto: boolean
  onlyFavorites: boolean
}

export const EMPTY_FILTERS: ExerciseCatalogFilters = {
  search: '',
  muscle: null,
  category: null,
  equipment: null,
  onlyWithPhoto: false,
  onlyFavorites: false,
}

export const useExerciseCatalog = () => {
  const exercises = useLiveQuery(() => exerciseRepo.getAll(), []) ?? []
  return { exercises }
}

export const filterExercises = (
  exercises: Exercise[],
  filters: ExerciseCatalogFilters,
  favorites: number[],
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
    const matchFav = !filters.onlyFavorites || favorites.includes(ex.id)
    return matchSearch && matchMuscle && matchCategory && matchEquipment && matchPhoto && matchFav
  })

export const categoryLabel = (category?: ExerciseCategory) =>
  CATEGORY_LABELS[category ?? 'strength']
