// Gating de la telemetría anónima de uso (Sentry + PostHog).
// La telemetría solo se activa si la build es de producción, hay claves configuradas
// y el usuario consintió el envío (toggle de Ajustes). Cualquier otra combinación = no-op.
export interface TelemetryKeys {
  posthogKey?: string
  sentryDsn?: string
}

export type TelemetryState = 'on' | 'off-debug' | 'off-not-configured' | 'off-no-consent'

export interface TelemetryGate {
  prod: boolean
  keys: TelemetryKeys
  consent: boolean
}

export const shouldEnableTelemetry = ({ prod, keys, consent }: TelemetryGate): boolean =>
  prod && consent && Boolean(keys.posthogKey && keys.sentryDsn)

export const describeTelemetryState = ({ prod, keys, consent }: TelemetryGate): TelemetryState => {
  if (!prod) return 'off-debug'
  if (!keys.posthogKey || !keys.sentryDsn) return 'off-not-configured'
  if (!consent) return 'off-no-consent'
  return 'on'
}