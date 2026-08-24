import { useLiveQuery } from 'dexie-react-hooks'
import { foodRepo } from '@/data/repositories'
import { FOOD_SEED } from '@/domain/nutrition'
import type { FoodItem } from '@/domain/types'

// Combina seed estático + alimentos custom del usuario desde Dexie.
export const useFoods = () => {
  const customFoods = useLiveQuery(() => foodRepo.getAll(), []) ?? []

  // Merge: seed (ids 1..N) + custom (ids >= CUSTOM_ID_BASE)
  const foods: FoodItem[] = [
    ...FOOD_SEED.map((f, i) => ({ ...f, id: i + 1 })),
    ...customFoods,
  ]

  return { foods, addCustomFood: foodRepo.add, deleteCustomFood: foodRepo.delete }
}
