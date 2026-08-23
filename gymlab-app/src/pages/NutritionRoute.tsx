import { useMeals } from '@/hooks/useMeals'
import { NutritionPage } from './NutritionPage'

export const NutritionRoute = () => {
  const { meals, mealRepo } = useMeals()
  return (
    <NutritionPage
      meals={meals}
      onAddMeal={(meal) => mealRepo.add(meal)}
      onDeleteMeal={(id) => mealRepo.delete(id)}
    />
  )
}
