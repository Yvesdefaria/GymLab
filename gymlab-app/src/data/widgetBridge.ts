// Puente web → widget nativo (F84d): empaqueta el snapshot de pasos y lo empuja al
// plugin Android. En web/PWA es no-op: la feature existe solo en la app nativa.
import { Capacitor, registerPlugin } from '@capacitor/core'
import { DEFAULT_STEPS_GOAL } from '@/domain/stepsTracker'

export interface WidgetSnapshot {
  steps: number
  goal: number
  /** Fecha local YYYY-MM-DD del dato; el widget muestra 0 si no es la de hoy. */
  date: string
}

export interface GymLabWidgetPlugin {
  update(options: WidgetSnapshot): Promise<void>
}

// Plugin local de Android; el nombre debe coincidir con @CapacitorPlugin(name = "GymLabWidget").
const GymLabWidget = registerPlugin<GymLabWidgetPlugin>('GymLabWidget')

export const buildWidgetSnapshot = (
  stepsToday: number | undefined | null,
  goal: number,
  today: string,
): WidgetSnapshot => ({
  steps: Math.max(0, Math.round(stepsToday ?? 0)),
  goal: goal > 0 ? Math.round(goal) : DEFAULT_STEPS_GOAL,
  date: today,
})

// Fire-and-forget: si el plugin falla, el widget se queda con el último snapshot.
export const pushWidgetSnapshot = async (snapshot: WidgetSnapshot): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await GymLabWidget.update(snapshot)
  } catch (error) {
    console.warn('[widget] push failed', error)
  }
}
