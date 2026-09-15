// Sistema ÚNICO de notificaciones locales (nativo). Este es el ÚNICO módulo que importa
// @capacitor/local-notifications: lo consumen la alerta de descanso (F96) y los
// recordatorios de entrenamiento / racha / inactividad.
//
// POR QUÉ NATIVO-ONLY: el plugin trae una implementación web basada en la Web Notifications
// API, pero ESTA APP ES FULL MOBILE y esa API NO existe en el WebView nativo — verificado
// en emulador: `typeof Notification === 'undefined'` y `window.isSecureContext === true`.
// Por eso no se intenta notificar en web: el backend nulo es un no-op explícito, sin pedir
// permisos ni tocar el plugin. (Antes había un segundo sistema con `new Notification()`
// para los recordatorios: en la app real nunca disparaba.)
import { Capacitor } from '@capacitor/core'
import type { AlertPermission, ExactAlarmSetting } from '@/domain/restAlert'

export interface ScheduleInput {
  id: number
  title: string
  body: string
  // Momento puntual (deadline del descanso).
  at?: number
  // Repetición diaria a una hora concreta (recordatorio de entrenamiento): `on` es
  // cron-like en el plugin, así que se repite todos los días sin pasar `repeats`.
  on?: { hour: number; minute: number }
  // Exactitud solicitada; `false` cae a inexacto cuando Android no concede alarmas exactas.
  exact: boolean
}

export interface LocalNotificationsBackend {
  checkPermission(): Promise<AlertPermission>
  requestPermission(): Promise<AlertPermission>
  checkExactAlarm(): Promise<ExactAlarmSetting>
  schedule(input: ScheduleInput): Promise<void>
  cancel(id: number): Promise<void>
}

const createNativeBackend = async (): Promise<LocalNotificationsBackend> => {
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
    schedule: async ({ id, title, body, at, on, exact }) => {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            // `allowWhileIdle`: intenta entregar durante Doze (limitado por el SO).
            schedule: on
              ? { on: { hour: on.hour, minute: on.minute }, allowWhileIdle: true }
              : { at: new Date(at ?? Date.now()), allowWhileIdle: true },
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

// Backend nulo: web y fallback si el plugin no está disponible. No-op a propósito.
export const NULL_BACKEND: LocalNotificationsBackend = {
  checkPermission: async () => 'denied',
  requestPermission: async () => 'denied',
  checkExactAlarm: async () => 'unknown',
  schedule: async () => {},
  cancel: async () => {},
}

// Fábrica de producción: nativo con el plugin real, web como no-op seguro.
export const getLocalNotificationsBackend = async (): Promise<LocalNotificationsBackend> => {
  if (!Capacitor.isNativePlatform()) return NULL_BACKEND
  try {
    return await createNativeBackend()
  } catch {
    return NULL_BACKEND
  }
}
