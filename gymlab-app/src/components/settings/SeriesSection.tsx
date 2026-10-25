// Series (Nocturno Minimal): registro por serie y sugerencia de carga.
// Se separa de «Sesión» porque son doce controles: dos grupos cortos se leen
// mejor que un grupo de doce filas seguidas.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/hooks/useSettings'
import { SectionLabel, Toggle, NumberField, settingsGroupClass, settingsRowClass } from './SettingsUI'

export const SeriesSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const [warmupError, setWarmupError] = useState<string | null>(null)

  const setWarmupPercents = (raw: string) => {
    const tokens = raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
    if (tokens.length === 0) {
      setWarmupError(t('ajustes.warmupErrorVacio'))
      return
    }
    const parsed = tokens.map((s) => Number(s))
    const invalid = tokens.filter((_, i) => !Number.isFinite(parsed[i]) || parsed[i] <= 0 || parsed[i] > 100)
    if (invalid.length > 0) {
      setWarmupError(t('ajustes.warmupError', { count: invalid.length, vals: invalid.join('», «') }))
      return
    }
    setWarmupError(null)
    void update({ warmupPercents: parsed })
  }

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.series')}</SectionLabel>

      <Toggle
        checked={settings.showRpe}
        onChange={(v) => void update({ showRpe: v })}
        label={t('ajustes.showRpe')}
        description={t('ajustes.showRpeDesc')}
        help="rpe"
      />
      <Toggle
        checked={settings.showRir}
        onChange={(v) => void update({ showRir: v })}
        label={t('ajustes.showRir')}
        description={t('ajustes.showRirDesc')}
        help="rir"
      />

      <Toggle
        checked={settings.warmupSets}
        onChange={(v) => void update({ warmupSets: v })}
        label={t('ajustes.warmupSets')}
        description={t('ajustes.warmupSetsDesc')}
      />
      {settings.warmupSets && (
        <div className="border-t border-border/30 pb-1 pt-1">
          <div className={settingsRowClass}>
            <p className="text-xs text-muted">{t('ajustes.warmupPercents')}</p>
            <input
              type="text"
              aria-label={t('ajustes.warmupPercentsAria')}
              aria-invalid={warmupError ? true : undefined}
              aria-describedby={warmupError ? 'warmup-error' : undefined}
              defaultValue={settings.warmupPercents.join(', ')}
              onBlur={(e) => setWarmupPercents(e.target.value)}
              className={`h-11 w-40 border-0 border-b bg-transparent px-1 text-right text-sm tabular-nums text-fg focus:outline-none ${
                warmupError ? 'border-danger focus:border-danger' : 'border-border/50 focus:border-cta'
              }`}
            />
          </div>
          {warmupError && (
            <p id="warmup-error" role="alert" className="pb-1 text-xs text-danger">
              {warmupError}
            </p>
          )}
        </div>
      )}

      <Toggle
        checked={settings.showLoadSuggestion}
        onChange={(v) => void update({ showLoadSuggestion: v })}
        label={t('ajustes.sugerirCarga')}
        description={t('ajustes.sugerirCargaDesc')}
      />
      {settings.showLoadSuggestion && (
        <div className={`${settingsRowClass} border-t border-border/30`}>
          <div className="min-w-0">
            <p className="text-xs text-muted">{t('ajustes.progresion')}</p>
            <p className="mt-0.5 text-[0.65rem] leading-snug text-muted/70">{t('ajustes.progresionDesc')}</p>
          </div>
          <NumberField
            value={settings.loadProgressionPct}
            onChange={(v) => void update({ loadProgressionPct: Math.max(0.5, Math.min(10, v || 2.5)) })}
            label={t('ajustes.progresion')}
            min={0.5}
            max={10}
            suffix="%"
          />
        </div>
      )}
    </section>
  )
}
