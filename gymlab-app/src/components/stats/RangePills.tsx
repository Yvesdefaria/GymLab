// Selector de rango de fechas (30/90 días o todo) y helper de filtrado usado por varios gráficos de stats.
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

export type StatsRange = 30 | 90 | 0

// Opciones de rango con etiquetas traducidas; se resuelven dentro del componente.
const rangeLabels = (t: TFunction): { value: StatsRange; label: string }[] => [
  { value: 30, label: '30 d' },
  { value: 90, label: '90 d' },
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
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value === r.value
              ? 'border-cta bg-cta/20 text-accent-soft'
              : 'border-border text-muted hover:border-cta'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

// Devuelve true si la fecha local cae dentro de los últimos `range` días; `0` significa sin límite.
export const inRange = (localDate: string, range: StatsRange, now: number = Date.now()): boolean => {
  if (range === 0) return true
  return new Date(localDate + 'T12:00:00').getTime() >= now - range * 86_400_000
}
