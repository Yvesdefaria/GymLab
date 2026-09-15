// Lógica pura de notificaciones: triggers de entrenamiento, racha e inactividad.
import type { AppSettings } from './settings'
import type { I18nKey } from '@/i18n'

export type NotificationTrigger = 'training_reminder' | 'streak_expiring' | 'inactivity'

// Ids FIJOS por uso (32-bit, válidos en Android). Reutilizar el mismo id hace que
// reprogramar REEMPLACE en vez de acumular pendientes. El del descanso vive aparte
// (REST_NOTIFICATION_ID = 9601 en domain/restAlert.ts).
export const TRAINING_REMINDER_ID = 9602
export const STREAK_REMINDER_ID = 9603
export const INACTIVITY_REMINDER_ID = 9604

export const NOTIFICATION_IDS: Record<NotificationTrigger, number> = {
  training_reminder: TRAINING_REMINDER_ID,
  streak_expiring: STREAK_REMINDER_ID,
  inactivity: INACTIVITY_REMINDER_ID,
}

export interface PendingNotification {
  trigger: NotificationTrigger
  // Tipadas como I18nKey (no `string`): así `t()` las acepta sin el `t: any` + eslint-disable
  // que esquivaba el chequeo en la versión anterior de useNotifications.
  titleKey: I18nKey
  bodyKey: I18nKey
  bodyParams?: Record<string, string | number>
}

// Devuelve la hora de entrenamiento configurada como "HH:MM".
export const formatReminderTime = (hour: number, minute: number): string =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

// Compara la hora actual con la hora de recordatorio.
// Devuelve true si es la hora (mismo hora y minuto).
export const isReminderDue = (
  now: Date,
  reminderHour: number,
  reminderMinute: number,
): boolean =>
  now.getHours() === reminderHour && now.getMinutes() === reminderMinute

// Calcula los días sin entrenar a partir de la fecha del último workout (local).
export const daysSinceLastWorkout = (lastWorkoutDate: Date | null): number | null => {
  if (!lastWorkoutDate) return null
  const now = new Date()
  const diff = now.getTime() - lastWorkoutDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// Comprueba si la racha va a expirar (≤ 1 día sin entrenar y racha > 0).
export const isStreakExpiring = (daysSince: number | null, currentStreak: number): boolean =>
  currentStreak > 0 && daysSince !== null && daysSince >= 1

// Comprueba si hay inactividad (≥ 3 días sin entrenar).
export const isInactive = (daysSince: number | null): boolean =>
  daysSince !== null && daysSince >= 3

// Evalúa todos los triggers y devuelve las notificaciones pendientes.
export const checkTriggers = (
  settings: AppSettings,
  lastWorkoutDate: Date | null,
  currentStreak: number,
  lastCheckedDate: string | null,
): PendingNotification[] => {
  if (!settings.notificationsEnabled) return []

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Solo disparar una vez por día por trigger
  if (lastCheckedDate === today) return []

  const days = daysSinceLastWorkout(lastWorkoutDate)
  const notifications: PendingNotification[] = []

  // Recordatorio de entrenamiento diario (solo si es la hora configurada o si se abre la app después de la hora)
  if (isReminderDue(now, settings.trainingReminderHour, settings.trainingReminderMinute)) {
    notifications.push({
      trigger: 'training_reminder',
      titleKey: 'notifications.trainingReminder.title',
      bodyKey: 'notifications.trainingReminder.body',
    })
  }

  // Racha por expirar
  if (settings.streakReminder && isStreakExpiring(days, currentStreak)) {
    notifications.push({
      trigger: 'streak_expiring',
      titleKey: 'notifications.streakExpiring.title',
      bodyKey: 'notifications.streakExpiring.body',
      bodyParams: { days: days!, streak: currentStreak },
    })
  }

  // Inactividad
  if (settings.inactivityReminder && isInactive(days)) {
    notifications.push({
      trigger: 'inactivity',
      titleKey: 'notifications.inactivity.title',
      bodyKey: 'notifications.inactivity.body',
      bodyParams: { days: days! },
    })
  }

  return notifications
}

// NOTA: acá vivían `isNotificationSupported()` y `getNotificationPermission()`, basadas en
// la Web Notifications API (`typeof Notification`). Se eliminaron: esa API NO existe en el
// WebView nativo (verificado en emulador: `typeof Notification === 'undefined'`), así que
// los recordatorios nunca disparaban en la app real. El permiso ahora lo resuelve el
// backend único en `data/localNotificationsBackend.ts`.
