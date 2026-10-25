// Tabs por comida (F132.6): nombre + subtotal del día; el activo filtra la lista
// y define el destino del alta. Sin tarjetas ni pills de fondo.
import { useTranslation } from 'react-i18next'
import type { MealType } from '@/domain/types'
import { MEAL_TYPES, MEAL_TYPE_LABEL_KEY } from '@/components/nutrition/mealTypeMeta'

export const MealTabs = ({
  value,
  onChange,
  subtotals,
}: {
  value: MealType
  onChange: (mealType: MealType) => void
  subtotals: Record<MealType, number>
}) => {
  const { t } = useTranslation()
  return (
    <div role="group" aria-label={t('nutrition.mealTabsAria')} className="grid grid-cols-4 border-b border-border/40">
      {MEAL_TYPES.map((mealType) => {
        const active = value === mealType
        const kcal = subtotals[mealType]
        return (
          <button
            key={mealType}
            type="button"
            onClick={() => onChange(mealType)}
            aria-pressed={active}
            data-meal-tab={mealType}
            className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
              active ? 'text-gold-bright' : 'text-muted'
            }`}
          >
            <span>{t(MEAL_TYPE_LABEL_KEY[mealType])}</span>
            <span className={`text-[8.5px] tabular-nums ${active ? 'text-gold-bright/70' : 'text-muted/70'}`}>
              {kcal > 0 ? `${kcal} kcal` : '—'}
            </span>
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-cta" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
