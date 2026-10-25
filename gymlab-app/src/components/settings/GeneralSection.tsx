// General (Nocturno Minimal): preferencias sueltas de inicio y deshacer.
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/hooks/useSettings'
import { SectionLabel, Toggle, NumberField, settingsGroupClass, settingsRowClass } from './SettingsUI'

export const GeneralSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.general')}</SectionLabel>
      <Toggle
        checked={settings.homeShowTodayFocus}
        onChange={(v) => void update({ homeShowTodayFocus: v })}
        label={t('ajustes.homeToday')}
        description={t('ajustes.homeTodayDesc')}
      />
      <Toggle
        checked={settings.showWeightHint}
        onChange={(v) => void update({ showWeightHint: v })}
        label={t('ajustes.pesoHint')}
        description={t('ajustes.pesoHintDesc')}
      />
      <Toggle
        checked={settings.showInstallPrompt}
        onChange={(v) => void update({ showInstallPrompt: v })}
        label={t('ajustes.instalarApp')}
      />
      <div className={settingsRowClass}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('ajustes.undoDelete')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('ajustes.undoDeleteDesc')}</p>
        </div>
        <NumberField
          value={settings.undoDurationSec}
          onChange={(v) => void update({ undoDurationSec: Math.max(0, v || 0) })}
          label={t('ajustes.undoDelete')}
          min={0}
          max={120}
          mode="integer"
          suffix="s"
        />
      </div>
    </section>
  )
}
