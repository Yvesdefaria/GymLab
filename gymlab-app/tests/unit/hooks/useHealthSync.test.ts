// Dos frentes: `mapSyncStatus` (pureza del controlador, se conserva) y el loop de
// refresco rápido de /pasos (F108). El loop se testea con fake timers y un `document`
// mínimo sobre el starter exportado: el repo no monta hooks (sin testing-library) y
// el glue React queda cubierto por la regresión e2e de /pasos.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mapSyncStatus } from '@/data/healthSyncController'
import {
  HEALTH_FAST_REFRESH_MS,
  HEALTH_SLOW_RETRY_MS,
  startPageHealthFastRefresh,
} from '@/hooks/useHealthSync'

// El flag nativo es mutable: un test simula web sin reimportar el mock.
const nativeState = vi.hoisted(() => ({ value: true }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => nativeState.value },
}))

// Dependencias del controlador real (Dexie, plugin de salud) mockeadas con el mismo
// patrón de healthSyncController.test.ts: el loop corre contra el controlador real.
const getBridgeSpy = vi.fn()
vi.mock('@/data/healthBridge', () => ({
  getHealthBridge: (...args: unknown[]) => getBridgeSpy(...args),
}))

const syncSpy = vi.fn()
vi.mock('@/data/stepsSync', () => ({
  syncStepsFromHealth: (...args: unknown[]) => syncSpy(...args),
}))

vi.mock('@/data/repositories', () => ({
  metaRepo: {
    getJson: vi.fn(async () => ''),
    setJson: vi.fn(async () => undefined),
  },
}))

// Visibilidad falseable: el loop decide con `document.visibilityState`.
const visibility = { state: 'visible' as DocumentVisibilityState }
const visibilityListeners = new Set<() => void>()

const fireVisibilityChange = (state: DocumentVisibilityState) => {
  visibility.state = state
  for (const listener of [...visibilityListeners]) listener()
}

// Drena la cadena de promesas del tick (inFlight se libera en un finally, ya fuera
// del reloj fake): sin esto el refresh inmediato se deduplicaría contra la sync previa.
const flushMicrotasks = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  nativeState.value = true
  visibility.state = 'visible'
  visibilityListeners.clear()
  getBridgeSpy.mockReset().mockResolvedValue({})
  syncSpy.mockReset()
  vi.stubGlobal('document', {
    get visibilityState() {
      return visibility.state
    },
    addEventListener: (_type: string, listener: () => void) => {
      visibilityListeners.add(listener)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      visibilityListeners.delete(listener)
    },
  })
  // node no tiene `window`: se delega al setTimeout global (fake con fake timers).
  vi.stubGlobal('window', {
    setTimeout: (handler: () => void, timeout?: number) => globalThis.setTimeout(handler, timeout),
    clearTimeout: (id?: number) => globalThis.clearTimeout(id),
  })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('mapSyncStatus', () => {
  it('synced → granted (la UI deja de mostrar el banner)', () => {
    expect(mapSyncStatus('synced')).toBe('granted')
  })

  it('denied → denied (pide conectar salud)', () => {
    expect(mapSyncStatus('denied')).toBe('denied')
  })

  it('unavailable → unavailable (web/no compatible; banner silencioso)', () => {
    expect(mapSyncStatus('unavailable')).toBe('unavailable')
  })

  it('error → error (banner con reintentar)', () => {
    expect(mapSyncStatus('error')).toBe('error')
  })
})

describe('startPageHealthFastRefresh', () => {
  it('en nativo refresca en cadena cada ~3 s', async () => {
    syncSpy.mockResolvedValue({ status: 'synced', days: 0 })
    startPageHealthFastRefresh()

    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS - 1)
    expect(syncSpy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(syncSpy).toHaveBeenCalledTimes(1)
    // El siguiente tick se agendó al asentarse la sync anterior, no por setInterval.
    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS)
    expect(syncSpy).toHaveBeenCalledTimes(2)
  })

  it('ocultar la página pausa el polling (no agenda más ticks)', async () => {
    syncSpy.mockResolvedValue({ status: 'synced', days: 0 })
    startPageHealthFastRefresh()
    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS)
    expect(syncSpy).toHaveBeenCalledTimes(1)
    // Asienta la sync del tick para que exista un timer pendiente que cancelar.
    await flushMicrotasks()

    fireVisibilityChange('hidden')
    await vi.advanceTimersByTimeAsync(HEALTH_SLOW_RETRY_MS * 3)
    expect(syncSpy).toHaveBeenCalledTimes(1)
  })

  it('volver a visible refresca al instante y reanuda la cadencia', async () => {
    syncSpy.mockResolvedValue({ status: 'synced', days: 0 })
    startPageHealthFastRefresh()
    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS)
    expect(syncSpy).toHaveBeenCalledTimes(1)
    // Sin la sync en vuelo (settled), el refresh al volver es una llamada nueva.
    await flushMicrotasks()

    fireVisibilityChange('hidden')
    fireVisibilityChange('visible')
    // La llamada atraviesa `await getHealthBridge()` antes de llegar al bridge de pasos.
    await flushMicrotasks()
    expect(syncSpy).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS)
    expect(syncSpy).toHaveBeenCalledTimes(3)
  })

  it('el cleanup (unmount) detiene el loop, el timer y el listener', async () => {
    syncSpy.mockResolvedValue({ status: 'synced', days: 0 })
    const stop = startPageHealthFastRefresh()
    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS)
    expect(syncSpy).toHaveBeenCalledTimes(1)
    await flushMicrotasks()

    stop()
    expect(visibilityListeners.size).toBe(0)
    await vi.advanceTimersByTimeAsync(HEALTH_SLOW_RETRY_MS * 3)
    fireVisibilityChange('hidden')
    fireVisibilityChange('visible')
    expect(syncSpy).toHaveBeenCalledTimes(1)
  })

  it("con status 'error' el siguiente tick pasa a ~30 s (backoff)", async () => {
    syncSpy.mockResolvedValue({ status: 'error' })
    startPageHealthFastRefresh()
    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS)
    expect(syncSpy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(HEALTH_SLOW_RETRY_MS - 1)
    expect(syncSpy).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(syncSpy).toHaveBeenCalledTimes(2)
  })

  it('en web (no nativo) no arranca ningún timer', async () => {
    nativeState.value = false
    syncSpy.mockResolvedValue({ status: 'synced', days: 0 })
    startPageHealthFastRefresh()

    await vi.advanceTimersByTimeAsync(HEALTH_FAST_REFRESH_MS * 10)
    expect(syncSpy).not.toHaveBeenCalled()
  })
})
