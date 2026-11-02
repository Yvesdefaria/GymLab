// @vitest-environment jsdom
// Storage de Zustand persist con escritura diferida: agrupa el tecleo, no pierde el
// último valor al cerrar y cancela el timer en removeItem (F134/T2).
// El entorno trae un `localStorage` de Node sin métodos, así que se stubea uno real.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StorageValue } from 'zustand/middleware'
import { createDebouncedPersistStorage, PERSIST_DEBOUNCE_MS } from '@/lib/debouncedPersistStorage'

type Persisted = { n: number }

const value = (n: number): StorageValue<Persisted> => ({ state: { n }, version: 1 })

const memoryStorage = () => {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, val: string) => {
      map.set(key, val)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    clear: () => map.clear(),
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('createDebouncedPersistStorage', () => {
  it('no escribe hasta que pasa el debounce y solo guarda el último valor', () => {
    const storage = createDebouncedPersistStorage<Persisted>({ label: 'test' })

    storage.setItem('k', value(1))
    storage.setItem('k', value(2))

    expect(localStorage.getItem('k')).toBeNull()

    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS)

    expect(JSON.parse(localStorage.getItem('k') ?? 'null')).toEqual(value(2))
  })

  it('vuelca el pendiente al ocultar la app', () => {
    const storage = createDebouncedPersistStorage<Persisted>({ label: 'test' })
    storage.setItem('k', value(7))

    window.dispatchEvent(new Event('pagehide'))

    expect(JSON.parse(localStorage.getItem('k') ?? 'null')).toEqual(value(7))
  })

  it('removeItem vuelca el pendiente y borra la clave', () => {
    const storage = createDebouncedPersistStorage<Persisted>({ label: 'test' })
    storage.setItem('k', value(3))

    storage.removeItem('k')

    expect(localStorage.getItem('k')).toBeNull()
    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS)
    expect(localStorage.getItem('k')).toBeNull()
  })

  it('getItem devuelve null cuando la clave no existe', () => {
    const storage = createDebouncedPersistStorage<Persisted>({ label: 'test' })
    expect(storage.getItem('missing')).toBeNull()
  })

  it('un fallo de cuota no propaga el error', () => {
    const storage = createDebouncedPersistStorage<Persisted>({ label: 'test' })
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    storage.setItem('k', value(1))
    expect(() => vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS)).not.toThrow()
  })
})
