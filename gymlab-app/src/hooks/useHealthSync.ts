// Estado del sync de pasos de salud para /pasos (F108): se suscribe al controlador global
// y refresca en modo auto al montar (NUNCA pide permiso; el pedido único vive en el host
// global de AppShell). `connect` es el reintento manual del banner (modo interactive).
import { useEffect, useSyncExternalStore } from 'react'
import {
  connectHealthSync,
  getHealthSyncStatus,
  refreshHealthSync,
  subscribeHealthSync,
} from '@/data/healthSyncController'

export const useHealthSync = () => {
  const status = useSyncExternalStore(subscribeHealthSync, getHealthSyncStatus)

  useEffect(() => {
    void refreshHealthSync()
  }, [])

  return { status, connect: connectHealthSync }
}
