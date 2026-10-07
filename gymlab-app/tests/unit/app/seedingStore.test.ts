// F103/T3: estado del arranque no bloqueante. El arranque mínimo solo lee
// Ajustes y aplica idioma; el seed corre detrás y su guarda impide ejecutarlo
// dos veces (StrictMode monta los efectos dos veces en desarrollo).
import { describe, expect, it, vi } from 'vitest'
import { createSeedingStore, type SeedingDeps } from '@/app/seedingStore'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const makeDeps = (overrides: Partial<SeedingDeps> = {}) => {
  const calls: string[] = []
  const deps: SeedingDeps = {
    loadSettings: async () => {
      calls.push('settings')
      return { language: 'es' }
    },
    applyLanguage: async (lang) => {
      calls.push(`language:${lang}`)
    },
    isSeedCurrent: async () => {
      calls.push('seedVersion')
      return true
    },
    ensureProfile: async () => {
      calls.push('profile')
    },
    runReseed: async () => {
      calls.push('reseed')
    },
    logError: () => {},
    ...overrides,
  }
  return { deps, calls }
}

describe('seedingStore', () => {
  it('fast path: aplica el idioma guardado y llega a ready sin cargar el reseeder', async () => {
    const { deps, calls } = makeDeps({
      loadSettings: async () => {
        calls.push('settings')
        return { language: 'en' }
      },
    })
    const store = createSeedingStore(deps)

    expect(store.getState()).toEqual({ booted: false, status: 'idle', error: null })

    await store.prepare()

    expect(calls).toEqual(['settings', 'language:en', 'seedVersion', 'profile'])
    expect(store.getState()).toEqual({ booted: true, status: 'ready', error: null })
  })

  it('reseed path: expone seeding mientras corre y ready al terminar', async () => {
    const gate = deferred<void>()
    const { deps, calls } = makeDeps({
      isSeedCurrent: async () => {
        calls.push('seedVersion')
        return false
      },
      runReseed: () => {
        calls.push('reseed')
        return gate.promise
      },
    })
    const store = createSeedingStore(deps)

    const pending = store.prepare()
    await vi.waitFor(() => expect(store.getState().status).toBe('seeding'))
    gate.resolve()
    await pending

    expect(calls).toEqual(['settings', 'language:es', 'seedVersion', 'reseed'])
    expect(store.getState()).toEqual({ booted: true, status: 'ready', error: null })
  })

  it('error: queda recuperable con mensaje y retry vuelve a sembrar', async () => {
    let attempts = 0
    const logged: string[] = []
    const { deps } = makeDeps({
      isSeedCurrent: async () => false,
      runReseed: async () => {
        attempts += 1
        if (attempts === 1) throw new Error('catálogo caído')
      },
      logError: (message) => logged.push(message),
    })
    const store = createSeedingStore(deps)

    await store.prepare()
    expect(store.getState()).toEqual({ booted: true, status: 'error', error: 'catálogo caído' })
    expect(logged).toHaveLength(1)

    store.retry()
    await vi.waitFor(() => expect(store.getState().status).toBe('ready'))
    expect(attempts).toBe(2)
    expect(store.getState().error).toBeNull()
  })

  it('retry reintenta el arranque mínimo si este falló (idioma pendiente)', async () => {
    let settingsAttempts = 0
    const { deps, calls } = makeDeps({
      loadSettings: async () => {
        calls.push('settings')
        settingsAttempts += 1
        if (settingsAttempts === 1) throw new Error('ajustes caídos')
        return { language: 'en' }
      },
    })
    const store = createSeedingStore(deps)

    await store.prepare()
    expect(store.getState()).toEqual({ booted: true, status: 'error', error: 'ajustes caídos' })

    store.retry()
    await vi.waitFor(() => expect(store.getState().status).toBe('ready'))
    // El arranque mínimo se re-ejecuta: el idioma guardado se aplica en el retry.
    expect(settingsAttempts).toBe(2)
    expect(calls).toContain('language:en')
    expect(store.getState().error).toBeNull()
  })

  it('guarda una sola ejecución aunque prepare se llame dos veces (StrictMode)', async () => {
    let reseeds = 0
    const { deps } = makeDeps({
      isSeedCurrent: async () => false,
      runReseed: async () => {
        reseeds += 1
      },
    })
    const store = createSeedingStore(deps)

    await Promise.all([store.prepare(), store.prepare()])
    expect(reseeds).toBe(1)

    await store.prepare()
    expect(reseeds).toBe(1)
    expect(store.getState().status).toBe('ready')
  })
})
