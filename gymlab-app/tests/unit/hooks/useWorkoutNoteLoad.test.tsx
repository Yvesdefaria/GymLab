// @vitest-environment jsdom
// 84.unificacion-nota.followups-3(b) — R3-2 (lote 19): la carga de la nota no
// puede quedar sin salida. El querier real corre (useLiveQuery real) contra un
// workoutRepo mockeado: rechazo → sentinel + failed (sin rethrow al render),
// nunca-resuelve → timeout acotado, y resolución tardía → recuperación.
// lote-19.followups (lote 20): el latch de timeout se rearma al cambiar de
// workoutId (R3-REL-001).
// lote-20.followups (lote 22): el querier devuelve `{ forId, value }` ligado a su
// carga y el hook solo expone la carga ACTUAL (R3-REL-101). El vendor conserva el
// resultado previo al resuscribir (useObservable v4.4.0: `hasResult` impide que se
// re-aplique el default), pero el hook ya no lo expone: al cambiar de id, la carga
// nueva se ve «cargando» (ready=false, note=undefined, failed=false) hasta su
// primera emisión, y su ventana de 4 s rearma completa. La sonda por commit
// (R3-REL-102) prueba que ningún commit pinta `failed` stale, y la frontera
// null ↔ id (R3-REL-103) cubre la semántica sin workout.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { useEffect } from 'react'

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

  it('cambio de workoutId tras un timeout: el latch se rearma con ventana nueva completa', async () => {
    const first = deferred<NoteRow>()
    const second = deferred<NoteRow>()
    getByIdSpy.mockImplementation((id) => (id === 1 ? first.promise : second.promise))
    const { result, rerender } = renderHook(({ id }: { id: number }) => useWorkoutNote(id), {
      initialProps: { id: 1 },
    })
    await flush()

    // id1 nunca resuelve: la ventana se agota y el latch queda en failed.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS)
    })
    expect(result.current.failed).toBe(true)

    // Cambio de carga en la MISMA instancia: el latch debe rearmarse sin dejar
    // ni un frame en failed (HOY queda true y la ventana de id2 nunca corre).
    rerender({ id: 2 })
    expect(result.current.ready).toBe(false)
    expect(result.current.failed).toBe(false)

    // La ventana nueva es completa: a 3999 ms sigue armada; recién a los 4000
    // se declara colgada la carga nueva.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS - 1)
    })
    expect(result.current.failed).toBe(false)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.failed).toBe(true)
  })

  // R3-REL-101 (lote 22) — supersede el pinneo del contrato del vendor de la era
  // lote 20: la librería sigue conservando el resultado previo al resuscribir, pero
  // el hook ya no lo expone. La carga que no es la actual se enmascara como
  // «cargando» (ready=false, note=undefined, failed=false) hasta que emite la nueva.
  it('cambio de id con querier pendiente: la nota previa queda enmascarada como «cargando» y la ventana se rearma', async () => {
    const first = deferred<NoteRow>()
    const second = deferred<NoteRow>()
    getByIdSpy.mockImplementation((id) => (id === 1 ? first.promise : second.promise))
    const { result, rerender } = renderHook(({ id }: { id: number }) => useWorkoutNote(id), {
      initialProps: { id: 1 },
    })
    await flush()
    await act(async () => {
      first.resolve({ notes: 'nota A' })
    })
    await flush()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('nota A')

    // id2 arranca pendiente: el resultado de id1 (conservado por el vendor) queda
    // enmascarado — nunca se expone como si fuera de la carga actual.
    rerender({ id: 2 })
    expect(result.current.ready).toBe(false)
    expect(result.current.note).toBeUndefined()
    expect(result.current.failed).toBe(false)

    // La ventana de id2 se rearmó completa: a 3999 ms sigue armada; recién a los
    // 4000 se declara colgada la carga nueva.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS - 1)
    })
    expect(result.current.failed).toBe(false)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.failed).toBe(true)

    // La query nueva emite: recién ahí la nota cambia (y el timeout se limpia).
    await act(async () => {
      second.resolve({ notes: 'nota B' })
    })
    await flush()
    expect(result.current.note).toBe('nota B')
    expect(result.current.ready).toBe(true)
    expect(result.current.failed).toBe(false)
  })

  // R3-REL-101 (lote 22): el caso más filoso del vendor — tras un rechazo, el
  // sentinel del querier también se conserva al cambiar de id. Enmascarado, el id
  // nuevo arranca con su propia ventana en vez de heredar failed=true al instante.
  it('rechazo + cambio de id: el sentinel de la carga vieja no marca failed a la nueva', async () => {
    const second = deferred<NoteRow>()
    getByIdSpy.mockImplementation((id) =>
      id === 1 ? Promise.reject(new Error('sin storage')) : second.promise
    )
    const { result, rerender } = renderHook(({ id }: { id: number }) => useWorkoutNote(id), {
      initialProps: { id: 1 },
    })
    await flush()
    expect(result.current.failed).toBe(true)

    // Sin enmascarado, el sentinel conservado daría failed=true al instante para
    // id2 (sin frame de carga ni ventana). Debe verse como una carga nueva.
    rerender({ id: 2 })
    expect(result.current.ready).toBe(false)
    expect(result.current.note).toBeUndefined()
    expect(result.current.failed).toBe(false)

    // La ventana de id2 corre completa; el fallo recién llega si la carga cuelga.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS - 1)
    })
    expect(result.current.failed).toBe(false)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.failed).toBe(true)
  })

  // R3-REL-102 (lote 22): la promesa «sin frame commiteado con failed stale» no
  // puede defenderse solo con el estado asentado que deja leer `act`: un reset por
  // effect commitea el frame stale y recién después re-renderiza. La sonda sin
  // deps corre tras CADA commit y captura ese frame intermedio.
  it('sonda por commit: desde el cambio de id ningún commit pinta failed stale', async () => {
    const first = deferred<NoteRow>()
    const second = deferred<NoteRow>()
    getByIdSpy.mockImplementation((id) => (id === 1 ? first.promise : second.promise))

    const commits: boolean[] = []
    const Probe = ({ id }: { id: number }) => {
      const { failed } = useWorkoutNote(id)
      useEffect(() => {
        commits.push(failed)
      })
      return null
    }

    const { rerender } = render(<Probe id={1} />)
    await flush()
    // id1 nunca resuelve: la ventana se agota y el latch queda en failed.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS)
    })

    const before = commits.length
    rerender(<Probe id={2} />)

    // Desde el switch, la sonda debe haber corrido (hubo commit) sin ningún true:
    // el ajuste del latch ocurre DURANTE el render, no en un effect posterior.
    const afterSwitch = commits.slice(before)
    expect(afterSwitch.length).toBeGreaterThan(0)
    expect(afterSwitch).not.toContain(true)
  })

  // R3-REL-103 (lote 22): frontera null ↔ id. Sin workout la carga es inmediata
  // (nota vacía, ready) y no arma ventana; las transiciones siguen la semántica:
  // la carga que no es la actual se enmascara y la ventana arma/desarma según el id.
  it('frontera null: sin workout → ready con nota vacía, sin tocar el repo y sin ventana', async () => {
    const { result } = await renderLoaded(null)

    expect(getByIdSpy).not.toHaveBeenCalled()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('')
    expect(result.current.failed).toBe(false)

    // null no arma ventana: más allá del umbral no hay timeout que dispare.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS * 2)
    })
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('')
    expect(result.current.failed).toBe(false)
  })

  // R3-001 (lote 23): borde falsy no-null. `0` lo atiende la rama sin-workout,
  // pero su `forId` debe ser el PROPIO valor de la carga: con `forId: null` fijo,
  // `null === 0` nunca matchea, el resultado queda enmascarado para siempre y
  // `ready` jamás llega (la ventana de 4 s lo declara failed).
  it('frontera falsy no-null (0): sin workout → ready con nota vacía, sin tocar el repo y sin ventana', async () => {
    const { result } = await renderLoaded(0)

    expect(getByIdSpy).not.toHaveBeenCalled()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('')
    expect(result.current.failed).toBe(false)

    // Sin id real no hay ventana que agotar: más allá del umbral sigue lista.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS * 2)
    })
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('')
    expect(result.current.failed).toBe(false)
  })

  it('frontera id → null: la nota vieja se enmascara, gana la vacía y no se arma ventana', async () => {
    getByIdSpy.mockResolvedValue({ notes: 'nota A' })
    const { result, rerender } = renderHook(({ id }: { id: number | null }) => useWorkoutNote(id), {
      initialProps: { id: 1 as number | null },
    })
    await flush()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('nota A')

    // La carga null aún no emitió: la nota de id1 queda enmascarada como «cargando».
    rerender({ id: null })
    expect(result.current.ready).toBe(false)
    expect(result.current.note).toBeUndefined()
    expect(result.current.failed).toBe(false)

    await flush()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('')
    expect(result.current.failed).toBe(false)

    // Sin workout no hay ventana que agotar.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS * 2)
    })
    expect(result.current.ready).toBe(true)
    expect(result.current.failed).toBe(false)
  })

  it('frontera null → id: la nota vacía se enmascara y la ventana nueva arma completa', async () => {
    const second = deferred<NoteRow>()
    getByIdSpy.mockReturnValue(second.promise)
    const { result, rerender } = renderHook(({ id }: { id: number | null }) => useWorkoutNote(id), {
      initialProps: { id: null as number | null },
    })
    await flush()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('')

    rerender({ id: 2 })
    expect(result.current.ready).toBe(false)
    expect(result.current.note).toBeUndefined()
    expect(result.current.failed).toBe(false)

    // La ventana de id2 arma completa…
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTE_LOAD_TIMEOUT_MS - 1)
    })
    expect(result.current.failed).toBe(false)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.failed).toBe(true)

    // …y una resolución tardía recupera la carga real.
    await act(async () => {
      second.resolve({ notes: 'nota B' })
    })
    await flush()
    expect(result.current.ready).toBe(true)
    expect(result.current.note).toBe('nota B')
    expect(result.current.failed).toBe(false)
  })
})
