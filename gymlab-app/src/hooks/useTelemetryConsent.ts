// Consentimiento de telemetría anónima (Ajustes). El cambio persiste en settings y
// se aplica al runtime (Sentry/PostHog) de forma inmediata, sin recargar la página.
import { useCallback } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { applyTelemetryConsent } from '@/lib/telemetry'

export const useTelemetryConsent = () => {
  const { settings, update } = useSettings()
  const consent = settings.telemetry

  const setConsent = useCallback(
    async (value: boolean) => {
      await update({ telemetry: value })
      void applyTelemetryConsent(value)
    },
    [update]
  )

  return { consent, setConsent }
}