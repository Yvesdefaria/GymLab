// Resultados del buscador de alimentos (F132.6): filas hairline, sin tarjeta.
import { useTranslation } from 'react-i18next'

export type FoodOption = {
  id: number
  displayName: string
  kcal: number
  baseGrams?: number
}

export const FoodResultsList = ({
  options,
  onPick,
}: {
  options: FoodOption[]
  onPick: (option: FoodOption) => void
}) => {
  const { t } = useTranslation()
  if (options.length === 0) {
    return <p className="border-t border-border/40 py-3 text-center text-xs text-muted">{t('nutrition.noResults')}</p>
  }

  return (
    <div className="max-h-56 overflow-y-auto border-t border-border/40">
      {options.slice(0, 15).map((food) => (
        <button
          key={food.id}
          type="button"
          onClick={() => onPick(food)}
          className="flex min-h-[46px] w-full items-center justify-between gap-3 border-b border-border/20 px-1 text-left text-[12.5px] transition-colors hover:text-gold-bright"
        >
          <span className="truncate text-fg">{food.displayName}</span>
          <span className="shrink-0 text-[9.5px] tabular-nums text-muted">
            {food.baseGrams && food.baseGrams !== 100
              ? `${food.kcal} kcal/${food.baseGrams}g`
              : `${food.kcal} kcal/100g`}
          </span>
        </button>
      ))}
    </div>
  )
}
