// Fila de cantidad de alimento seleccionado: gramos por ración + botón Agregar.
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { DecimalInput } from '@/components/ui/DecimalInput'

export const FoodAmountRow = ({
  grams,
  onGramsChange,
  onAdd,
}: {
  grams: number | undefined
  onGramsChange: (g: number | undefined) => void
  onAdd: () => void
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3">
      <DecimalInput
        value={grams}
        onChange={onGramsChange}
        mode="integer"
        inputMode="numeric"
        placeholder={t('nutrition.grams')}
        className="w-24 min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-3 text-sm text-fg"
      />
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 min-h-[44px] rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
      >
        <Plus className="size-4" /> {t('nutrition.add')}
      </button>
    </div>
  )
}