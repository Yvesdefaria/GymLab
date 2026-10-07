// F103/T7: el service worker solo se registra en web. En la app nativa los
// assets son locales: el precache no aporta y el SW fue causa de pantallas negras.
import { describe, expect, it, vi } from 'vitest'
import { clearLegacyServiceWorker, registerServiceWorker } from '@/lib/serviceWorker'

describe('registerServiceWorker', () => {
  it('en web carga el módulo y registra con immediate', async () => {
    const registerSW = vi.fn()
    const loadRegister = vi.fn(async () => ({ registerSW }))

    const registered = await registerServiceWorker(() => false, loadRegister)

    expect(registered).toBe(true)
    expect(loadRegister).toHaveBeenCalledTimes(1)
    expect(registerSW).toHaveBeenCalledWith({ immediate: true })
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
