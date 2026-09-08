// Estado del sync de pasos de salud para /pasos (F84c): en runtime nativo pide
// permiso just-in-time y sincroniza al montar y al volver al primer plano; en
// web degrada a unavailable (sin listener, sin errores). El mapeo de estado es
// pure para testearlo sin infra de render (convención del repo).
import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { syncStepsFromHealth, type SyncStatus } from '@/data/stepsSync'

export type HealthSyncStatus = 'idle' | 'syncing' | 'granted' | 'denied' | 'unavailable' | 'error'

export const mapSyncStatus = (status: SyncStatus): HealthSyncStatus =>
  status === 'synced' ? 'granted' : status

export const useHealthSync = () => {
  const [status, setStatus] = useState<HealthSyncStatus>('idle')

  const connect = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('unavailable')
      return
    }
    setStatus('syncing')
    const result = await syncStepsFromHealth()
    setStatus(mapSyncStatus(result.status))
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('unavailable')
      return
    }
    void connect()
    // Re-sincronizar al volver al primer plano para no quedarse atrás.
    let active = true
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (active && isActive) void connect()
    })
    return () => {
      active = false
      void listener.then((l) => l.remove())
    }
  }, [connect])

  return { status, connect }
}