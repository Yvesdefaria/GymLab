// Host global (F84d): empuja el snapshot de pasos al widget nativo cuando cambian
// los datos de hoy o la meta, y al volver a primer plano. Una sola vía de envío.
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { stepRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import { buildWidgetSnapshot, pushWidgetSnapshot } from '@/data/widgetBridge'

const PUSH_DEBOUNCE_MS = 1000

export const useWidgetSyncHost = (): void => {
  const entry = useLiveQuery(() => stepRepo.getByDate(toLocalDateStr()), [])
  const goal = useLiveQuery(() => stepRepo.getGoal(), [])

  // Debounce: un sync + un registro seguidos generan un solo push.
  useEffect(() => {
    if (goal === undefined) return
    const timer = window.setTimeout(() => {
      void pushWidgetSnapshot(buildWidgetSnapshot(entry?.steps, goal, toLocalDateStr()))
    }, PUSH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [entry?.steps, goal])

  // Al volver a la app: re-empuja (cubre el cambio de día con la app en background).
  useEffect(() => {
    if (goal === undefined) return
    if (Capacitor.getPlatform() !== 'android') return
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void pushWidgetSnapshot(buildWidgetSnapshot(entry?.steps, goal, toLocalDateStr()))
      }
    })
    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [entry?.steps, goal])
}
