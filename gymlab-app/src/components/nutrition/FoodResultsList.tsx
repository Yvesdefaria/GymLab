// Lista de resultados del buscador de alimentos: hasta 15 opciones con kcal por base (100g o alternativa).
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
  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border border-border/30 bg-bg-elevated/30">
      {options.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">{t('nutrition.noResults')}</p>
      ) : (
        options.slice(0, 15).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onPick(f)}
            className="flex w-full items-center justify-between px-4 py-3 min-h-[44px] text-sm text-left hover:bg-bg-elevated/50"
          >
            <span className="text-fg">{f.displayName}</span>
            <span className="text-xs text-muted">
              {f.baseGrams && f.baseGrams !== 100
                ? `${f.kcal} kcal/${f.baseGrams}g`
                : `${f.kcal} kcal/100g`}
            </span>
          </button>
        ))
      )}
    </div>
  )
}