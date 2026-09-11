import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { foodRepo } from '@/data/repositories'
import { FOOD_SEED } from '@/domain/nutrition'
import type { FoodItem } from '@/domain/types'

export type FoodWithDisplayName = FoodItem & { displayName: string }

// Combina seed estático + alimentos custom del usuario desde Dexie.
// Resuelve el nombre según idioma actual con t().
export const useFoods = () => {
  const { t, i18n } = useTranslation()
  const customFoods = useLiveQuery(() => foodRepo.getAll(), []) ?? []

  const resolveName = (foodKey: string): string => {
    const key = `nutrition.food.${foodKey}` as any
    const translated = t(key)
    return translated !== key ? translated : foodKey
  }

  // Identidad estable entre renders no relacionados: solo se recalcula al cambiar
  // los alimentos custom o el idioma (antes se re-mapeaba ~200 items por render).
  const foodsWithNames = useMemo(() => {
    const foods: FoodItem[] = [
      ...FOOD_SEED.map((f, i) => ({ ...f, id: i + 1 })),
      ...customFoods,
    ]
    return foods.map((f) => ({
      ...f,
      displayName: resolveName(f.foodKey),
    }))
  }, [customFoods, i18n.language])

  return {
    foods: foodsWithNames,
    resolveName,
    addCustomFood: foodRepo.add,
    deleteCustomFood: foodRepo.delete,
  }
}