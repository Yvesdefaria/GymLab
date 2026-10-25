// Sistema · telemetría (Nocturno Minimal): una sola fila switch bajo el eyebrow.
// ON por defecto; OFF silencia el envío de inmediato sin recargar la página.
import { useTranslation } from 'react-i18next'
import { useTelemetryConsent } from '@/hooks/useTelemetryConsent'
import { SectionLabel, Toggle, settingsGroupClass } from './SettingsUI'

export const TelemetrySection = () => {
  const { t } = useTranslation()
  const { consent, setConsent } = useTelemetryConsent()

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.telemetryTitulo')}</SectionLabel>
      <Toggle
        checked={consent}
        onChange={(v) => void setConsent(v)}
        label={t('ajustes.telemetryActivar')}
        description={t('ajustes.telemetryDescripcion')}
      />
    </section>
  )
}
