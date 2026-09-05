// Telemetría anónima de uso (Sentry + PostHog). El gating vive en domain/telemetry:
// sin build de producción + claves + consentimiento, estas funciones son no-op y no
// cargan ningún SDK (imports dinámicos solo dentro del guard, para no romper el tree-shake).
import { describeTelemetryState, type TelemetryKeys } from '@/domain/telemetry'
import type { BeforeSendFn, PostHog } from 'posthog-js'

export const TELEMETRY_KEYS: TelemetryKeys = {
  posthogKey: (import.meta.env.VITE_POSTHOG_PROJECT_KEY as string | undefined) || undefined,
  sentryDsn: (import.meta.env.VITE_SENTRY_DSN as string | undefined) || undefined,
}

let enabled = false
let posthogClient: PostHog | null = null
let sentryLoaded = false

const gate = (consent: boolean) =>
  describeTelemetryState({
    prod: import.meta.env.PROD,
    keys: TELEMETRY_KEYS,
    consent,
  }) === 'on'

// Recorre el evento en profundidad y elimina cualquier dato que pueda contener contenido
// del usuario: textos de elementos, valores de formularios, enlaces y atributos capturados
// por el autocapture. El heatmap conserva coordenadas y selectores, nunca el texto.
const scrubForbiddenKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(scrubForbiddenKeys)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value)) {
      if (
        key === 'text' ||
        key === 'innerText' ||
        key === 'value' ||
        key === 'href' ||
        key === 'name' ||
        key === '$el_text' ||
        key.startsWith('attr__')
      )
        continue
      out[key] = scrubForbiddenKeys(v)
    }
    return out
  }
  return value
}

const beforeSend: BeforeSendFn = (result) => {
  if (!result) return result
  result.properties = scrubForbiddenKeys(result.properties) as typeof result.properties
  return result
}

// Se invoca al arrancar la app y al volver a activar el consentimiento; idempotente (HMR-safe).
export const initTelemetry = async (consent = true): Promise<void> => {
  if (enabled) return
  if (!gate(consent)) return
  const mod = await import('posthog-js').catch(() => null)
  if (!mod || !TELEMETRY_KEYS.posthogKey) return
  const posthog: PostHog = mod.posthog ?? (mod as unknown as { default: PostHog }).default
  posthog.init(TELEMETRY_KEYS.posthogKey, {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,
    autocapture: {
      css_selector_ignorelist: ['.ph-no-autocapture', '[data-ph-no-autocapture]'],
    },
    before_send: beforeSend,
  })
  posthogClient = posthog
  if (TELEMETRY_KEYS.sentryDsn) {
    const sentry = await import('@sentry/react').catch(() => null)
    if (sentry?.init) {
      sentry.init({
        dsn: TELEMETRY_KEYS.sentryDsn,
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      })
      sentryLoaded = true
    }
  }
  enabled = true
}

// Registra un evento de uso. No-op salvo que la telemetría esté activa.
export const track = (event: string, props: Record<string, unknown> = {}): void => {
  if (!enabled || !posthogClient) return
  try {
    posthogClient.capture(event, props)
  } catch {
    // La telemetría nunca debe romper la app.
  }
}

// Envía un error a Sentry con contexto etiquetado. No-op salvo que esté activa.
export const reportError = async (error: unknown, context?: Record<string, unknown>): Promise<void> => {
  if (!enabled || !sentryLoaded) return
  try {
    const { captureException } = await import('@sentry/react').catch(() => null)
    if (!captureException) return
    captureException(error, { contexts: { telemetry: context ?? {} } })
  } catch {
    // no-op
  }
}

// Cambio del toggle de Ajustes: ON (re)activa el envío, OFF lo silencia al instante.
export const applyTelemetryConsent = async (consent: boolean): Promise<void> => {
  if (consent) {
    await initTelemetry(true)
    if (posthogClient) posthogClient.opt_in_capturing()
    return
  }
  enabled = false
  if (posthogClient) posthogClient.opt_out_capturing()
  if (sentryLoaded) {
    try {
      const { close } = await import('@sentry/react').catch(() => null)
      if (close) await close()
    } catch {
      // no-op
    }
    sentryLoaded = false
  }
}