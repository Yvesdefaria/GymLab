// Ayuda (Nocturno Minimal): repetir el tour como fila con chevron y el toggle de tips.
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTourStore } from '@/store/tourStore'
import { SectionLabel, Toggle, settingsGroupClass, settingsRowClass } from './SettingsUI'

export const HelpSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const startTour = useTourStore((s) => s.start)

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.ayuda')}</SectionLabel>
      <button
        type="button"
        onClick={() => startTour('replay')}
        className={`${settingsRowClass} w-full text-left`}
      >
        <span>{t('ajustes.repetirTour')}</span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      </button>
      <Toggle
        checked={settings.showSectionTips}
        onChange={(v) => void update({ showSectionTips: v })}
        label={t('ajustes.consejosPrimeraVez')}
        description={t('ajustes.consejosPrimeraVezDesc')}
      />
    </section>
  )
}
