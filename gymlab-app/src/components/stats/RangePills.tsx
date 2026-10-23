// Selector de rango de fechas (30/90 días o todo) y helper de filtrado usado por varios gráficos de stats.
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { StatsRange } from '@/domain/dates'

// Opciones de rango con etiquetas traducidas; se resuelven dentro del componente.
const rangeLabels = (t: TFunction): { value: StatsRange; label: string }[] => [
  { value: 30, label: t('stats.range30') },
  { value: 90, label: t('stats.range90') },
  { value: 0, label: t('stats.rangoTodo') },
]

type Props = {
  value: StatsRange
  onChange: (range: StatsRange) => void
}

// Renderiza los botones de rango con `aria-pressed` para marcar el seleccionado.
export const RangePills = ({ value, onChange }: Props) => {
  const { t } = useTranslation()
  const options = rangeLabels(t)
  return (
    <div className="mb-2 flex gap-2" role="group" aria-label={t('stats.rangoAria')}>
      {options.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          aria-pressed={value === r.value}
          className={`min-h-[44px] rounded-full border px-3 text-[10px] font-semibold transition-colors ${
            value === r.value
              ? 'border-gold/50 bg-gold/10 text-gold-bright'
              : 'border-border/40 text-muted hover:border-gold/40'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
