import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo } from '@/data/repositories'

const FAV_KEY = 'exerciseFavorites'
const RECENT_KEY = 'exerciseRecents'
const MAX_RECENTS = 20

export const useExerciseFavorites = () => {
  const favorites = useLiveQuery(
    () => metaRepo.getJson<number[]>(FAV_KEY, []),
    [],
  ) ?? []
  const toggle = async (exerciseId: number) => {
    const next = favorites.includes(exerciseId)
      ? favorites.filter((id) => id !== exerciseId)
      : [...favorites, exerciseId]
    await metaRepo.setJson(FAV_KEY, next)
  }
  return { favorites, isFavorite: (id: number) => favorites.includes(id), toggle }
}

export const useExerciseRecents = () => {
  const recents = useLiveQuery(
    () => metaRepo.getJson<number[]>(RECENT_KEY, []),
    [],
  ) ?? []
  const record = async (exerciseId: number) => {
    const next = [exerciseId, ...recents.filter((id) => id !== exerciseId)].slice(0, MAX_RECENTS)
    await metaRepo.setJson(RECENT_KEY, next)
  }
  return { recents, record }
}
