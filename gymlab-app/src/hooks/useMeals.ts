import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '@/data/repositories'

export const useMeals = () => {
  const meals = useLiveQuery(() => mealRepo.getAll(), []) ?? []
  return { meals, mealRepo }
}
