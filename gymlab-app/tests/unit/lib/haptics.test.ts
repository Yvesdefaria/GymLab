// Haptics unificados (F96, D5): una sola política de plataforma/ajuste/
// reduced-motion. La decisión es pura y el envío se hace por un backend
// inyectable, así que la suite node no necesita DOM ni APIs del navegador.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  decideHaptics,
  haptics,
  setHapticsBackend,
  splitVibrationPattern,
  type HapticsBackend,
} from '@/lib/haptics'

afterEach(() => {
  setHapticsBackend(null)
})

describe('decideHaptics', () => {
  it('con reduced-motion activo no vibra aunque esté habilitado y sea nativo', () => {
    expect(decideHaptics({ enabled: true, platform: 'native', webVibrateAvailable: true, reducedMotion: true })).toBe('noop')
  })

  it('con el ajuste apagado no vibra en ninguna plataforma', () => {
    expect(decideHaptics({ enabled: false, platform: 'native', webVibrateAvailable: true, reducedMotion: false })).toBe('noop')
    expect(decideHaptics({ enabled: false, platform: 'web', webVibrateAvailable: true, reducedMotion: false })).toBe('noop')
  })

  it('nativo habilitado y sin reduced-motion usa el backend nativo', () => {
    expect(decideHaptics({ enabled: true, platform: 'native', webVibrateAvailable: false, reducedMotion: false })).toBe('native')
  })

  it('web con navigator.vibrate disponible usa el backend web', () => {
    expect(decideHaptics({ enabled: true, platform: 'web', webVibrateAvailable: true, reducedMotion: false })).toBe('web')
  })

  it('web sin navigator.vibrate (iOS WebKit) es un no-op silencioso', () => {
    expect(decideHaptics({ enabled: true, platform: 'web', webVibrateAvailable: false, reducedMotion: false })).toBe('noop')
  })
})

describe('splitVibrationPattern', () => {
  it('un número suelto es un único pulso', () => {
    expect(splitVibrationPattern(60)).toEqual([60])
  })

  it('un patrón alterna vibrar/parar/vibrar (se conservan los silencios)', () => {
    expect(splitVibrationPattern([200, 100, 200])).toEqual([200, 100, 200])
  })

  it('ignora valores no positivos o no finitos', () => {
    expect(splitVibrationPattern([0, -10, 30])).toEqual([30])
    expect(splitVibrationPattern(Number.NaN)).toEqual([])
  })
})

describe('haptics', () => {
  it('sin backend inyectado es un no-op silencioso (iOS web / SSR)', () => {
    expect(() => haptics(60, { enabled: true, reducedMotion: true })).not.toThrow()
    expect(() => haptics([200, 100, 200], { enabled: true, reducedMotion: true })).not.toThrow()
  })

  it('con reduced-motion no llama al backend', () => {
    const native = vi.fn()
    const web = vi.fn()
    setHapticsBackend({ native, web })
    haptics([200, 100, 200], { enabled: true, reducedMotion: true })
    expect(native).not.toHaveBeenCalled()
    expect(web).not.toHaveBeenCalled()
  })

  it('despacha al backend web con el patrón intacto', () => {
    const native = vi.fn()
    const web = vi.fn()
    setHapticsBackend({ native, web })
    haptics([200, 100, 200], { enabled: true })
    expect(web).toHaveBeenCalledTimes(1)
    expect(web).toHaveBeenCalledWith([200, 100, 200])
    expect(native).not.toHaveBeenCalled()
  })

  it('con el ajuste apagado no llama a ningún backend', () => {
    const backend: HapticsBackend = { native: vi.fn(), web: vi.fn() }
    setHapticsBackend(backend)
    haptics([30, 40, 30], { enabled: false })
    expect(backend.native).not.toHaveBeenCalled()
    expect(backend.web).not.toHaveBeenCalled()
  })

  it('un backend que lanza no propaga el error (no-op silencioso)', () => {
    setHapticsBackend({
      native: () => {},
      web: () => {
        throw new Error('blocked without user gesture')
      },
    })
    expect(() => haptics(60, { enabled: true })).not.toThrow()
  })
})
