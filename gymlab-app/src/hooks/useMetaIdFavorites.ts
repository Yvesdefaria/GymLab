// Hook genérico de favoritos por ids: lee y alterna una lista de ids en la tabla meta.
import { useCallback } from 'react'
import { metaRepo } from '@/data/repositories'
import { useLiveList } from './useLiveList'

export const useMetaIdFavorites = (key: string) => {
  const favorites = useLiveList(() => metaRepo.getJson<number[]>(key, []), [key])
  const toggle = useCallback(
    async (id: number) => {
      const next = favorites.includes(id)
        ? favorites.filter((i) => i !== id)
        : [...favorites, id]
      await metaRepo.setJson(key, next)
    },
    [favorites, key],
  )
  return { favorites, isFavorite: (id: number) => favorites.includes(id), toggle }
}
