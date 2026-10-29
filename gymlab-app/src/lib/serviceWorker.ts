// F103/T7: el service worker solo aporta en web (PWA). En la app nativa los
// assets ya son locales, así que el precache solo ocupa espacio y el SW sigue
// siendo la causa raíz de las pantallas negras por HTML viejo (ver vite.config).
import { Capacitor } from '@capacitor/core'
import { logger } from '@/lib/logger'

type ServiceWorkerRegistrationLike = { update: () => Promise<unknown> }

type RegisterSWOptions = {
  immediate?: boolean
  onRegisteredSW?: (swUrl: string, registration?: ServiceWorkerRegistrationLike) => void
}
type RegisterSW = (options?: RegisterSWOptions) => void
type LoadRegisterSW = () => Promise<{ registerSW: RegisterSW }>
type ClearLegacy = () => Promise<number>
type StartUpdateChecks = (registration: ServiceWorkerRegistrationLike, env?: UpdateCheckEnv) => void

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

/**
 * Un navegador solo vuelve a pedir `sw.js` en navegaciones, y como mucho una vez
 * cada 24 h. Una ventana PWA abierta durante días no navega: sin este sondeo
 * sigue sirviendo el precache viejo aunque haya una release nueva publicada.
 */
export const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000

export interface UpdateCheckEnv {
  setInterval?: (fn: () => void, ms: number) => unknown
  addEventListener?: (type: string, fn: () => void) => void
  isHidden?: () => boolean
}

const defaultUpdateCheckEnv = (): UpdateCheckEnv => ({
  setInterval:
    typeof globalThis.setInterval === 'function'
      ? (fn, ms) => globalThis.setInterval(fn, ms)
      : undefined,
  addEventListener:
    typeof globalThis.addEventListener === 'function'
      ? (type, fn) => globalThis.addEventListener(type, fn)
      : undefined,
  isHidden: () => (typeof document !== 'undefined' ? document.hidden : false),
})

// `registration.update()` sí dispara la instalación cuando `sw.js` cambió; el
// plugin recarga la página al activarse (`activated` + `isUpdate`), así que el
// usuario ve la versión nueva sin tocar nada.
export const startUpdateChecks = (
  registration: ServiceWorkerRegistrationLike,
  env: UpdateCheckEnv = defaultUpdateCheckEnv(),
): void => {
  const check = () => {
    // Best-effort: offline o una registración desmontada no deben cortar el
    // sondeo ni dejar una promesa rechazada sin manejar.
    void registration.update().catch(() => undefined)
  }

  try {
    env.setInterval?.(check, UPDATE_CHECK_INTERVAL_MS)
  } catch {
    // sin intervalo seguimos con el chequeo por visibilidad
  }

  try {
    env.addEventListener?.('visibilitychange', () => {
      if (!(env.isHidden?.() ?? false)) check()
    })
  } catch {
    // el sondeo por intervalo ya cubre este caso
  }
}

// Inyectable en tests para no resolver el módulo virtual fuera del build.
export const registerServiceWorker = async (
  isNative: () => boolean = () => Capacitor.isNativePlatform(),
  loadRegister: LoadRegisterSW = () => import('virtual:pwa-register'),
  clearLegacy: ClearLegacy = clearLegacyServiceWorker,
  startChecks: StartUpdateChecks = startUpdateChecks,
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
    registerSW({
      immediate: true,
      // El SW solo se actualiza si el navegador vuelve a pedir `sw.js`, y eso
      // pasa en navegaciones. Una ventana PWA abierta durante días no navega
      // nunca: sin este enganche seguiría sirviendo el precache viejo.
      onRegisteredSW: (_swUrl, registration) => {
        if (registration) startChecks(registration)
      },
    })
    return true
  } catch (error) {
    // R3-002 (F103/T7): el import del chunk `virtual:pwa-register` puede fallar
    // (build viejo/offline). El registro es best-effort: la web funciona sin SW
    // y el arranque no debe quedar con una promesa rechazada sin manejar.
    logger.warn('sw', 'no se pudo registrar el service worker', { error })
    return false
  }
}
