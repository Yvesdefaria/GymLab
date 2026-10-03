// Controlador global del sync de pasos de salud (F108): estado único compartido por
// AppShell y /pasos, un solo pedido de permiso al arrancar y refresh sin diálogo.
// Sin React a propósito: los hooks se suscriben a este singleton de módulo.
import { Capacitor } from '@capacitor/core'
import { getHealthBridge, type HealthBridge } from './healthBridge'
import { syncStepsFromHealth, type SyncMode, type SyncStatus } from './stepsSync'
import { metaRepo } from './repositories'

export type HealthSyncStatus = 'idle' | 'syncing' | 'granted' | 'denied' | 'unavailable' | 'error'

export const HEALTH_PERMISSION_ASKED_KEY = 'healthPermissionAskedAt'

export const mapSyncStatus = (status: SyncStatus): HealthSyncStatus =>
  status === 'synced' ? 'granted' : status

// Decisión pura del arranque: con permiso → sync silenciosa; sin permiso y sin pedido
// previo → pedir UNA vez; sin permiso y ya pedido → nada (el reintento es manual).
export const startupAction = (
  available: boolean,
  granted: boolean,
  askedAt: string,
): 'sync' | 'ask' | 'none' => {
  if (!available) return 'none'
  if (granted) return 'sync'
  return askedAt ? 'none' : 'ask'
}

let status: HealthSyncStatus = 'idle'
// Una sola promesa en vuelo: los disparos simultáneos (página, arranque, foreground)
// comparten la misma sync en vez de solaparse.
let inFlight: Promise<void> | null = null
const listeners = new Set<(status: HealthSyncStatus) => void>()

const setStatus = (next: HealthSyncStatus): void => {
  if (next === status) return
  status = next
  for (const listener of listeners) listener(next)
}

export const getHealthSyncStatus = (): HealthSyncStatus => status

export const subscribeHealthSync = (
  listener: (status: HealthSyncStatus) => void,
): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const runSync = (mode: SyncMode, bridge?: HealthBridge, silent = false): Promise<void> => {
  if (inFlight) return inFlight
  // `silent` omite el `syncing` transitorio: los ticks rápidos de /pasos no deben
  // hacer parpadear el banner en cada refresco.
  if (!silent) setStatus('syncing')
  inFlight = (async () => {
    const active = bridge ?? (await getHealthBridge())
    return syncStepsFromHealth(active, mode)
  })()
    .then((result) => setStatus(mapSyncStatus(result.status)))
    .catch(() => setStatus('error'))
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

// Modo auto: la página y el primer plano refrescan SIEMPRE sin abrir el diálogo.
// Silencioso: la sync en curso no emite `syncing` (el estado final sí se publica).
export const refreshHealthSync = (): Promise<void> => runSync('auto', undefined, true)

// Tras un pedido concluido (concedido o denegado) se persiste el flag del arranque: un
// reintento manual del banner también cierra la vía automática del próximo inicio.
const persistAskedIfConcluded = async (): Promise<void> => {
  const result = getHealthSyncStatus()
  if (result === 'granted' || result === 'denied') {
    await metaRepo.setJson(HEALTH_PERMISSION_ASKED_KEY, new Date().toISOString())
  }
}

// Modo interactive: solo el reintento explícito del banner puede pedir permiso.
export const connectHealthSync = async (): Promise<void> => {
  await runSync('interactive')
  await persistAskedIfConcluded()
}

// Arranque «usable» (onboarding ya fuera): consulta sin diálogo innecesario y pide una
// única vez. El flag NO se persiste si el pedido falló, para reintentar el próximo inicio.
export const runStartupHealthSync = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    setStatus('unavailable')
    return
  }
  try {
    const bridge = await getHealthBridge()
    const available = await bridge.isAvailable()
    if (!available) {
      setStatus('unavailable')
      return
    }
    const granted = await bridge.checkPermission()
    const askedAt = await metaRepo.getJson<string>(HEALTH_PERMISSION_ASKED_KEY, '')
    const action = startupAction(available, granted, askedAt)
    if (action === 'sync') {
      await runSync('auto', bridge)
      return
    }
    if (action === 'none') {
      setStatus('denied')
      return
    }
    // Si hay un sync auto en vuelo, esperarlo: el pedido interactivo NO puede compartir
    // esa promesa (se saltearía el diálogo y persistiría el flag sin pedir nunca).
    if (inFlight) await inFlight
    // Re-chequeo obligatorio tras la espera (R3-001): un reintento manual del banner pudo
    // conceder el permiso o ya haber concluido el pedido en esa ventana; pedir de nuevo
    // abriría un segundo diálogo de consentimiento.
    if (await bridge.checkPermission()) {
      await runSync('auto', bridge)
      return
    }
    if (await metaRepo.getJson<string>(HEALTH_PERMISSION_ASKED_KEY, '')) {
      setStatus('denied')
      return
    }
    await runSync('interactive', bridge)
    await persistAskedIfConcluded()
  } catch (error) {
    // El host lo llama con `void`: un fallo del ecosistema no debe quedar como rechazo
    // sin manejar ni romper la UI (degradación con reintento manual del banner).
    console.error('[healthSyncController] fallo en el arranque del sync de salud', error)
    setStatus('error')
  }
}
