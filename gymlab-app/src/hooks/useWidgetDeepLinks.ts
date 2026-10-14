// Deep link del widget (F84d): al abrir la app desde el widget, navega a /pasos.
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { extractWidgetRoute } from '@/data/widgetDeepLinks'

export const useWidgetDeepLinks = (): void => {
  const navigate = useNavigate()
  // La URL de lanzamiento queda guardada en la sesión nativa: si el efecto se re-ejecuta
  // por cada navegación, re-aplicarla devolvería al usuario a /pasos. El ref mantiene el
  // navigate fresco sin re-suscribir el efecto (que corre una sola vez).
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    const open = (url?: string | null) => {
      const route = extractWidgetRoute(url)
      if (route) navigateRef.current(route, { replace: true })
    }
    // Arranque en frío (la app se abrió desde el widget) + app ya corriendo (onNewIntent).
    void CapacitorApp.getLaunchUrl()
      .then((result) => open(result?.url))
      .catch(() => undefined)
    const listener = CapacitorApp.addListener('appUrlOpen', (event) => open(event.url))
      // lote 29 (R3-3): mismo criterio que el sync host — el rechazo del propio
      // addListener se traga desde la creación, no desde el cleanup.
      .catch(() => undefined)
    return () => {
      void listener.then((handle) => handle?.remove()).catch(() => undefined)
    }
  }, [])
}
