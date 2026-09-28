// F101: sección Ayuda — repetir el tour guiado y activar/desactivar los tips de primera vez.
import { useTranslation } from 'react-i18next'
import { LifeBuoy, ChevronRight } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTourStore } from '@/store/tourStore'
import { SectionLabel, Toggle } from './SettingsUI'

export const HelpSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const startTour = useTourStore((s) => s.start)

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <LifeBuoy className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.ayuda')}</SectionLabel>
      </div>
      <button
        type="button"
        onClick={() => startTour('replay')}
        className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
      >
        <span>{t('ajustes.repetirTour')}</span>
        <ChevronRight className="size-4 text-muted" />
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
