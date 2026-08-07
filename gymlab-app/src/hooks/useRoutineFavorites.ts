import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo } from '@/data/repositories'

const FAV_KEY = 'routineFavorites'

export const useRoutineFavorites = () => {
  const favorites = useLiveQuery(
    () => metaRepo.getJson<number[]>(FAV_KEY, []),
    [],
  ) ?? []
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
