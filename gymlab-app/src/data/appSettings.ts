// Puente a los ajustes del sistema: con el permiso de notificaciones denegado la app
// ya no puede volver a pedirlo, así que el usuario tiene que rehabilitarlo en Ajustes.
// Nativo-only: en web/PWA no hay ajustes del sistema que abrir.
import { Capacitor, registerPlugin } from '@capacitor/core'
import { logger } from '@/lib/logger'

export interface GymLabSettingsPlugin {
  openNotificationSettings(): Promise<void>
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
