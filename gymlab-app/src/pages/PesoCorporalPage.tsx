// Página /peso-corporal (F132.5): héroe del último registro del rango, registro inline,
// evolución de 110 px y historial hairline. El rango 30/90/Todo filtra héroe, gráfica,
// stats e historial para no mostrar dos verdades distintas.
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Scale } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { RangePills } from '@/components/stats/RangePills'
import { WeightEvolution } from '@/components/body-log/WeightEvolution'
import { WeightHero } from '@/components/body-log/WeightHero'
import { WeightHistoryTimeline } from '@/components/body-log/WeightHistoryTimeline'
import { useBodyWeightMutations } from '@/hooks/useBodyWeight'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, parseWeightToKg } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'
import { inRange, toLocalDateStr, type StatsRange } from '@/domain/dates'
import { weightSummary } from '@/domain/bodyProgress'
import type { AppLanguage } from '@/domain/onboarding'

const MAX_BODY_WEIGHT_KG = 400

export const PesoCorporalPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { settings } = useSettings()
  // F120/PC-2: las entradas salen de la capa única (misma query, sin doble getAll);
  // el hook de peso queda solo para las mutaciones.
  const { bodyWeights: entries } = useAchievementsData()
  const { addToday, remove } = useBodyWeightMutations()
  const [range, setRange] = useState<StatsRange>(30)
  const [value, setValue] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const today = toLocalDateStr()

  const todayEntry = useMemo(() => entries.find((e) => e.localDate === today), [entries, today])
  const summary = useMemo(() => weightSummary(entries, range), [entries, range])
  const rangedEntries = useMemo(
    () => entries.filter((e) => inRange(e.localDate, range)),
    [entries, range],
  )

  // Convierte el input a kg (según unidad), lo limita al rango y hace upsert de hoy.
  const handleSave = async () => {
    // DecimalInput entrega número o vacío; el vacío cuenta como 0 y dispara el error ≤ 0.
    const kg = clamp(parseWeightToKg(value ?? 0, settings.units), 0, MAX_BODY_WEIGHT_KG)
    if (kg <= 0) {
      setError(t('peso.errorPositivo'))
      return
    }
    setError(null)
    await addToday(kg)
    setValue(undefined)
  }

  const handleRemove = useCallback((id: number) => void remove(id), [remove])

  const hasAny = entries.length > 0
  const emptyTitle = hasAny ? t('peso.sinDatosRangoTitulo') : t('peso.sinDatosTitulo')
  const emptyMessage = hasAny ? t('peso.sinDatosRango') : t('peso.sinDatos')

  return (
    <div>
      <AppHeader kicker={t('peso.kicker')} title={t('peso.titulo')} />
      <div className="px-4 pb-24">
        <BackLink to="/mas" />

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t('peso.rango')}
          </span>
          <RangePills value={range} onChange={setRange} />
        </div>

        <WeightHero
          latest={summary.latest}
          deltaKg={summary.deltaKg}
          range={range}
          units={settings.units}
          today={today}
          lang={lang}
        />

        <section className="border-t border-border/40 pt-4">
          <div className="flex items-baseline justify-between gap-2 pb-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t('peso.registrarHoy')}
            </h2>
          </div>
          <div className="flex gap-2">
            <DecimalInput
              value={value}
              onChange={(v) => {
                setValue(v)
                if (error) setError(null)
              }}
              min={0}
              placeholder={
                todayEntry
                  ? t('peso.hoyPlaceholder', {
                      peso: applyUnits(todayEntry.weightKg, settings.units).toFixed(1),
                    })
                  : t('peso.placeholder')
              }
              ariaLabel={t('peso.inputAria', { unidad: formatUnits(settings.units) })}
              className={`h-11 min-w-0 flex-1 rounded-xl border bg-bg px-3 text-base font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:outline-none ${
                error ? 'border-danger focus:border-danger' : 'border-border focus:border-cta'
              }`}
              // DecimalInput no expone atributos ARIA de error: se reflejan en el input real.
              inputRef={(el) => {
                if (!el) return
                if (error) {
                  el.setAttribute('aria-invalid', 'true')
                  el.setAttribute('aria-describedby', 'peso-error')
                } else {
                  el.removeAttribute('aria-invalid')
                  el.removeAttribute('aria-describedby')
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={value === undefined}
            >
              {todayEntry ? t('peso.actualizar') : t('peso.guardar')}
            </Button>
          </div>
          {error && (
            <p id="peso-error" role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </section>

        <div className="mt-4">
          {summary.count > 0 ? (
            <>
              <WeightEvolution
                entries={rangedEntries}
                summary={summary}
                units={settings.units}
                lang={lang}
              />
              <div className="mt-4">
                <WeightHistoryTimeline
                  entries={rangedEntries}
                  units={settings.units}
                  onRemove={handleRemove}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Scale className="size-6" aria-hidden />}
              title={emptyTitle}
              message={emptyMessage}
              size="lg"
              className="mt-2"
            />
          )}
        </div>
      </div>
    </div>
  )
}
