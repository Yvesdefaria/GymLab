// Sesión (Nocturno Minimal): comportamiento del entreno en filas hairline.
// Los controles dependientes se anidan bajo su fila con la misma línea fina,
// sin caja ni fondo propio.
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/hooks/useSettings'
import type { PreloadWeightMode } from '@/domain/settings'
import type { TimeFormat } from '@/lib/duration'
import {
  SectionLabel,
  Toggle,
  NumberField,
  Select,
  settingsGroupClass,
  settingsRowClass,
} from './SettingsUI'

export const SessionSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.sesion')}</SectionLabel>

      <Toggle
        checked={settings.preloadLast}
        onChange={(v) => void update({ preloadLast: v })}
        label={t('ajustes.preloadLast')}
        description={t('ajustes.preloadLastDesc')}
      />
      {settings.preloadLast && (
        <div className="border-t border-border/30 pb-1 pt-1">
          <div className={settingsRowClass}>
            <p className="text-xs text-muted">{t('ajustes.seriesPrecargarHint')}</p>
            <NumberField
              value={settings.preloadSetCount}
              onChange={(v) => void update({ preloadSetCount: Math.max(0, v || 0) })}
              label={t('ajustes.seriesPrecargar')}
              min={0}
              max={20}
              mode="integer"
            />
          </div>
          <div className={settingsRowClass}>
            <p className="text-xs text-muted">{t('ajustes.ajustePeso')}</p>
            <div className="flex items-center justify-end gap-2">
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

      <Toggle
        checked={settings.autoStartRest}
        onChange={(v) => void update({ autoStartRest: v })}
        label={t('ajustes.restAuto')}
        description={t('ajustes.restAutoDesc')}
      />
      <Toggle
        checked={settings.restSound}
        onChange={(v) => void update({ restSound: v })}
        label={t('ajustes.restSound')}
      />
      <Toggle
        checked={settings.restVibrate}
        onChange={(v) => void update({ restVibrate: v })}
        label={t('ajustes.restVibrate')}
      />

      <div className={settingsRowClass}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('ajustes.timerFormat')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('ajustes.timerFormatDesc')}</p>
        </div>
        <Select
          value={settings.timerFormat}
          onChange={(v) => void update({ timerFormat: v as TimeFormat })}
          label={t('ajustes.timerFormat')}
          options={[
            { value: 'seconds', label: t('ajustes.timerFormatSeconds') },
            { value: 'mm:ss', label: t('ajustes.timerFormatMmSs') },
          ]}
        />
      </div>

      <Toggle
        checked={settings.keepScreenAwake}
        onChange={(v) => void update({ keepScreenAwake: v })}
        label={t('ajustes.keepAwake')}
        description={t('ajustes.keepAwakeDesc')}
      />
      <Toggle
        checked={settings.confirmLeaveSession}
        onChange={(v) => void update({ confirmLeaveSession: v })}
        label={t('ajustes.confirmLeave')}
      />
    </section>
  )
}
