// Página /peso-corporal: registro diario de peso (upsert por fecha local YYYY-MM-DD),
// gráfico de evolución e historial tipo timeline paginado (F93 #5) vía componente compartido.
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Scale } from 'lucide-react'
import { BodyLogLayout } from '@/components/body-log/BodyLogLayout'
import { WeightHistoryTimeline } from '@/components/body-log/WeightHistoryTimeline'
import { Button } from '@/components/ui/Button'
import { BodyWeightChart } from '@/components/profile/BodyWeightChart'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, parseWeightToKg } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

const MAX_BODY_WEIGHT_KG = 400

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
  const handleRemove = useCallback((id: number) => void remove(id), [remove])

  return (
    <BodyLogLayout
      title={t('peso.titulo')}
      subtitle={t('peso.subtitulo')}
      backTo="/mas"
      hasData={entries.length > 0}
      emptyMessage={entries.length === 0 ? t('peso.sinDatos') : undefined}
    >
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
        <BodyWeightChart entries={entries} />
      )}

      {entries.length > 0 && (
        <WeightHistoryTimeline entries={entries} units={settings.units} onRemove={handleRemove} />
      )}
    </BodyLogLayout>
  )
}