import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Scale } from 'lucide-react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { BodyWeightChart } from '@/components/profile/BodyWeightChart'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, parseWeightToKg } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'
import type { BodyWeightEntry } from '@/domain/types'
import type { Units } from '@/domain/settings'

const MAX_BODY_WEIGHT_KG = 400
const ROW_HEIGHT = 44

const HistoryRow = memo(
  ({
    entry,
    units,
    onRemove,
  }: {
    entry: BodyWeightEntry
    units: Units
    onRemove: (id: number) => void
  }) => (
    <div className="relative flex items-start gap-3 pl-5">
      <span
        className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-cta bg-bg-elevated"
        aria-hidden
      />
      <span className="flex-1 rounded-xl border border-border/50 bg-bg/40 px-3 py-2">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-fg">
            {new Date(entry.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
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
        aria-label={`Eliminar registro del ${entry.localDate}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  ),
)
HistoryRow.displayName = 'HistoryRow'

export const PesoCorporalPage = () => {
  const { settings } = useSettings()
  const { entries, addToday, remove, today } = useBodyWeight()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const kg = clamp(parseWeightToKg(Number(value) || 0, settings.units), 0, MAX_BODY_WEIGHT_KG)
    if (kg <= 0) {
      setError('Introduce un peso mayor que 0.')
      return
    }
    setError(null)
    await addToday(kg)
    setValue('')
  }

  const latest = entries[entries.length - 1]

  const history = useMemo(() => [...entries].reverse(), [entries])
  const handleRemove = useCallback((id: number) => void remove(id), [remove])

  const historyRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      if (historyRef.current) {
        setScrollMargin(historyRef.current.getBoundingClientRect().top + window.scrollY)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [entries.length])

  const virtualizer = useWindowVirtualizer({
    count: history.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
    scrollMargin,
    getItemKey: (i) => history[i].id,
  })

  return (
    <div>
      <AppHeader title="Peso corporal" subtitle="Seguimiento de tu evolución" />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />

        {latest && (
          <div className="flex items-center gap-4 panel rounded-2xl p-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-bg text-accent">
              <Scale className="size-6" aria-hidden />
            </span>
            <div>
              <p className="kicker">Último registro</p>
              <p className="stat-value text-2xl">
                {applyUnits(latest.weightKg, settings.units).toFixed(1)}{' '}
                {formatUnits(settings.units)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted">Fecha</p>
              <p className="text-sm font-medium text-fg">
                {new Date(latest.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        )}

        <section className="panel rounded-2xl p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Registrar hoy
          </h2>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError(null)
              }}
              placeholder={today ? `Hoy: ${applyUnits(today.weightKg, settings.units).toFixed(1)}` : 'Peso'}
              inputMode="decimal"
              aria-label={`Peso corporal en ${formatUnits(settings.units)}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'peso-error' : undefined}
              className={`h-11 min-w-0 flex-1 rounded-xl border bg-bg px-3 text-base font-semibold text-fg placeholder:font-normal placeholder:text-muted/70 focus:outline-none ${
                error ? 'border-danger focus:border-danger' : 'border-border focus:border-cta'
              }`}
            />
            <button
              onClick={() => void handleSave()}
              disabled={!value}
              className="gold-gradient flex h-11 shrink-0 items-center gap-1 rounded-xl px-4 font-medium text-on-gold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
              {today ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
          {error && (
            <p id="peso-error" role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </section>

        {entries.length >= 1 && (
          <section className="panel rounded-2xl p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Evolución
            </h2>
            <BodyWeightChart entries={entries} />
          </section>
        )}

        {entries.length > 0 && (
          <section className="panel rounded-2xl p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Historial
            </h2>
            <div className="relative">
              <div className="absolute bottom-3 left-[5px] top-3 w-px bg-border" aria-hidden />
              <div ref={historyRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const entry = history[item.index]
                  if (!entry) return null
                  return (
                    <div
                      key={item.key}
                      style={{
                        height: ROW_HEIGHT,
                        transform: `translateY(${item.start - scrollMargin}px)`,
                      }}
                      className="absolute left-0 top-0 w-full"
                    >
                      <HistoryRow entry={entry} units={settings.units} onRemove={handleRemove} />
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">
              Registra tu peso a lo largo del tiempo para ver la evolución en gráfico.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
