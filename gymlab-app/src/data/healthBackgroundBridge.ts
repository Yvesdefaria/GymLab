// Puente al permiso de lectura de salud en background (F84d-followup): Health Connect
// lo exige para que el worker nativo pueda leer pasos con la app cerrada. Solo Android.
import { Capacitor, registerPlugin } from '@capacitor/core'

export interface HealthBackgroundResult {
  granted: boolean
  available: boolean
}

interface GymLabHealthPlugin {
  requestBackgroundRead(): Promise<HealthBackgroundResult>
}

// Lazy: el registro del plugin no debe romper el import en tests que mockean
// `@capacitor/core` sin `registerPlugin`.
let plugin: GymLabHealthPlugin | undefined
const getPlugin = (): GymLabHealthPlugin => {
  plugin ??= registerPlugin<GymLabHealthPlugin>('GymLabHealth')
  return plugin
}

export const requestHealthBackgroundRead = async (): Promise<HealthBackgroundResult> => {
  if (Capacitor.getPlatform() !== 'android') return { granted: false, available: false }
  try {
    const result = await getPlugin().requestBackgroundRead()
    return { granted: Boolean(result?.granted), available: Boolean(result?.available) }
  } catch {
    // Fire-and-forget: sin este permiso el widget sigue funcionando con la app abierta.
    return { granted: false, available: false }
  }
}
