// Alerta de descanso (F96, D3): sincroniza la notificación local nativa con el
// deadline del descanso y expone el aviso no bloqueante de permisos/exactitud.
// En web el puente es un no-op: no se promete alerta en segundo plano.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { getRestAlertBridge } from '@/data/restAlertBridge'
import {
  REST_NOTIFICATION_ID,
  shouldSuppressInAppAlert,
  type RestAlertWarning,
  type ScheduledRestAlert,
} from '@/domain/restAlert'

export interface RestAlertMessages {
  title: string
  body: string
}

export const useRestAlert = ({ title, body }: RestAlertMessages) => {
  const isResting = useActiveWorkoutStore((s) => s.isResting)
  const restEndsAt = useActiveWorkoutStore((s) => s.restEndsAt)
  const [warning, setWarning] = useState<RestAlertWarning | null>(null)
  // Última notificación programada: dedupe al terminar el descanso. No se limpia
  // al cancelar, para que el cierre natural pueda consultarla en el mismo commit.
  const scheduledRef = useRef<ScheduledRestAlert | null>(null)

  // Programa al empezar (y al cambiar el deadline: extender/reiniciar) y cancela
  // al terminar. Reprogramar reutiliza el id fijo: nunca hay dos pendientes.
  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      try {
        const bridge = await getRestAlertBridge()
        if (cancelled) return
        if (isResting && restEndsAt !== null) {
          scheduledRef.current = { id: REST_NOTIFICATION_ID, endsAt: restEndsAt }
          const result = await bridge.scheduleRestAlert({ endsAt: restEndsAt, title, body })
          if (cancelled) return
          if (!result.scheduled) scheduledRef.current = null
          if (result.warning) setWarning(result.warning)
        } else {
          await bridge.cancelRestAlert()
        }
      } catch {
        // Fail-safe: la alerta nunca rompe el descanso ni su cuenta atrás.
      }
    }
    void sync()
    return () => {
      cancelled = true
    }
  }, [isResting, restEndsAt, title, body])

  const dismissWarning = useCallback(() => setWarning(null), [])

  // Dedupe: si el SO ya avisó para este deadline (nativo), la app no repite la
  // alerta in-app. En web no hay programada y devuelve false.
  const suppressInAppAlert = useCallback(
    (nowMs: number = Date.now()) => shouldSuppressInAppAlert(scheduledRef.current, nowMs),
    []
  )

  return {
    warning,
    dismissWarning,
    suppressInAppAlert,
    isNative: Capacitor.isNativePlatform(),
  }
}
