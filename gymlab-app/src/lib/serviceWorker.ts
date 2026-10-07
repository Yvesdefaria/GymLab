// F103/T7: el service worker solo aporta en web (PWA). En la app nativa los
// assets ya son locales, así que el precache solo ocupa espacio y el SW sigue
// siendo la causa raíz de las pantallas negras por HTML viejo (ver vite.config).
import { Capacitor } from '@capacitor/core'
import { logger } from '@/lib/logger'

type RegisterSW = (options?: { immediate: boolean }) => void
type LoadRegisterSW = () => Promise<{ registerSW: RegisterSW }>
type ClearLegacy = () => Promise<number>

export interface LegacyCleanupEnv {
  navigator?: {
    serviceWorker?: {
      getRegistrations?: () => Promise<ReadonlyArray<{ unregister: () => Promise<boolean> }>>
    }
  }
  caches?: {
    keys: () => Promise<string[]>
    delete: (key: string) => Promise<boolean>
  }
}

// Builds previos a F103/T7 registraban el SW dentro del WebView nativo: al
// actualizar la app la registración vieja queda pegada y sirve assets viejos.
// Best-effort: un fallo puntual no debe frenar el resto de la limpieza.
export const clearLegacyServiceWorker = async (
  env: LegacyCleanupEnv = globalThis,
): Promise<number> => {
  let cleaned = 0
  const registrations = (await env.navigator?.serviceWorker?.getRegistrations?.()) ?? []
  for (const registration of registrations) {
    try {
      if (await registration.unregister()) cleaned += 1
    } catch {
      // sigue con el resto
    }
  }
  const keys = (await env.caches?.keys?.()) ?? []
  for (const key of keys) {
    try {
      await env.caches?.delete(key)
    } catch {
      // sigue con el resto
    }
  }
  return cleaned
}

// Inyectable en tests para no resolver el módulo virtual fuera del build.
export const registerServiceWorker = async (
  isNative: () => boolean = () => Capacitor.isNativePlatform(),
  loadRegister: LoadRegisterSW = () => import('virtual:pwa-register'),
  clearLegacy: ClearLegacy = clearLegacyServiceWorker,
): Promise<boolean> => {
  if (isNative()) {
    try {
      await clearLegacy()
    } catch {
      // best-effort: la limpieza no debe romper el arranque
    }
    return false
  }
  try {
    const { registerSW } = await loadRegister()
    registerSW({ immediate: true })
    return true
  } catch (error) {
    // R3-002 (F103/T7): el import del chunk `virtual:pwa-register` puede fallar
    // (build viejo/offline). El registro es best-effort: la web funciona sin SW
    // y el arranque no debe quedar con una promesa rechazada sin manejar.
    logger.warn('sw', 'no se pudo registrar el service worker', { error })
    return false
  }
}
