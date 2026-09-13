// Puente hacia las notificaciones locales (F96, D3): envuelve el plugin
// @capacitor/local-notifications detrás de un backend inyectable. La decisión
// (permisos/exactitud) es pura (domain/restAlert.ts); aquí solo se ejecuta el
// efecto. En web devuelve un backend nulo: el aviso en segundo plano no está
// prometido, la web se queda con el valor correcto al volver (ReconcileRest).
import { Capacitor } from '@capacitor/core'
import {
  REST_NOTIFICATION_ID,
  planRestAlert,
  type AlertPermission,
  type ExactAlarmSetting,
  type RestAlertWarning,
} from '@/domain/restAlert'

// Superficie mínima del plugin que consumimos; los tests la sustituyen.
export interface RestAlertBackend {
  checkPermission(): Promise<AlertPermission>
  requestPermission(): Promise<AlertPermission>
  checkExactAlarm(): Promise<ExactAlarmSetting>
  schedule(input: { id: number; title: string; body: string; at: number; exact: boolean }): Promise<void>
  cancel(id: number): Promise<void>
}

export interface RestAlertScheduleInput {
  endsAt: number
  title: string
  body: string
}

export interface RestAlertScheduleResult {
  scheduled: boolean
  warning: RestAlertWarning | null
}

export interface RestAlertBridge {
  scheduleRestAlert(input: RestAlertScheduleInput): Promise<RestAlertScheduleResult>
  cancelRestAlert(): Promise<void>
}

// Programar es fail-safe en cada paso: cualquier fallo devuelve "no programado"
// sin lanzar, para que el descanso y su cuenta atrás sigan intactos.
export const createRestAlertBridge = (backend: RestAlertBackend, isNative: boolean): RestAlertBridge => ({
  scheduleRestAlert: async ({ endsAt, title, body }) => {
    // Web: no-op explícito, sin tocar permisos ni plugin.
    if (!isNative) return { scheduled: false, warning: null }
    try {
      const current = await backend.checkPermission()
      // Solo se pide cuando el usuario aún no decidió; pedirlo tras "denied" no reabre el diálogo.
      const permission =
        current === 'prompt' || current === 'prompt-with-rationale'
          ? await backend.requestPermission()
          : current
      const exactAlarm = await backend.checkExactAlarm()
      const gate = planRestAlert({ isNative, permission, exactAlarm })
      if (!gate.shouldSchedule) return { scheduled: false, warning: gate.warning }
      await backend.schedule({
        id: REST_NOTIFICATION_ID,
        title,
        body,
        at: endsAt,
        exact: gate.exact,
      })
      return { scheduled: true, warning: gate.warning }
    } catch {
      return { scheduled: false, warning: null }
    }
  },
  cancelRestAlert: async () => {
    try {
      await backend.cancel(REST_NOTIFICATION_ID)
    } catch {
      // Best-effort: cancelar nunca debe romper la UI.
    }
  },
})

// Backend nativo real. Import perezoso: el plugin no entra en el bundle web.
const createNativeBackend = async (): Promise<RestAlertBackend> => {
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  return {
    checkPermission: async () => (await LocalNotifications.checkPermissions()).display,
    requestPermission: async () => (await LocalNotifications.requestPermissions()).display,
    checkExactAlarm: async () => {
      // Solo Android 12+ expone el ajuste; en iOS/Android antiguos no aplica.
      if (Capacitor.getPlatform() !== 'android') return 'unknown'
      try {
        const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting()
        return exact_alarm === 'granted' || exact_alarm === 'denied' ? exact_alarm : 'unknown'
      } catch {
        return 'unknown'
      }
    },
    schedule: async ({ id, title, body, at, exact }) => {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            // `allowWhileIdle`: intenta entregar durante Doze (limitado por el SO).
            schedule: { at: new Date(at), allowWhileIdle: true },
            // Inexacto explícito cuando no hay permiso de alarmas exactas: la UX
            // confirmada es aviso no bloqueante + fallback, no el redirect del plugin.
            isExactNotification: exact,
          },
        ],
      })
    },
    cancel: async (id) => {
      await LocalNotifications.cancel({ notifications: [{ id }] })
    },
  }
}

// Backend nulo para web y para el fallback si el plugin no está disponible.
const NULL_BACKEND: RestAlertBackend = {
  checkPermission: async () => 'denied',
  requestPermission: async () => 'denied',
  checkExactAlarm: async () => 'unknown',
  schedule: async () => {},
  cancel: async () => {},
}

// Fábrica de producción: nativo con el plugin real, web como no-op seguro.
export const getRestAlertBridge = async (): Promise<RestAlertBridge> => {
  if (!Capacitor.isNativePlatform()) return createRestAlertBridge(NULL_BACKEND, false)
  try {
    return createRestAlertBridge(await createNativeBackend(), true)
  } catch {
    return createRestAlertBridge(NULL_BACKEND, false)
  }
}
