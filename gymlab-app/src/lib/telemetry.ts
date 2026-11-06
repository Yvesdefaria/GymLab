// Telemetría pseudónima de uso (Sentry + PostHog). El gating vive en domain/telemetry:
// sin build de producción + claves + consentimiento, estas funciones son no-op y no
// cargan ningún SDK (imports dinámicos solo dentro del guard, para no romper el tree-shake).
import { describeTelemetryState, scrubTelemetryProperties, type TelemetryKeys } from '@/domain/telemetry'
import { syncNativeTelemetryConsent } from '@/data/appSettings'
import type { BeforeSendFn, PostHog } from 'posthog-js'

export const TELEMETRY_KEYS: TelemetryKeys = {
  posthogKey: (import.meta.env.VITE_POSTHOG_PROJECT_KEY as string | undefined) || undefined,
  sentryDsn: (import.meta.env.VITE_SENTRY_DSN as string | undefined) || undefined,
}

// API mínima de @sentry/react que usa la integración, sin acoplarse al tipado completo del namespace.
type SentryApi = {
  init?: (options: {
    dsn?: string
    tracesSampleRate?: number
    replaysSessionSampleRate?: number
    replaysOnErrorSampleRate?: number
  }) => unknown
  captureException?: (error: unknown, context?: { contexts?: Record<string, unknown> }) => void
  close?: () => Promise<boolean>
}

const loadSentry = async (): Promise<SentryApi | null> =>
  (await import('@sentry/react').catch(() => null)) as SentryApi | null

let enabled = false
// Hasta que el gate se resuelve (consentimiento leído + SDKs importados) los eventos
// se encolan: el primer `screen_view` ocurre antes de que termine `initTelemetry`, y
// descartarlo deja afuera justo la pantalla de entrada. Si el consentimiento resulta
// apagado, la cola se tira sin enviarse.
let gateSettled = false
const MAX_PENDING_EVENTS = 50
const pendingEvents: Array<{ event: string; props: Record<string, unknown> }> = []
let posthogClient: PostHog | null = null
let sentryLoaded = false

const gate = (consent: boolean) =>
  describeTelemetryState({
    prod: import.meta.env.PROD,
    keys: TELEMETRY_KEYS,
    consent,
  }) === 'on'

// El redactor vive en domain/telemetry (puro y testeable): descarta claves con
// contenido de usuario y recorta la query de las URLs antes de enviar.
const beforeSend: BeforeSendFn = (result) => {
  if (!result) return result
  result.properties = scrubTelemetryProperties(result.properties) as typeof result.properties
  return result
}

// Se invoca al arrancar la app y al volver a activar el consentimiento; idempotente (HMR-safe).
export const initTelemetry = async (consent = true): Promise<void> => {
  if (enabled) return
  if (!gate(consent)) {
    // Apagada por gate o por consentimiento: lo encolado se descarta sin enviarse.
    gateSettled = true
    pendingEvents.length = 0
    return
  }
  const mod = await import('posthog-js').catch(() => null)
  if (!mod || !TELEMETRY_KEYS.posthogKey) return
  const posthog: PostHog = mod.posthog ?? (mod as unknown as { default: PostHog }).default
  posthog.init(TELEMETRY_KEYS.posthogKey, {
    // PostHog EU Cloud: los eventos no salen de la UE (igual que Sentry, ingest.de).
    api_host: 'https://eu.i.posthog.com',
    capture_pageview: false,
    // PostHog solo recibe los eventos `track` propios: sin autocapture,
    // sin performance/web vitals y sin grabación. La configuración del proyecto
    // también está en modo privado, pero el código no depende de eso.
    disable_session_recording: true,
    autocapture: false,
    capture_performance: false,
    before_send: beforeSend,
  })
  posthogClient = posthog
  if (TELEMETRY_KEYS.sentryDsn) {
    const sentry = await loadSentry()
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
  gateSettled = true
  // La pantalla de entrada se registró antes de que existiera el cliente: sale ahora.
  for (const { event, props } of pendingEvents.splice(0)) {
    try {
      posthogClient.capture(event, props)
    } catch {
      // La telemetría nunca debe romper la app.
    }
  }
}

// Registra un evento de uso. Antes de que el gate se resuelva queda en cola (acotada);
// con la telemetría apagada se descarta.
export const track = (event: string, props: Record<string, unknown> = {}): void => {
  if (!enabled || !posthogClient) {
    if (!gateSettled && pendingEvents.length < MAX_PENDING_EVENTS) {
      pendingEvents.push({ event, props })
    }
    return
  }
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
    const sentry = await loadSentry()
    sentry?.captureException?.(error, { contexts: { telemetry: context ?? {} } })
  } catch {
    // no-op
  }
}

// Cambio del toggle de Ajustes: ON (re)activa el envío, OFF lo silencia al instante.
export const applyTelemetryConsent = async (consent: boolean): Promise<void> => {
  // F128: el contenedor nativo replica el mismo gate (producción + claves +
  // consentimiento); el flag persistido es la fuente de verdad para el init nativo.
  await syncNativeTelemetryConsent(gate(consent))
  if (consent) {
    await initTelemetry(true)
    if (posthogClient) posthogClient.opt_in_capturing()
    return
  }
  enabled = false
  gateSettled = true
  pendingEvents.length = 0
  if (posthogClient) posthogClient.opt_out_capturing()
  if (sentryLoaded) {
    try {
      const sentry = await loadSentry()
      await sentry?.close?.()
    } catch {
      // no-op
    }
    sentryLoaded = false
  }
}