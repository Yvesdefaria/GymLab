// Historial de comidas del día: tarjetas por tipo con ítems (alimento, gramos, kcal) y borrado.
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { MealEntry } from '@/domain/types'
import { MEAL_TYPE_LABEL_KEY } from '@/components/nutrition/mealTypeMeta'

export const DayMealsCard = ({
  meals,
  resolveName,
  onDelete,
}: {
  meals: MealEntry[]
  resolveName: (foodKey: string) => string
  onDelete: (id: number) => void
}) => {
  const { t } = useTranslation()
  if (meals.length === 0) {
    return <p className="text-sm text-muted">{t('nutrition.noMeals')}</p>
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-fg">{t('nutrition.todayMeals')}</p>
      {meals.map((meal) => (
        <div key={meal.id} className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fg">{t(MEAL_TYPE_LABEL_KEY[meal.mealType])}</p>
            <button
              type="button"
              onClick={() => onDelete(meal.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-400"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          {meal.items.map((item, i) => (
            <p key={i} className="mt-1 text-xs text-muted">
              {resolveName(item.foodKey)} ({item.grams}g) — {item.kcal} kcal
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}