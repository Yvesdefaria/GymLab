import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { foodRepo } from '@/data/repositories'
import { FOOD_SEED } from '@/domain/nutrition'
import type { FoodItem } from '@/domain/types'

// Combina seed estático + alimentos custom del usuario desde Dexie.
// Resuelve el nombre según idioma actual con t().
export const useFoods = () => {
  const { t } = useTranslation()
  const customFoods = useLiveQuery(() => foodRepo.getAll(), []) ?? []

  const foods: FoodItem[] = [
    ...FOOD_SEED.map((f, i) => ({ ...f, id: i + 1 })),
    ...customFoods,
  ]

  const resolveName = (foodKey: string): string => {
    const key = `nutrition.food.${foodKey}` as any
    const translated = t(key)
    return translated !== key ? translated : foodKey
  }

  const foodsWithNames = foods.map((f) => ({
    ...f,
    displayName: resolveName(f.foodKey),
  }))

  return {
    foods: foodsWithNames,
    resolveName,
    addCustomFood: foodRepo.add,
    deleteCustomFood: foodRepo.delete,
  }
}
