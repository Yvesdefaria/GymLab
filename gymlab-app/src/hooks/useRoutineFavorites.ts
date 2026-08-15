// Hook que gestiona las rutinas marcadas como favoritas (persistidas en la tabla meta).
import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo } from '@/data/repositories'

const FAV_KEY = 'routineFavorites'

// Array vacío estable: evita que `useLiveQuery ?? []` cree una referencia nueva en cada render.
const EMPTY_FAVORITES: number[] = []

// Lee los favoritos del usuario y permite añadir/quitar una rutina de la lista.
export const useRoutineFavorites = () => {
  const favorites = useLiveQuery(
    () => metaRepo.getJson<number[]>(FAV_KEY, []),
    [],
  ) ?? EMPTY_FAVORITES
  const toggle = useCallback(
    async (routineId: number) => {
      const next = favorites.includes(routineId)
        ? favorites.filter((id) => id !== routineId)
        : [...favorites, routineId]
      await metaRepo.setJson(FAV_KEY, next)
    },
    [favorites],
  )
  return { favorites, isFavorite: (id: number) => favorites.includes(id), toggle }
}
