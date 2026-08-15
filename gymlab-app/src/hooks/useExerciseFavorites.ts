// Hooks que gestionan favoritos y recientes de ejercicios (persistidos en la tabla meta).
import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo } from '@/data/repositories'

const FAV_KEY = 'exerciseFavorites'
const RECENT_KEY = 'exerciseRecents'
const MAX_RECENTS = 20

// Arrays vacíos estables: evitan que `useLiveQuery ?? []` cree referencias nuevas en cada render.
const EMPTY_FAVORITES: number[] = []
const EMPTY_RECENTS: number[] = []

// Lee los favoritos del usuario y permite añadir/quitar un ejercicio de la lista.
export const useExerciseFavorites = () => {
  const favorites = useLiveQuery(
    () => metaRepo.getJson<number[]>(FAV_KEY, []),
    [],
  ) ?? EMPTY_FAVORITES
  const toggle = useCallback(
    async (exerciseId: number) => {
      const next = favorites.includes(exerciseId)
        ? favorites.filter((id) => id !== exerciseId)
        : [...favorites, exerciseId]
      await metaRepo.setJson(FAV_KEY, next)
    },
    [favorites],
  )
  return { favorites, isFavorite: (id: number) => favorites.includes(id), toggle }
}

// Mantiene un historial de ejercicios recientes (máx. 20), con el último visto primero.
export const useExerciseRecents = () => {
  const recents = useLiveQuery(
    () => metaRepo.getJson<number[]>(RECENT_KEY, []),
    [],
  ) ?? EMPTY_RECENTS
  // Inserta el id al inicio y elimina duplicados, recortando a MAX_RECENTS.
  const record = useCallback(
    async (exerciseId: number) => {
      const next = [exerciseId, ...recents.filter((id) => id !== exerciseId)].slice(0, MAX_RECENTS)
      await metaRepo.setJson(RECENT_KEY, next)
    },
    [recents],
  )
  return { recents, record }
}
