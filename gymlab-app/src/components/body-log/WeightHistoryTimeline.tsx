// Historial de peso corporal en filas hairline (sin tarjeta), paginado de a 10.
// Conserva el borrado por fila y el botón «Ver más» del historial original.
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { usePagedList } from '@/hooks/usePagedList'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDate } from '@/lib/intl'
import { toLocalDateStr } from '@/domain/dates'
import type { BodyWeightEntry } from '@/domain/types'
import type { Units } from '@/domain/settings'
import type { AppLanguage } from '@/domain/onboarding'

const PAGE_SIZE = 10

const HistoryRow = memo(
  ({
    entry,
    units,
    today,
    onRemove,
  }: {
    entry: BodyWeightEntry
    units: Units
    today: string
    onRemove: (id: number) => void
  }) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language as AppLanguage
    return (
      <div className="flex min-h-[46px] items-center gap-3 border-t border-border/10 first:border-t-0">
        <span className="w-16 shrink-0 text-[11px] text-muted">
          {formatDate(entry.localDate + 'T12:00:00', lang, { day: 'numeric', month: 'short' })}
        </span>
        <span className="font-display text-[17px] font-light tabular-nums text-fg">
          {applyUnits(entry.weightKg, units).toFixed(1)}
          <span className="ml-1 text-[10px] font-normal text-muted">{formatUnits(units)}</span>
        </span>
        {entry.localDate === today ? (
          <span className="rounded-full border border-gold/35 bg-gold/8 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-gold-bright">
            {t('peso.hoy')}
          </span>
        ) : null}
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-danger"
          aria-label={t('peso.eliminarAria', { fecha: entry.localDate })}
        >
          <Trash2 className="size-4" aria-hidden />
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
  const today = toLocalDateStr()

  // Más reciente primero; la página ya filtró por rango.
  const history = useMemo(
    () => [...entries].sort((a, b) => b.localDate.localeCompare(a.localDate)),
    [entries],
  )
  const { visible, hasMore, showMore } = usePagedList(history, PAGE_SIZE)

  const countLabel =
    history.length === 1 ? t('peso.unRegistro') : t('peso.nRegistros', { count: history.length })

  return (
    <section className="border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t('peso.historial')}
        </h2>
        <span className="text-[10px] text-muted">{countLabel}</span>
      </div>
      <div>
        {visible.map((entry) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            units={units}
            today={today}
            onRemove={onRemove}
          />
        ))}
      </div>
      {hasMore && (
        <div className="pt-2">
          <Button size="sm" variant="ghost" className="w-full" onClick={showMore}>
            {t('peso.verMas')}
          </Button>
        </div>
      )}
    </section>
  )
}
