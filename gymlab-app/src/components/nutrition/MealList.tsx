// Lista de la comida seleccionada (F132.6): filas hairline con nombre, gramos,
// macros, kcal y borrado. Una fila por MealEntry; si hay varios items se listan.
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MealEntry } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'
import { formatNumber } from '@/lib/intl'

const macroText = (grams: number, protein: number, carbs: number, fat: number, lang: AppLanguage) =>
  `${formatNumber(grams, lang)} g · P ${formatNumber(protein, lang, { maximumFractionDigits: 1 })} · C ${formatNumber(carbs, lang, { maximumFractionDigits: 1 })} · G ${formatNumber(fat, lang, { maximumFractionDigits: 1 })}`

export const MealList = ({
  meals,
  resolveName,
  onDelete,
}: {
  meals: MealEntry[]
  resolveName: (foodKey: string) => string
  onDelete: (id: number) => void
}) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  if (meals.length === 0) {
    return (
      <div className="border-t border-border/40 py-6 text-center">
        <p className="text-[13px] font-medium text-fg">{t('nutrition.emptyMealTitle')}</p>
        <p className="mt-1 text-xs text-muted">{t('nutrition.emptyMealText')}</p>
      </div>
    )
  }

  return (
    <div>
      {meals.map((meal) => {
        const kcal = meal.items.reduce((sum, item) => sum + item.kcal, 0)
        const names = meal.items.map((item) => resolveName(item.foodKey)).join(', ')
        return (
          <div key={meal.id} className="flex min-h-[52px] items-center gap-2 border-t border-border/40 py-2">
            <div className="min-w-0 flex-1">
              {meal.items.map((item, index) => (
                <div key={`${item.foodKey}-${index}`}>
                  <p className="truncate text-[13px] font-medium text-fg">{resolveName(item.foodKey)}</p>
                  <p className="text-[9.5px] tabular-nums text-muted">
                    {macroText(item.grams, item.proteinG, item.carbsG, item.fatG, lang)}
                  </p>
                </div>
              ))}
            </div>
            <p className="shrink-0 font-display text-base font-light tabular-nums text-fg">
              {formatNumber(kcal, lang)}
              <span className="ml-0.5 text-[8.5px] font-normal text-muted">kcal</span>
            </p>
            <button
              type="button"
              onClick={() => onDelete(meal.id)}
              aria-label={t('nutrition.deleteFood', { name: names })}
              className="flex size-11 shrink-0 items-center justify-center text-muted transition-colors hover:text-danger"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
