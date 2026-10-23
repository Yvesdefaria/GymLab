// Pasos de hoy por hora (24 posiciones) para /pasos. En nativo consulta el
// sistema de salud; en web devuelve disponible=false sin romper la página.
// Se refresca al cambiar el estado del sync, al volver a la pestaña y cada 60 s.
import { useEffect, useState } from 'react'
import { getHealthBridge } from '@/data/healthBridge'
import { toLocalDateStr } from '@/domain/dates'

type HourlyState = {
  hours: number[] | null
  available: boolean | null
}

const REFRESH_MS = 60_000

export const useTodayHourlySteps = (refreshKey?: string) => {
  const [state, setState] = useState<HourlyState>({ hours: null, available: null })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const bridge = await getHealthBridge()
        if (cancelled) return
        const available = await bridge.isAvailable()
        if (cancelled) return
        if (!available) {
          setState({ hours: [], available: false })
          return
        }
        const granted = await bridge.checkPermission()
        if (cancelled) return
        if (!granted) {
          setState({ hours: [], available: false })
          return
        }
        const hours = await bridge.fetchStepsByHour(toLocalDateStr())
        if (!cancelled) setState({ hours, available: true })
      } catch {
        if (!cancelled) setState({ hours: [], available: false })
      }
    }

    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, REFRESH_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshKey])

  return state
}
