// Recordatorios: permisos (UI) y AGENDADO por el SISTEMA ÚNICO de notificaciones locales
// (data/localNotificationsBackend.ts).
//
// NATIVO-ONLY a propósito: antes usaba la Web Notifications API (`new Notification`), que
// NO existe en el WebView nativo — verificado en emulador con `typeof Notification ===
// 'undefined'` y `isSecureContext === true` — así que los tres recordatorios nunca
// disparaban en la app real. En web el backend es un no-op explícito.
//
// Hay DOS hooks por una razón: el agendado se monta UNA sola vez en el AppShell. Si viviera
// junto al de permisos (que solo lo consume la sección de Ajustes), los recordatorios se
// programarían únicamente al abrir esa pantalla y el diario no llegaría nunca con la app
// cerrada — que es justo para lo que sirve un recordatorio.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import { useLiveList } from './useLiveList'
import { useStreak } from './useStreak'
import { useSettings } from './useSettings'
import { workoutRepo, metaRepo } from '@/data/repositories'
import { getLocalNotificationsBackend } from '@/data/localNotificationsBackend'
import { planRestAlert, type AlertPermission } from '@/domain/restAlert'
import { NOTIFICATION_IDS, checkTriggers, type PendingNotification } from '@/domain/notifications'
import { localDateOf } from '@/domain/dates'

const LAST_CHECKED_KEY = 'notificationLastChecked'

// API para la UI de Ajustes: estado del permiso y solicitud explícita.
export const useNotifications = () => {
  const [permission, setPermission] = useState<AlertPermission>('prompt')

  const refreshPermission = useCallback(async (): Promise<AlertPermission> => {
    const backend = await getLocalNotificationsBackend()
    const next = await backend.checkPermission()
    setPermission(next)
    return next
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const backend = await getLocalNotificationsBackend()
    const next = await backend.requestPermission()
    setPermission(next)
    return next === 'granted'
  }, [])

  useEffect(() => {
    void refreshPermission()
  }, [refreshPermission])

  return {
    permission,
    // «Soportado» = app nativa: en web el sistema es un no-op explícito.
    isSupported: Capacitor.isNativePlatform(),
    requestPermission,
  }
}

// Agendado real. Montar UNA vez en el AppShell (ver nota de arriba).
export const useNotificationScheduling = () => {
  const { t } = useTranslation()
  const { settings, loaded } = useSettings()
  const workouts = useLiveList(() => workoutRepo.getAll())
  const streak = useStreak()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const enabled = loaded && settings.notificationsEnabled

  // Recordatorio de entrenamiento: se PROGRAMA en el SO con repetición diaria a la hora
  // configurada, así llega aunque la app esté cerrada.
  useEffect(() => {
    if (!loaded) return
    void (async () => {
      const backend = await getLocalNotificationsBackend()
      if (!settings.notificationsEnabled) {
        await backend.cancel(NOTIFICATION_IDS.training_reminder)
        return
      }
      const gate = planRestAlert({
        isNative: Capacitor.isNativePlatform(),
        permission: await backend.checkPermission(),
        exactAlarm: await backend.checkExactAlarm(),
      })
      if (!gate.shouldSchedule) return
      await backend.schedule({
        id: NOTIFICATION_IDS.training_reminder,
        title: t('notifications.trainingReminder.title'),
        body: t('notifications.trainingReminder.body'),
        on: { hour: settings.trainingReminderHour, minute: settings.trainingReminderMinute },
        exact: gate.exact,
      })
    })()
  }, [
    loaded,
    settings.notificationsEnabled,
    settings.trainingReminderHour,
    settings.trainingReminderMinute,
    t,
  ])

  // Racha e inactividad dependen de los DATOS, no de una hora fija: se evalúan al abrir la
  // app (y cada 60 s) y se entregan por el MISMO sistema, como máximo una vez por día.
  const checkAndNotify = useCallback(async () => {
    if (!enabled) return

    const lastWorkoutStr = workouts.length > 0 ? localDateOf(workouts[0]) : null
    const lastWorkoutDate = lastWorkoutStr ? new Date(lastWorkoutStr + 'T12:00:00') : null
    const lastChecked = await metaRepo.getJson<string | null>(LAST_CHECKED_KEY, null)

    const pending = checkTriggers(settings, lastWorkoutDate, streak.currentStreak, lastChecked)
    // El de entrenamiento ya queda programado en el SO: no se duplica acá.
    const dataDriven: PendingNotification[] = pending.filter(
      (n) => n.trigger !== 'training_reminder',
    )
    if (dataDriven.length === 0) return

    const backend = await getLocalNotificationsBackend()
    for (const n of dataDriven) {
      await backend.schedule({
        id: NOTIFICATION_IDS[n.trigger],
        title: t(n.titleKey),
        body: t(n.bodyKey, n.bodyParams),
        // Sin hora fija: el aviso es «ya pasó X», no «a las X».
        exact: false,
      })
    }

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    await metaRepo.setJson(LAST_CHECKED_KEY, today)
  }, [enabled, settings, workouts, streak.currentStreak, t])

  // Al volver a la app…
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void checkAndNotify()
    }
    document.addEventListener('visibilitychange', onVisibility)
    void checkAndNotify()
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [checkAndNotify])

  // …y cada 60 s, para no quedarse atrás sin abrir ninguna pantalla.
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    timerRef.current = setInterval(() => void checkAndNotify(), 60_000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [enabled, checkAndNotify])
}
