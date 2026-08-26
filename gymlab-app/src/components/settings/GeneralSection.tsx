import { useTranslation } from 'react-i18next'
import { Timer } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { SectionLabel, Toggle, NumberField } from './SettingsUI'

export const GeneralSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Timer className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.general')}</SectionLabel>
      </div>
      <Toggle checked={settings.homeShowTodayFocus} onChange={(v) => void update({ homeShowTodayFocus: v })} label={t('ajustes.homeToday')} description={t('ajustes.homeTodayDesc')} />
      <Toggle checked={settings.showWeightHint} onChange={(v) => void update({ showWeightHint: v })} label={t('ajustes.pesoHint')} description={t('ajustes.pesoHintDesc')} />
      <Toggle checked={settings.showInstallPrompt} onChange={(v) => void update({ showInstallPrompt: v })} label={t('ajustes.instalarApp')} />
      <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{t('ajustes.undoDelete')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('ajustes.undoDeleteDesc')}</p>
        </div>
        <NumberField
          value={settings.undoDurationSec}
          onChange={(v) => void update({ undoDurationSec: Math.max(0, v || 0) })}
          label={t('ajustes.undoDelete')}
          min={0}
          max={120}
          suffix="s"
        />
      </div>
    </section>
  )
}
