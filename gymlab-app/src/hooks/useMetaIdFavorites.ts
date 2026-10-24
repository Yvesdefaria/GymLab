// Hook genérico de favoritos por ids: lee y alterna una lista de ids en la tabla meta.
import { useCallback } from 'react'
import { metaRepo } from '@/data/repositories'
import { useLiveListState } from './useLiveList'

export const useMetaIdFavorites = (key: string) => {
  // `loaded` distingue "sin favoritos" de "todavía no cargó" (el catálogo lo necesita
  // para decidir el arranque en frío sin depender del orden de las live queries).
  const [favorites, loaded] = useLiveListState(() => metaRepo.getJson<number[]>(key, []), [key])
  const toggle = useCallback(
    async (id: number) => {
      const next = favorites.includes(id)
        ? favorites.filter((i) => i !== id)
        : [...favorites, id]
      await metaRepo.setJson(key, next)
    },
    [favorites, key],
  )
  return { favorites, loaded, isFavorite: (id: number) => favorites.includes(id), toggle }
}
