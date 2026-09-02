// Historial de comidas del día: tarjetas apiladas por tipo de comida con subtotal de kcal.
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { MealEntry } from '@/domain/types'
import { calcMealTypeTotals, MEAL_TYPE_ORDER } from '@/domain/nutrition'
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

  const byType = calcMealTypeTotals(meals)
  const order = MEAL_TYPE_ORDER.filter((type) => byType[type])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-fg">{t('nutrition.todayMeals')}</p>
      {order.map((type) => {
        const group = byType[type]!
        return (
          <div key={type} className="overflow-hidden rounded-2xl border border-border/30 bg-bg-elevated/30">
            {/* Header del tipo de comida con subtotal de kcal */}
            <div className="flex items-center justify-between border-b border-border/20 px-4 py-2.5">
              <p className="text-sm font-medium text-fg">{t(MEAL_TYPE_LABEL_KEY[type])}</p>
              <p className="text-xs text-muted">{group.kcal} kcal</p>
            </div>
            {/* Items de las comidas de ese tipo */}
            <div className="flex flex-col">
              {group.meals.map((meal) => (
                <div key={meal.id} className="flex items-start justify-between gap-2 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    {meal.items.map((item, i) => (
                      <p key={i} className="truncate text-xs text-muted">
                        {resolveName(item.foodKey)} ({item.grams}g) — {item.kcal} kcal
                      </p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(meal.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
