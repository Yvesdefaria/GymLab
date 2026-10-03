// Estado del sync de pasos de salud para /pasos (F108): se suscribe al controlador global
// y refresca en modo auto al montar (NUNCA pide permiso; el pedido único vive en el host
// global de AppShell). `connect` es el reintento manual del banner (modo interactive).
// F108 (refresco en vivo): mientras /pasos está visible se re-consulta cada pocos segundos
// para que el contador no quede congelado con la app abierta.
import { useEffect, useSyncExternalStore } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  connectHealthSync,
  getHealthSyncStatus,
  refreshHealthSync,
  subscribeHealthSync,
  type HealthSyncStatus,
} from '@/data/healthSyncController'

// Ritmo del refresco rápido y del backoff, ajustables en un solo lugar (p. ej. 2 000 /
// 4 000 para probar más rápido sin tocar el resto del loop).
export const HEALTH_FAST_REFRESH_MS = 3_000
export const HEALTH_SLOW_RETRY_MS = 30_000

// Estados que el ritmo rápido no puede resolver: insistir cada 3 s solo gasta batería
// y plugin, así que se reintenta lento hasta que algo cambie.
const SLOW_STATUSES: readonly HealthSyncStatus[] = ['error', 'denied', 'unavailable']

const nextRefreshDelay = (status: HealthSyncStatus): number =>
  SLOW_STATUSES.includes(status) ? HEALTH_SLOW_RETRY_MS : HEALTH_FAST_REFRESH_MS

// Loop de refresco de la página (F108): setTimeout encadenado (nunca setInterval) para
// que el próximo tick se agende recién cuando la sync se asienta; en segundo plano se
// cancela y al volver se refresca de inmediato. Devuelve el cleanup del efecto.
const startHealthFastRefresh = (): (() => void) => {
  let stopped = false
  let timer: number | undefined

  const isVisible = () => document.visibilityState === 'visible'

  const schedule = (delay: number) => {
    if (stopped || !isVisible()) return
    timer = window.setTimeout(tick, delay)
  }

  const tick = () => {
    timer = undefined
    if (stopped || !isVisible()) return
    // Encadenado: un request lento nunca acumula ticks solapados.
    void refreshHealthSync().finally(() => schedule(nextRefreshDelay(getHealthSyncStatus())))
  }

  const onVisibilityChange = () => {
    if (stopped) return
    if (!isVisible()) {
      // Oculto = sin polling: se cancela el timer pendiente y se reanuda al volver.
      if (timer !== undefined) {
        window.clearTimeout(timer)
        timer = undefined
      }
      return
    }
    void refreshHealthSync()
    schedule(HEALTH_FAST_REFRESH_MS)
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  schedule(HEALTH_FAST_REFRESH_MS)

  return () => {
    stopped = true
    if (timer !== undefined) window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}

// En web no hay Health Connect: el contador se alimenta a mano, así que no arranca el loop.
export const startPageHealthFastRefresh = (): (() => void) => {
  if (!Capacitor.isNativePlatform()) return () => {}
  return startHealthFastRefresh()
}

export const useHealthSync = () => {
  const status = useSyncExternalStore(subscribeHealthSync, getHealthSyncStatus)

  useEffect(() => {
    void refreshHealthSync()
  }, [])

  // Refresco rápido solo con la página montada; el host global cubre arranque y foreground.
  useEffect(() => startPageHealthFastRefresh(), [])

  return { status, connect: connectHealthSync }
}
