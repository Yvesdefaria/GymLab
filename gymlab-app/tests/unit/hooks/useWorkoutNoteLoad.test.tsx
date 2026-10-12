// @vitest-environment jsdom
// 84.unificacion-nota.followups-3(b) — R3-2 (lote 19): la carga de la nota no
// puede quedar sin salida. El querier real corre (useLiveQuery real) contra un
// workoutRepo mockeado: rechazo → sentinel + failed (sin rethrow al render),
// nunca-resuelve → timeout acotado, y resolución tardía → recuperación.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

// Dexie captura `indexedDB` del global al evaluar el módulo y sin él `liveQuery`
// no ejecuta el querier (jsdom no trae IndexedDB). vi.hoisted corre antes de los
// imports: el stub solo destraba la ejecución; el querier del test no toca la DB.
vi.hoisted(() => {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: {},
    configurable: true,
    writable: true,
  })
})

const { getByIdSpy } = vi.hoisted(() => ({
  getByIdSpy: vi.fn(async (_id: number): Promise<{ notes?: string } | undefined> => undefined),
}))

vi.mock('@/data/repositories', () => ({
  workoutRepo: { getById: getByIdSpy, update: vi.fn(async () => undefined) },
}))

import { NOTE_LOAD_TIMEOUT_MS, useWorkoutNote } from '@/hooks/useWorkoutNote'

type NoteRow = { notes?: string } | undefined

// Promesa diferida: el caso «nunca resuelve» la controla desde el test.
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

// Deja correr el arranque del querier de Dexie (setTimeout 0) y sus tickers.
const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(1)
  })

const renderLoaded = async (workoutId: number | null = 1) => {
  const hook = renderHook(() => useWorkoutNote(workoutId))
  await flush()
  return hook
}

beforeEach(() => {
  vi.useFakeTimers()
  getByIdSpy.mockReset()
})

afterEach(() => {
  // El repo no usa `globals: true`: RTL no auto-limpia, hay que desmontar a mano.
  cleanup()
  vi.useRealTimers()
})

describe('useWorkoutNote — carga (F84/R3-2, lote 19)', () => {
  it('happy: la query resuelve → ready con la nota y sin fallo', async () => {
    getByIdSpy.mockResolvedValue({ notes: 'nota guardada' })
    const { result } = await renderLoaded()

    expect(getByIdSpy).toHaveBeenCalledWith(1)
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('nota guardada')
    expect(result.current.failed).toBe(false)
  })

  it('rechazo del querier → no explota el render, ready=false y failed=true', async () => {
    getByIdSpy.mockRejectedValue(new Error('sin storage'))
    const { result } = await renderLoaded()

    expect(result.current.ready).toBe(false)
    expect(result.current.note).toBeUndefined()
    expect(result.current.failed).toBe(true)
  })

  it('nunca resuelve → timeout → failed; resuelve tarde → recupera ready y limpia failed', async () => {
    expect(NOTE_LOAD_TIMEOUT_MS).toBe(4000)
    const pending = deferred<NoteRow>()
    getByIdSpy.mockReturnValue(pending.promise)
    const { result } = await renderLoaded()

    expect(result.current.ready).toBe(false)
    expect(result.current.failed).toBe(false)

    // Sin resolución, la ventana de carga se agota y libera la UI.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS)
    })
    expect(result.current.ready).toBe(false)
    expect(result.current.failed).toBe(true)

    // La query llega tarde: el fallo se limpia (recuperación).
    await act(async () => {
      pending.resolve({ notes: 'tarde' })
    })
    await flush()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('tarde')
    expect(result.current.failed).toBe(false)
  })
})
