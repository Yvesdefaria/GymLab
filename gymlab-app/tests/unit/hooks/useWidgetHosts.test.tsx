// @vitest-environment jsdom
// 84d.followups (c) (lote 27): los caminos fire-and-forget de los hosts del
// widget no deben escapar como unhandled rejections — fresh read del sync host y
// limpiezas de listener en ambos hosts (captura determinística, patrón lote 18).
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

const { getByDateSpy, getGoalSpy, addListenerSpy, getLaunchUrlSpy, getPlatformSpy } = vi.hoisted(
  () => ({
    getByDateSpy: vi.fn(async (_date: string): Promise<{ steps?: number } | undefined> => undefined),
    getGoalSpy: vi.fn(async (): Promise<number> => 10_000),
    addListenerSpy: vi.fn(),
    getLaunchUrlSpy: vi.fn(async () => undefined),
    getPlatformSpy: vi.fn(() => 'android'),
  })
)

vi.mock('@/data/repositories', () => ({
  stepRepo: { getByDate: getByDateSpy, getGoal: getGoalSpy },
}))
vi.mock('@capacitor/app', () => ({
  App: { addListener: addListenerSpy, getLaunchUrl: getLaunchUrlSpy },
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
  addListenerSpy.mockReset()
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
    addListenerSpy.mockImplementation((_event: string, cb: (state: { isActive: boolean }) => void) => {
      onActive = cb
      return Promise.resolve({ remove: async () => undefined })
    })
    getByDateSpy.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('db caída'))

    renderHook(() => useWidgetSyncHost())
    await settle()

    expect(onActive).toBeTypeOf('function')
    await act(async () => {
      onActive?.({ isActive: true })
    })
    await waitRejectionTick()

    expect(rejections).toEqual([])
  })

  it('una limpieza de listener que rechaza no escapa como unhandled rejection', async () => {
    addListenerSpy.mockImplementation(() =>
      Promise.resolve({
        remove: async () => {
          throw new Error('remove caído')
        },
      })
    )

    const { unmount } = renderHook(() => useWidgetSyncHost())
    await settle()
    expect(addListenerSpy).toHaveBeenCalledWith('appStateChange', expect.any(Function))

    unmount()
    await waitRejectionTick()

    expect(rejections).toEqual([])
  })
})

describe('useWidgetDeepLinks — limpieza del listener (84d.followups c)', () => {
  it('una limpieza de listener que rechaza no escapa como unhandled rejection', async () => {
    addListenerSpy.mockImplementation(() =>
      Promise.resolve({
        remove: async () => {
          throw new Error('remove caído')
        },
      })
    )

    const { unmount } = renderHook(() => useWidgetDeepLinks(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    })
    await settle()
    expect(addListenerSpy).toHaveBeenCalledWith('appUrlOpen', expect.any(Function))

    unmount()
    await waitRejectionTick()

    expect(rejections).toEqual([])
  })
})
