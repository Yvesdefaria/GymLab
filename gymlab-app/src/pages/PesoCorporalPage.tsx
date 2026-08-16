// Página /peso-corporal: registro diario de peso (upsert por fecha local YYYY-MM-DD),
// gráfico de evolución e historial virtualizado con borrado por entrada.
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Scale } from 'lucide-react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { BodyWeightChart } from '@/components/profile/BodyWeightChart'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, parseWeightToKg } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'
import { formatDate } from '@/lib/intl'
import type { BodyWeightEntry } from '@/domain/types'
import type { Units } from '@/domain/settings'
import type { AppLanguage } from '@/domain/onboarding'

const MAX_BODY_WEIGHT_KG = 400
const ROW_HEIGHT = 44

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

export const PesoCorporalPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { settings } = useSettings()
  const { entries, addToday, remove, today } = useBodyWeight()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Convierte el input a kg (según unidad), lo limita al rango y hace upsert de hoy.
  const handleSave = async () => {
    const kg = clamp(parseWeightToKg(Number(value) || 0, settings.units), 0, MAX_BODY_WEIGHT_KG)
    if (kg <= 0) {
      setError(t('peso.errorPositivo'))
      return
    }
    setError(null)
    await addToday(kg)
    setValue('')
  }

  const latest = entries[entries.length - 1]

  // Historial en orden descendente (más reciente primero).
  const history = useMemo(() => [...entries].reverse(), [entries])
  const handleRemove = useCallback((id: number) => void remove(id), [remove])

  const historyRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  // Mide la distancia de la lista al tope de la ventana para que el virtualizador
  // mantenga el scroll correcto aunque la página haga scroll en conjunto.
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

  // Virtualiza la lista del historial: solo renderiza las filas visibles en ventana.
  const virtualizer = useWindowVirtualizer({
    count: history.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
    scrollMargin,
    getItemKey: (i) => history[i].id,
  })

  return (
    <div>
      <AppHeader title={t('peso.titulo')} subtitle={t('peso.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />

        {latest && (
          <div className="flex items-center gap-4 panel rounded-2xl p-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-bg text-accent">
              <Scale className="size-6" aria-hidden />
            </span>
            <div>
              <p className="kicker">{t('peso.ultimoRegistro')}</p>
              <p className="stat-value text-2xl">
                {applyUnits(latest.weightKg, settings.units).toFixed(1)}{' '}
                {formatUnits(settings.units)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted">{t('peso.fecha')}</p>
              <p className="text-sm font-medium text-fg">
                {formatDate(latest.localDate + 'T12:00:00', lang, {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        )}

        <section className="panel-light rounded-2xl p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            {t('peso.registrarHoy')}
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
              placeholder={
                today
                  ? t('peso.hoyPlaceholder', {
                      peso: applyUnits(today.weightKg, settings.units).toFixed(1),
                    })
                  : t('peso.placeholder')
              }
              inputMode="decimal"
              aria-label={t('peso.inputAria', { unidad: formatUnits(settings.units) })}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'peso-error' : undefined}
              className={`h-11 min-w-0 flex-1 rounded-xl border bg-bg px-3 text-base font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:outline-none ${
                error ? 'border-danger focus:border-danger' : 'border-border focus:border-cta'
              }`}
            />
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={!value}
            >
              <Plus className="size-4" aria-hidden />
              {today ? t('peso.actualizar') : t('peso.guardar')}
            </Button>
          </div>
          {error && (
            <p id="peso-error" role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </section>

        {entries.length >= 1 && (
          <section className="panel-light rounded-2xl p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              {t('peso.evolucion')}
            </h2>
            <BodyWeightChart entries={entries} />
          </section>
        )}

        {entries.length > 0 && (
          <section className="panel-flush rounded-2xl">
            <h2 className="mb-2 px-4 pt-4 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              {t('peso.historial')}
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
              {t('peso.sinDatos')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
