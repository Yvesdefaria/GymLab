// Puente a los ajustes del sistema: con el permiso de notificaciones denegado la app
// ya no puede volver a pedirlo, así que el usuario tiene que rehabilitarlo en Ajustes.
// Nativo-only: en web/PWA no hay ajustes del sistema que abrir.
import { Capacitor, registerPlugin } from '@capacitor/core'
import { logger } from '@/lib/logger'

export interface GymLabSettingsPlugin {
  openNotificationSettings(): Promise<void>
  // F128: persiste el gate de telemetría para el SDK nativo (SharedPreferences).
  setTelemetryConsent(options: { enabled: boolean }): Promise<void>
}

// Plugin local de Android; el nombre debe coincidir con @CapacitorPlugin(name = "GymLabSettings").
const GymLabSettings = registerPlugin<GymLabSettingsPlugin>('GymLabSettings')

// Solo Android por ahora: iOS requiere su proyecto Xcode y build en Mac (follow-up en PLAN).
export const canOpenSystemSettings = (): boolean => Capacitor.getPlatform() === 'android'

export const openNotificationSettings = async (): Promise<boolean> => {
  if (!canOpenSystemSettings()) return false
  try {
    await GymLabSettings.openNotificationSettings()
    return true
  } catch (error) {
    logger.warn('settings', 'no se pudieron abrir los ajustes del sistema', { error })
    return false
  }
}

// F128: el contenedor nativo no ve Dexie/IndexedDB; el JS deja el gate ya
// resuelto en SharedPreferences. Sin consentimiento el SDK nativo no inicializa.
export const syncNativeTelemetryConsent = async (enabled: boolean): Promise<void> => {
  if (!canOpenSystemSettings()) return
  try {
    await GymLabSettings.setTelemetryConsent({ enabled })
  } catch (error) {
    logger.warn('settings', 'no se pudo sincronizar el consentimiento nativo', { error })
  }
}
