// Nutrición: página de registro de comidas con resumen diario de kcal/macros.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateDailyTotals } from '@/domain/nutrition'
import { toLocalDateStr } from '@/domain/dates'
import type { MealEntry, MealType } from '@/domain/types'
import { useFoods } from '@/hooks/useFoods'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { DailySummaryCard } from '@/components/nutrition/DailySummaryCard'
import { DayMealsCard } from '@/components/nutrition/DayMealsCard'
import { FoodAdder } from '@/components/nutrition/FoodAdder'
import { MealTypeTabs } from '@/components/nutrition/MealTypeTabs'

interface NutritionPageProps {
  meals: MealEntry[]
  onAddMeal: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => void
  onDeleteMeal: (id: number) => void
  tdee?: number
}

export const NutritionPage = ({ meals, onAddMeal, onDeleteMeal, tdee = 2200 }: NutritionPageProps) => {
  const { t } = useTranslation()
  // Una sola lectura de alimentos para toda la página; FoodAdder la recibe por props.
  const { foods, addCustomFood, resolveName } = useFoods()
  const [selectedMealType, setSelectedMealType] = useState<MealType>('almuerzo')

  // Fecha local: misma convención que la lectura de comidas del día (useTodayMeals)
  // para que lo que se registra hoy se muestre hoy.
  const today = toLocalDateStr()
  const totals = calculateDailyTotals(meals)

  return (
    <div>
      <AppHeader title={t('nutrition.title')} />
      <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
        <BackLink to="/mas" />

        {/* Resumen diario */}
        <DailySummaryCard totals={totals} tdee={tdee} />

        {/* Tipo de comida + añadidor */}
        <MealTypeTabs value={selectedMealType} onChange={setSelectedMealType} />
        <FoodAdder
          foods={foods}
          addCustomFood={addCustomFood}
          onAdd={onAddMeal}
          today={today}
          mealType={selectedMealType}
        />

        {/* Historial de comidas del día */}
        <DayMealsCard
          meals={meals}
          resolveName={resolveName}
          onDelete={onDeleteMeal}
        />
      </div>
    </div>
  )
}