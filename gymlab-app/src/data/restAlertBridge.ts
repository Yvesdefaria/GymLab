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
import { getLocalNotificationsBackend, NULL_BACKEND } from './localNotificationsBackend'

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

// El backend real vive en localNotificationsBackend.ts (dueño ÚNICO del plugin): la
// alerta de descanso y los recordatorios comparten el mismo, así no hay dos sistemas
// ni dos lugares pidiendo permisos.
export const getRestAlertBridge = async (): Promise<RestAlertBridge> => {
  if (!Capacitor.isNativePlatform()) return createRestAlertBridge(NULL_BACKEND, false)
  return createRestAlertBridge(await getLocalNotificationsBackend(), true)
}
