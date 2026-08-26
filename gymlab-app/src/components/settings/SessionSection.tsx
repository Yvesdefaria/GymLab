import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dumbbell } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import type { PreloadWeightMode } from '@/domain/settings'
import { SectionLabel, Toggle, NumberField, Select } from './SettingsUI'

export const SessionSection = () => {
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
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.sesion')}</SectionLabel>
      </div>

      <Toggle
        checked={settings.preloadLast}
        onChange={(v) => void update({ preloadLast: v })}
        label={t('ajustes.preloadLast')}
        description={t('ajustes.preloadLastDesc')}
      />
      {settings.preloadLast && (
        <div className="space-y-3 rounded-xl pt-3 border-t border-border/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">{t('ajustes.seriesPrecargarHint')}</p>
            <NumberField
              value={settings.preloadSetCount}
              onChange={(v) => void update({ preloadSetCount: Math.max(0, v || 0) })}
              label={t('ajustes.seriesPrecargar')}
              min={0}
              max={20}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">{t('ajustes.ajustePeso')}</p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select
                value={settings.preloadWeightMode}
                onChange={(v) => void update({ preloadWeightMode: v as PreloadWeightMode })}
                label={t('ajustes.ajustePeso')}
                options={[
                  { value: 'exact', label: t('ajustes.ajusteExacto') },
                  { value: 'plus_kg', label: t('ajustes.ajusteMasKg') },
                  { value: 'plus_pct', label: t('ajustes.ajusteMasPct') },
                ]}
              />
              {settings.preloadWeightMode !== 'exact' && (
                <NumberField
                  value={settings.preloadWeightValue}
                  onChange={(v) => void update({ preloadWeightValue: Math.max(0, v || 0) })}
                  label={t('ajustes.ajustePeso')}
                  min={0}
                  max={100}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Toggle checked={settings.autoStartRest} onChange={(v) => void update({ autoStartRest: v })} label={t('ajustes.restAuto')} description={t('ajustes.restAutoDesc')} />
      <Toggle checked={settings.restSound} onChange={(v) => void update({ restSound: v })} label={t('ajustes.restSound')} />
      <Toggle checked={settings.restVibrate} onChange={(v) => void update({ restVibrate: v })} label={t('ajustes.restVibrate')} />
      <Toggle checked={settings.keepScreenAwake} onChange={(v) => void update({ keepScreenAwake: v })} label={t('ajustes.keepAwake')} description={t('ajustes.keepAwakeDesc')} />
      <Toggle checked={settings.confirmLeaveSession} onChange={(v) => void update({ confirmLeaveSession: v })} label={t('ajustes.confirmLeave')} />
      <Toggle checked={settings.showRpe} onChange={(v) => void update({ showRpe: v })} label={t('ajustes.showRpe')} description={t('ajustes.showRpeDesc')} />
      <Toggle checked={settings.showRir} onChange={(v) => void update({ showRir: v })} label={t('ajustes.showRir')} description={t('ajustes.showRirDesc')} />
      <Toggle checked={settings.warmupSets} onChange={(v) => void update({ warmupSets: v })} label={t('ajustes.warmupSets')} description={t('ajustes.warmupSetsDesc')} />
      {settings.warmupSets && (
        <div className="rounded-xl pt-3 border-t border-border/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">{t('ajustes.warmupPercents')}</p>
            <input
              type="text"
              aria-label={t('ajustes.warmupPercentsAria')}
              aria-invalid={warmupError ? true : undefined}
              aria-describedby={warmupError ? 'warmup-error' : undefined}
              defaultValue={settings.warmupPercents.join(', ')}
              onBlur={(e) => setWarmupPercents(e.target.value)}
              className={`h-11 w-40 rounded-lg border bg-bg px-2 text-sm text-fg focus:outline-none ${
                warmupError ? 'border-danger focus:border-danger' : 'border-border focus:border-cta'
              }`}
            />
          </div>
          {warmupError && (
            <p id="warmup-error" role="alert" className="mt-2 text-xs text-danger">{warmupError}</p>
          )}
        </div>
      )}
      <Toggle checked={settings.showLoadSuggestion} onChange={(v) => void update({ showLoadSuggestion: v })} label={t('ajustes.sugerirCarga')} description={t('ajustes.sugerirCargaDesc')} />
      {settings.showLoadSuggestion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl pt-3 border-t border-border/30">
          <div className="min-w-0">
            <p className="text-xs text-muted">{t('ajustes.progresion')}</p>
            <p className="mt-0.5 text-[0.65rem] text-muted/70">{t('ajustes.progresionDesc')}</p>
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
