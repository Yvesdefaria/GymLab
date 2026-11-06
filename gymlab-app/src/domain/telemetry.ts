// Gating de la telemetría pseudónima de uso (Sentry + PostHog).
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

// Claves que nunca deben salir: texto de elementos, valores de formularios y
// atributos capturados. El contrato de consentimiento promete "pantallas y
// acciones, nunca contenido".
const FORBIDDEN_TELEMETRY_KEYS = new Set([
  'text',
  'innerText',
  'value',
  'href',
  'name',
  '$el_text',
])

// Claves que pueden llevar una URL: se les quita query y fragmento, porque la
// búsqueda del catálogo escribe texto libre en `?q=`.
const URL_TELEMETRY_KEYS = new Set([
  'path',
  'url',
  '$current_url',
  '$pathname',
  '$referrer',
  'referrer',
])

export const stripTelemetryUrlQuery = (value: string): string => {
  const cut = value.search(/[?#]/)
  return cut === -1 ? value : value.slice(0, cut)
}

// Copia recursiva del payload sin contenido de usuario. No muta la entrada.
export const scrubTelemetryProperties = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(scrubTelemetryProperties)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      if (FORBIDDEN_TELEMETRY_KEYS.has(key) || key.startsWith('attr__')) continue
      out[key] =
        URL_TELEMETRY_KEYS.has(key) && typeof entry === 'string'
          ? stripTelemetryUrlQuery(entry)
          : scrubTelemetryProperties(entry)
    }
    return out
  }
  return value
}