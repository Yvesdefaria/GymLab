// @vitest-environment jsdom
// 84d.followups (c) (lote 27): los caminos fire-and-forget de los hosts del
// widget no deben escapar como unhandled rejections — fresh read del sync host y
// limpiezas de listener en ambos hosts (captura determinística, patrón lote 18).
// lote 29 (R3-1/R3-3): la lectura fresca se asertá consumida (2 llamadas) y el
// rechazo de la propia promesa de addListener queda cubierto en ambos hooks.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Dexie captura `indexedDB` del global al evaluar el módulo (patrón useWorkoutNoteLoad).
vi.hoisted(() => {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: {},
    configurable: true,
    writable: true,
  })
})

type ListenerHandle = { remove: () => Promise<void> }
type AddListenerImpl = (event: string, cb: unknown) => Promise<ListenerHandle>

// addListener NO va por vi.fn (lote 29 R3-3): el tracking de vitest absorbe los
// rechazos de las promesas que devuelve un spy (settledResults), así que el rechazo
// de `addListener` jamás se vería como unhandled y el caso quedaría inobservable.
// Con una función común + impl por ref, el rechazo real se emite y el test muerde.
const { getByDateSpy, getGoalSpy, getLaunchUrlSpy, getPlatformSpy, addListenerCalls, addListenerImplRef } =
  vi.hoisted(() => ({
    getByDateSpy: vi.fn(async (_date: string): Promise<{ steps?: number } | undefined> => undefined),
    getGoalSpy: vi.fn(async (): Promise<number> => 10_000),
    getLaunchUrlSpy: vi.fn(async () => undefined),
    getPlatformSpy: vi.fn(() => 'android'),
    addListenerCalls: [] as Array<{ event: string; cb: unknown }>,
    addListenerImplRef: {
      current: (() => Promise.resolve({ remove: async () => undefined })) as AddListenerImpl,
    },
  }))

vi.mock('@/data/repositories', () => ({
  stepRepo: { getByDate: getByDateSpy, getGoal: getGoalSpy },
}))
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (event: string, cb: unknown) => {
      addListenerCalls.push({ event, cb })
      return addListenerImplRef.current(event, cb)
    },
    getLaunchUrl: getLaunchUrlSpy,
  },
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: getPlatformSpy },
  registerPlugin: () => ({ update: vi.fn(async () => undefined) }),
}))

import { useWidgetSyncHost } from '@/hooks/useWidgetSyncHost'
import { useWidgetDeepLinks } from '@/hooks/useWidgetDeepLinks'

// Colector determinístico de rechazos sin manejar.
const rejections: unknown[] = []
const onRejection = (reason: unknown) => {
  rejections.push(reason)
}

// Deja correr el arranque del querier de Dexie (setTimeout 0) y sus tickers.
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5))
  })
// Tick real para que Node emita `unhandledRejection` si la cadena rechazó sin catch.
const waitRejectionTick = () => new Promise((resolve) => setTimeout(resolve, 10))

beforeEach(() => {
  rejections.length = 0
  process.on('unhandledRejection', onRejection)
  getByDateSpy.mockReset()
  getByDateSpy.mockResolvedValue(undefined)
  getGoalSpy.mockReset()
  getGoalSpy.mockResolvedValue(10_000)
  addListenerCalls.length = 0
  addListenerImplRef.current = () => Promise.resolve({ remove: async () => undefined })
  getLaunchUrlSpy.mockReset()
  getPlatformSpy.mockReset()
  getPlatformSpy.mockReturnValue('android')
})

afterEach(() => {
  cleanup()
  process.off('unhandledRejection', onRejection)
})

describe('useWidgetSyncHost — caminos fire-and-forget (84d.followups c)', () => {
  it('un fresh read que rechaza no escapa como unhandled rejection', async () => {
    let onActive: ((state: { isActive: boolean }) => void) | undefined
    addListenerImplRef.current = (_event, cb) => {
      onActive = cb as (state: { isActive: boolean }) => void
      return Promise.resolve({ remove: async () => undefined })
    }
    getByDateSpy.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('db caída'))

    renderHook(() => useWidgetSyncHost())
    await settle()

    expect(onActive).toBeTypeOf('function')
    await act(async () => {
      onActive?.({ isActive: true })
    })
    await waitRejectionTick()

    expect(rejections).toEqual([])
    // lote 29 (R3-1): la lectura fresca ocurrió de verdad (la 2ª llamada consumió el
    // rechazo encolado); sin ella, el aserto de arriba pasaría en vacío.
    expect(getByDateSpy).toHaveBeenCalledTimes(2)
  })

  it('una limpieza de listener que rechaza no escapa como unhandled rejection', async () => {
    addListenerImplRef.current = () =>
      Promise.resolve({
        remove: async () => {
          throw new Error('remove caído')
        },
      })

    const { unmount } = renderHook(() => useWidgetSyncHost())
    await settle()
    expect(addListenerCalls).toEqual([{ event: 'appStateChange', cb: expect.any(Function) }])

    unmount()
    await waitRejectionTick()

    expect(rejections).toEqual([])
  })

  // lote 29 (R3-3): el rechazo de la propia promesa de addListener (no solo el del
  // remove posterior) tampoco debe escapar como unhandled. El turno extra antes del
  // unmount modela la ventana real (el cleanup puede llegar mucho después del rechazo).
  it('una promesa de addListener rechazando no escapa como unhandled rejection', async () => {
    addListenerImplRef.current = () => Promise.reject(new Error('addListener caído'))

    const { unmount } = renderHook(() => useWidgetSyncHost())
    await settle()
    expect(addListenerCalls).toEqual([{ event: 'appStateChange', cb: expect.any(Function) }])

    // Turno de macrotask SIN cleanup todavía: acá es donde Node emitiría el rechazo
    // huérfano (fuera de `act`, igual que en la vida real entre el arranque y el unmount).
    await waitRejectionTick()
    unmount()
    await waitRejectionTick()

    expect(rejections).toEqual([])
  })
})

describe('useWidgetDeepLinks — limpieza del listener (84d.followups c)', () => {
  it('una limpieza de listener que rechaza no escapa como unhandled rejection', async () => {
    addListenerImplRef.current = () =>
      Promise.resolve({
        remove: async () => {
          throw new Error('remove caído')
        },
      })

    const { unmount } = renderHook(() => useWidgetDeepLinks(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    })
    await settle()
    expect(addListenerCalls).toEqual([{ event: 'appUrlOpen', cb: expect.any(Function) }])

    unmount()
    await waitRejectionTick()

    expect(rejections).toEqual([])
  })

  // lote 29 (R3-3): mismo caso para el host de deep links (turno extra antes del
  // unmount, igual que arriba).
  it('una promesa de addListener rechazando no escapa como unhandled rejection', async () => {
    addListenerImplRef.current = () => Promise.reject(new Error('addListener caído'))

    const { unmount } = renderHook(() => useWidgetDeepLinks(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    })
    await settle()
    expect(addListenerCalls).toEqual([{ event: 'appUrlOpen', cb: expect.any(Function) }])

    await waitRejectionTick()
    unmount()
    await waitRejectionTick()

    expect(rejections).toEqual([])
  })
})
