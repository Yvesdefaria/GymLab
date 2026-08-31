// Timeline del historial de peso corporal (F93 #5): fila tipo perfil (punto + fecha + peso +
// borrado) con paginación "Ver más" en lugar de scroll virtualizado. Autocontenido y reutilizable.
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDate } from '@/lib/intl'
import type { BodyWeightEntry } from '@/domain/types'
import type { Units } from '@/domain/settings'
import type { AppLanguage } from '@/domain/onboarding'

const PAGE_SIZE = 10

// Fila del historial: fecha, peso en la unidad configurada y botón de borrado.
const HistoryRow = memo(
  ({
    entry,
    units,
    onRemove,
  }: {
    entry: BodyWeightEntry
    units: Units
    onRemove: (id: number) => void
  }) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language as AppLanguage
    return (
      <div className="relative flex items-start gap-3 pl-5">
        <span
          className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-cta bg-bg-elevated"
          aria-hidden
        />
        <span className="flex-1 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-fg">
              {formatDate(entry.localDate + 'T12:00:00', lang, {
                day: 'numeric',
                month: 'short',
                weekday: 'short',
              })}
            </span>
            <span className="font-display font-semibold text-accent">
              {applyUnits(entry.weightKg, units).toFixed(1)} {formatUnits(units)}
            </span>
          </span>
        </span>
        <button
          onClick={() => onRemove(entry.id)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-danger/90 transition-colors hover:border-danger/50 hover:text-danger"
          aria-label={t('peso.eliminarAria', { fecha: entry.localDate })}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    )
  },
)
HistoryRow.displayName = 'HistoryRow'

export const WeightHistoryTimeline = ({
  entries,
  units,
  onRemove,
}: {
  entries: BodyWeightEntry[]
  units: Units
  onRemove: (id: number) => void
}) => {
  const { t } = useTranslation()
  // Página del historial paginado (empieza mostrando las 10 más recientes).
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Historial en orden descendente (más reciente primero), paginado como el del perfil.
  const history = useMemo(() => [...entries].reverse(), [entries])
  const visible = history.slice(0, visibleCount)

  return (
    <section className="panel-flush rounded-2xl">
      <h2 className="mb-2 px-4 pt-4 font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('peso.historial')}
      </h2>
      <div className="relative">
        <div className="absolute bottom-3 left-[5px] top-3 w-px bg-border" aria-hidden />
        <div className="px-4">
          {visible.map((entry) => (
            <div key={entry.id} className="pb-3">
              <HistoryRow entry={entry} units={units} onRemove={onRemove} />
            </div>
          ))}
        </div>
      </div>
      {visible.length < history.length && (
        <div className="px-4 pb-4 pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="w-full"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            {t('peso.verMas')}
          </Button>
        </div>
      )}
    </section>
  )
}