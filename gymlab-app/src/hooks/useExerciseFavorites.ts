// Hooks que gestionan favoritos y recientes de ejercicios (persistidos en la tabla meta).
import { useCallback } from 'react'
import { metaRepo } from '@/data/repositories'
import { useLiveList } from './useLiveList'
import { useMetaIdFavorites } from './useMetaIdFavorites'

const FAV_KEY = 'exerciseFavorites'
const RECENT_KEY = 'exerciseRecents'
const MAX_RECENTS = 20

// Favoritos de ejercicios: delega en el hook genérico de ids.
export const useExerciseFavorites = () => useMetaIdFavorites(FAV_KEY)

// Mantiene un historial de ejercicios recientes (máx. 20), con el último visto primero.
export const useExerciseRecents = () => {
  const recents = useLiveList(() => metaRepo.getJson<number[]>(RECENT_KEY, []), [RECENT_KEY])
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
