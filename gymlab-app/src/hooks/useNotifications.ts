// Hook que gestiona notificaciones push: permisos, triggers y programación.
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveList } from './useLiveList'
import { useStreak } from './useStreak'
import { useSettings } from './useSettings'
import { workoutRepo, metaRepo } from '@/data/repositories'
import {
  checkTriggers,
  isNotificationSupported,
  getNotificationPermission,
  type PendingNotification,
} from '@/domain/notifications'
import { localDateOf } from '@/domain/dates'

const LAST_CHECKED_KEY = 'notificationLastChecked'

// Muestra una notificación nativa del navegador.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const showNativeNotification = (n: PendingNotification, t: any) => {
  if (!isNotificationSupported()) return
  try {
    new Notification(t(n.titleKey), {
      body: t(n.bodyKey, n.bodyParams),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: n.trigger,
    })
  } catch {
    /* ignore — notificaciones bloqueadas por el navegador */
  }
}

export const useNotifications = () => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const workouts = useLiveList(() => workoutRepo.getAll())
  const streak = useStreak()
  const permission = getNotificationPermission()
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Solicitar permiso de notificaciones
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNotificationSupported()) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  // Comprobar triggers y mostrar notificaciones pendientes
  const checkAndNotify = useCallback(async () => {
    if (!settings.notificationsEnabled) return

    const lastWorkoutStr =
      workouts.length > 0 ? localDateOf(workouts[0]) : null
    const lastWorkoutDate = lastWorkoutStr ? new Date(lastWorkoutStr + 'T12:00:00') : null
    const lastChecked = await metaRepo.getJson<string | null>(LAST_CHECKED_KEY, null)

    const pending = checkTriggers(
      settings,
      lastWorkoutDate,
      streak.currentStreak,
      lastChecked,
    )

    if (pending.length > 0) {
      for (const n of pending) {
        showNativeNotification(n, t)
      }
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      await metaRepo.setJson(LAST_CHECKED_KEY, today)
    }
  }, [settings, workouts, streak.currentStreak])

  // Comprobar al cambiar visibilidad (volver a la app)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkAndNotify()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    // Comprobar al montar
    void checkAndNotify()
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [checkAndNotify])

  // Timer periódico cada 60s para catchar la hora de recordatorio
  useEffect(() => {
    if (!settings.notificationsEnabled) {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current)
      checkTimerRef.current = null
      return
    }
    checkTimerRef.current = setInterval(() => {
      void checkAndNotify()
    }, 60_000)
    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current)
    }
  }, [settings.notificationsEnabled, checkAndNotify])

  return {
    permission,
    isSupported: isNotificationSupported(),
    requestPermission,
    checkAndNotify,
  }
}
