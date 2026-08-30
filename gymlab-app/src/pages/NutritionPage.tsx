// Nutrición: página de registro de comidas con resumen diario de kcal/macros.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateDailyTotals } from '@/domain/nutrition'
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
  const { resolveName } = useFoods()
  const [selectedMealType, setSelectedMealType] = useState<MealType>('almuerzo')

  const today = new Date().toISOString().split('T')[0]
  const todayMeals = meals.filter((m) => m.localDate === today)
  const totals = calculateDailyTotals(todayMeals)

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
          onAdd={onAddMeal}
          today={today}
          mealType={selectedMealType}
        />

        {/* Historial de comidas del día */}
        <DayMealsCard
          meals={todayMeals}
          resolveName={resolveName}
          onDelete={onDeleteMeal}
        />
      </div>
    </div>
  )
}