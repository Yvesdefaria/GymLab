// Único listener del botón back físico de Android de toda la app.
// Se monta una sola vez en el shell: los overlays y la sesión activa se suman a la
// pila de backHandlers, y si nadie consume el evento se conserva el comportamiento
// nativo (retroceder en el historial o salir de la app). F134/T1.
import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { runBackHandlers } from '@/lib/backHandlers'

export const useHardwareBack = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cancelled = false
    const subscription = App.addListener('backButton', ({ canGoBack }) => {
      if (cancelled) return
      // Un overlay abierto gana: cierra y se queda en la pantalla.
      if (runBackHandlers()) return
      if (canGoBack) {
        window.history.back()
        return
      }
      void App.exitApp()
    })
    return () => {
      cancelled = true
      void subscription.then((s) => s.remove())
    }
  }, [])
}
