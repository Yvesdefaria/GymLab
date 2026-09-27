// Host global del sync de salud (montado una vez en AppShell): pide el permiso UNA vez
// cuando el onboarding ya no está visible y refresca al volver a primer plano sin abrir
// diálogos (modo auto). Separado de useHealthSync (página) para que /pasos solo muestre
// estado y la app tenga una única vía de arranque.
import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useOnboardingStatus } from './useOnboardingStatus'
import { refreshHealthSync, runStartupHealthSync } from '@/data/healthSyncController'

// ¿El onboarding ya quedó atrás? `done === undefined` = Dexie todavía cargando: esperar
// para no decidir con datos parciales.
export const shouldRunStartupSync = (done: boolean | undefined, workoutCount: number): boolean => {
  if (done === undefined) return false
  return done || workoutCount > 0
}

export const useHealthSyncHost = () => {
  const { done, workouts } = useOnboardingStatus()
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !shouldRunStartupSync(done, workouts.length)) return
    started.current = true
    void runStartupHealthSync()
  }, [done, workouts.length])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void refreshHealthSync()
    })
    return () => {
      void listener.then((l) => l.remove())
    }
  }, [])
}
