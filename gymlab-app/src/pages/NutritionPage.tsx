// Página /nutricion (F132.6): héroe de kcal, macros, tabs por comida y lista
// hairline. El alta vive en un bottom sheet y el objetivo sale del TDEE + pasos;
// si falta el TDEE no se inventa una meta.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateDailyTotals, calcMealTypeTotals, MEAL_TYPE_ORDER } from '@/domain/nutrition'
import { toLocalDateStr } from '@/domain/dates'
import type { MealEntry, MealType } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'
import { useFoods } from '@/hooks/useFoods'
import { formatNumber } from '@/lib/intl'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { NutritionHero } from '@/components/nutrition/NutritionHero'
import { MealTabs } from '@/components/nutrition/MealTabs'
import { MealList } from '@/components/nutrition/MealList'
import { AddFoodSheet } from '@/components/nutrition/AddFoodSheet'
import { MEAL_TYPE_LABEL_KEY } from '@/components/nutrition/mealTypeMeta'

interface NutritionPageProps {
  meals: MealEntry[]
  onAddMeal: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => void
  onDeleteMeal: (id: number) => void
  tdee?: number
}

export const NutritionPage = ({ meals, onAddMeal, onDeleteMeal, tdee }: NutritionPageProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { foods, addCustomFood, resolveName } = useFoods()
  const [pickedMeal, setPickedMeal] = useState<MealType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const today = toLocalDateStr()
  const totals = calculateDailyTotals(meals)
  const byType = calcMealTypeTotals(meals)
  const firstWithData = MEAL_TYPE_ORDER.find((mealType) => (byType[mealType]?.meals.length ?? 0) > 0)
  const selectedMeal = pickedMeal ?? firstWithData ?? 'desayuno'
  const selectedMeals = byType[selectedMeal]?.meals ?? []
  const selectedKcal = byType[selectedMeal]?.kcal ?? 0
  const mealLabel = t(MEAL_TYPE_LABEL_KEY[selectedMeal])
  const subtotals = MEAL_TYPE_ORDER.reduce(
    (acc, mealType) => {
      acc[mealType] = byType[mealType]?.kcal ?? 0
      return acc
    },
    {} as Record<MealType, number>
  )

  return (
    <div>
      <AppHeader kicker={t('nutrition.kicker')} title={t('nutrition.title')} />
      <div className="px-4 pb-24">
        <BackLink to="/mas" />

        <NutritionHero totals={totals} goal={tdee} />

        <div className="mt-3">
          <MealTabs value={selectedMeal} onChange={setPickedMeal} subtotals={subtotals} />
        </div>

        <div className="flex items-baseline justify-between gap-2 pt-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{mealLabel}</h2>
          <p className="text-[9.5px] tabular-nums text-muted">
            {selectedKcal > 0
              ? `${formatNumber(selectedKcal, lang)} kcal · ${selectedMeals.length} ${
                  selectedMeals.length === 1 ? t('nutrition.foodOne') : t('nutrition.foodMany')
                }`
              : t('nutrition.noFoodsShort')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="mt-1 flex min-h-[44px] items-center text-[11px] font-semibold text-cta"
        >
          + {t('nutrition.addTo', { meal: mealLabel })}
        </button>

        <MealList meals={selectedMeals} resolveName={resolveName} onDelete={onDeleteMeal} />
      </div>

      {sheetOpen && (
        <AddFoodSheet
          mealType={selectedMeal}
          foods={foods}
          addCustomFood={addCustomFood}
          onAdd={onAddMeal}
          today={today}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
