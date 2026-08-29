// Pestañas de tipo de comida (desayuno/almuerzo/cena/snack) para el registro diario.
import { useTranslation } from 'react-i18next'
import type { MealType } from '@/domain/types'
import { MEAL_TYPES, MEAL_TYPE_LABEL_KEY } from '@/components/nutrition/mealTypeMeta'

export const MealTypeTabs = ({
  value,
  onChange,
}: {
  value: MealType
  onChange: (mt: MealType) => void
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex gap-2">
      {MEAL_TYPES.map((mt) => (
        <button
          key={mt}
          type="button"
          onClick={() => onChange(mt)}
          aria-pressed={value === mt}
          className={`flex-1 min-h-[44px] rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            value === mt
              ? 'bg-accent text-accent-fg'
              : 'bg-bg-elevated/50 text-muted'
          }`}
        >
          {t(MEAL_TYPE_LABEL_KEY[mt])}
        </button>
      ))}
    </div>
  )
}