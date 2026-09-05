// Sección de Ajustes: consentimiento de telemetría anónima (Sentry + PostHog).
// ON por defecto; OFF silencia el envío de inmediato sin recargar la página.
import { useTranslation } from 'react-i18next'
import { Activity } from 'lucide-react'
import { useTelemetryConsent } from '@/hooks/useTelemetryConsent'
import { SectionLabel, Toggle } from './SettingsUI'

export const TelemetrySection = () => {
  const { t } = useTranslation()
  const { consent, setConsent } = useTelemetryConsent()

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Activity className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.telemetryTitulo')}</SectionLabel>
      </div>
      <Toggle
        checked={consent}
        onChange={(v) => void setConsent(v)}
        label={t('ajustes.telemetryTitulo')}
        description={t('ajustes.telemetryDescripcion')}
      />
    </section>
  )
}