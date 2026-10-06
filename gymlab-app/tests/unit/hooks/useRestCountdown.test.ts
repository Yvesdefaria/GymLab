// Tick local del descanso (F103/T5): repinta 1×s derivando del deadline y sólo
// dispara la transición (escritura al store) al vencer, exactamente una vez.
// Mismo patrón que useHealthSync.test.ts: lógica exportada + fake timers, sin DOM.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REST_TICK_MS, startRestCountdownTick } from '@/hooks/useRestCountdown'

const NOW = 1_700_000_000_000

describe('startRestCountdownTick', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('repinta cada segundo sin disparar la transición mientras el descanso sigue vivo', () => {
    const repaint = vi.fn()
    const expire = vi.fn()

    startRestCountdownTick(NOW + 3_000, 3, repaint, expire)
    vi.advanceTimersByTime(REST_TICK_MS * 2)

    expect(repaint).toHaveBeenCalledTimes(2)
    expect(expire).not.toHaveBeenCalled()
  })

  it('al vencer dispara la transición una única vez y detiene el tick', () => {
    const repaint = vi.fn()
    const expire = vi.fn()

    startRestCountdownTick(NOW + 3_000, 3, repaint, expire)
    vi.advanceTimersByTime(REST_TICK_MS * 30)

    expect(expire).toHaveBeenCalledTimes(1)
    expect(repaint).toHaveBeenCalledTimes(2)
  })

  it('el cleanup cancela el tick sin transición', () => {
    const repaint = vi.fn()
    const expire = vi.fn()

    const stop = startRestCountdownTick(NOW + 3_000, 3, repaint, expire)
    stop()
    vi.advanceTimersByTime(REST_TICK_MS * 30)

    expect(repaint).not.toHaveBeenCalled()
    expect(expire).not.toHaveBeenCalled()
  })

  it('un salto de reloj vence la cuenta sin ticks de por medio', () => {
    const repaint = vi.fn()
    const expire = vi.fn()

    startRestCountdownTick(NOW + 3_000, 3, repaint, expire)
    vi.setSystemTime(NOW + 10_000)
    vi.advanceTimersByTime(REST_TICK_MS)

    expect(expire).toHaveBeenCalledTimes(1)
    expect(repaint).not.toHaveBeenCalled()
  })
})
