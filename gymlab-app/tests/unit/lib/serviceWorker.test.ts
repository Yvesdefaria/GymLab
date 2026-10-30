// F103/T7: el service worker solo se registra en web. En la app nativa los
// assets son locales: el precache no aporta y el SW fue causa de pantallas negras.
import { describe, expect, it, vi } from 'vitest'
import {
  UPDATE_CHECK_INTERVAL_MS,
  clearLegacyServiceWorker,
  registerServiceWorker,
  startUpdateChecks,
} from '@/lib/serviceWorker'

describe('registerServiceWorker', () => {
  it('en web carga el módulo y registra con immediate', async () => {
    const registerSW = vi.fn()
    const loadRegister = vi.fn(async () => ({ registerSW }))

    const registered = await registerServiceWorker(() => false, loadRegister)

    expect(registered).toBe(true)
    expect(loadRegister).toHaveBeenCalledTimes(1)
    expect(registerSW).toHaveBeenCalledWith(expect.objectContaining({ immediate: true }))
  })

  it('al registrarse arranca los chequeos de actualización con la registration', async () => {
    const registration = { update: vi.fn(async () => undefined) }
    const registerSW = vi.fn()
    const startChecks = vi.fn()

    await registerServiceWorker(
      () => false,
      async () => ({ registerSW }),
      clearLegacyServiceWorker,
      startChecks,
    )

    const options = registerSW.mock.calls[0]?.[0]
    expect(typeof options?.onRegisteredSW).toBe('function')

    options.onRegisteredSW('/sw.js', registration)

    expect(startChecks).toHaveBeenCalledWith(registration)
  })

  it('no arranca chequeos si el plugin no entrega la registration', async () => {
    const registerSW = vi.fn()
    const startChecks = vi.fn()

    await registerServiceWorker(
      () => false,
      async () => ({ registerSW }),
      clearLegacyServiceWorker,
      startChecks,
    )

    registerSW.mock.calls[0]?.[0].onRegisteredSW('/sw.js', undefined)

    expect(startChecks).not.toHaveBeenCalled()
  })


  it('en nativo no registra el SW y limpia las registraciones legacy', async () => {
    const loadRegister = vi.fn(async () => ({ registerSW: vi.fn() }))
    const clearLegacy = vi.fn(async () => 1)

    const registered = await registerServiceWorker(() => true, loadRegister, clearLegacy)

    expect(registered).toBe(false)
    expect(loadRegister).not.toHaveBeenCalled()
    expect(clearLegacy).toHaveBeenCalledTimes(1)
  })

  it('si el import del módulo de registro falla, resuelve false sin rechazar', async () => {
    const loadRegister = vi.fn(async () => {
      throw new Error('chunk pwa-register caído')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // R3-002 (F103/T7): registro best-effort — nunca una promesa sin manejar.
    await expect(registerServiceWorker(() => false, loadRegister)).resolves.toBe(false)

    warn.mockRestore()
  })

  it('en nativo sigue devolviendo false si la limpieza legacy falla', async () => {
    const registered = await registerServiceWorker(() => true, vi.fn(), async () => {
      throw new Error('boom')
    })

    expect(registered).toBe(false)
  })
})

describe('clearLegacyServiceWorker', () => {
  it('desregistra los SW legacy y borra todos los caches', async () => {
    const unregister = vi.fn(async () => true)
    const del = vi.fn(async () => true)
    const env = {
      navigator: { serviceWorker: { getRegistrations: async () => [{ unregister }, { unregister }] } },
      caches: { keys: async () => ['workbox-precache-v2', 'gymlab-images'], delete: del },
    }

    const cleaned = await clearLegacyServiceWorker(env)

    expect(cleaned).toBe(2)
    expect(unregister).toHaveBeenCalledTimes(2)
    expect(del).toHaveBeenCalledWith('workbox-precache-v2')
    expect(del).toHaveBeenCalledWith('gymlab-images')
  })

  it('es un no-op si el entorno no expone serviceWorker ni caches', async () => {
    await expect(clearLegacyServiceWorker({})).resolves.toBe(0)
  })

  it('un fallo puntual no frena el resto de la limpieza', async () => {
    const bad = vi.fn(async () => {
      throw new Error('nope')
    })
    const good = vi.fn(async () => true)
    const del = vi.fn(async () => true)
    const env = {
      navigator: { serviceWorker: { getRegistrations: async () => [{ unregister: bad }, { unregister: good }] } },
      caches: { keys: async () => ['workbox-precache-v2'], delete: del },
    }

    await expect(clearLegacyServiceWorker(env)).resolves.toBe(1)
    expect(good).toHaveBeenCalledTimes(1)
    expect(del).toHaveBeenCalledWith('workbox-precache-v2')
  })
})

describe('startUpdateChecks', () => {
  it('programa el intervalo y engancha visibilitychange', () => {
    const update = vi.fn(async () => undefined)
    const setIntervalFn = vi.fn((_fn: () => void, _ms: number) => 1)
    const addEventListenerFn = vi.fn()

    startUpdateChecks(
      { update },
      { setInterval: setIntervalFn, addEventListener: addEventListenerFn, isHidden: () => false },
    )

    expect(setIntervalFn).toHaveBeenCalledTimes(1)
    expect(setIntervalFn.mock.calls[0][1]).toBe(UPDATE_CHECK_INTERVAL_MS)
    expect(addEventListenerFn).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

    setIntervalFn.mock.calls[0][0]()
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('chequea al volver a visible y no mientras la pestaña está oculta', () => {
    const update = vi.fn(async () => undefined)
    let onVisibility: (() => void) | undefined
    let hidden = false

    startUpdateChecks(
      { update },
      {
        setInterval: () => 1,
        addEventListener: (_type, fn) => {
          onVisibility = fn
        },
        isHidden: () => hidden,
      },
    )

    onVisibility?.()
    expect(update).toHaveBeenCalledTimes(1)

    hidden = true
    onVisibility?.()
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('un update que rechaza no rompe el chequeo ni lanza en el tick', async () => {
    const update = vi.fn(async () => {
      throw new Error('offline')
    })
    let tick: (() => void) | undefined

    startUpdateChecks(
      { update },
      {
        setInterval: (fn) => {
          tick = fn
          return 1
        },
        addEventListener: () => {},
        isHidden: () => false,
      },
    )

    expect(() => tick?.()).not.toThrow()
    await Promise.resolve()
    expect(update).toHaveBeenCalledTimes(1)
  })
})
