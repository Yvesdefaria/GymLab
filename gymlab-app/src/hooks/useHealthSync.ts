// Estado del sync de pasos de salud para /pasos (F84c): en runtime nativo pide
// permiso just-in-time y sincroniza al montar y al volver al primer plano; en
// web degrada a unavailable (sin listener, sin errores). El mapeo de estado es
// pure para testearlo sin infra de render (convención del repo).
import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { syncStepsFromHealth, type SyncStatus } from '@/data/stepsSync'

export type HealthSyncStatus = 'idle' | 'syncing' | 'granted' | 'denied' | 'unavailable' | 'error'

export const mapSyncStatus = (status: SyncStatus): HealthSyncStatus =>
  status === 'synced' ? 'granted' : status

// ¿Corresponde re-sincronizar al volver al primer plano? Solo si YA tenemos permiso.
// Volver a PEDIRLO abre la activity de Health Connect y, al volver, dispara otro
// appStateChange; con el permiso denegado —o cuando el diálogo no llega a mostrarse—
// eso se realimenta en un loop infinito (la pantalla parpadeaba ~8 veces por segundo).
// Si el permiso está denegado, el reintento es explícito con el botón del banner.
export const shouldResyncOnForeground = (status: HealthSyncStatus): boolean =>
  status === 'granted'

export const useHealthSync = () => {
  const [status, setStatus] = useState<HealthSyncStatus>('idle')
  // Espejo del estado para el listener de appStateChange: se registra una sola vez,
  // así que no puede leer un `status` capturado viejo.
  const statusRef = useRef<HealthSyncStatus>('idle')
  // Impide solapar sincronizaciones: el aviso de primer plano puede llegar mientras
  // una sync (o el propio diálogo de permisos) sigue en vuelo.
  const inFlight = useRef(false)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const connect = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('unavailable')
      return
    }
    if (inFlight.current) return
    inFlight.current = true
    setStatus('syncing')
    try {
      const result = await syncStepsFromHealth()
      setStatus(mapSyncStatus(result.status))
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('unavailable')
      return
    }
    void connect()
    // Re-sincronizar al volver al primer plano, pero SIN volver a pedir permiso
    // (ver shouldResyncOnForeground): pedirlo es lo que generaba el loop.
    let active = true
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (active && isActive && shouldResyncOnForeground(statusRef.current)) void connect()
    })
    return () => {
      active = false
      void listener.then((l) => l.remove())
    }
  }, [connect])

  return { status, connect }
}
