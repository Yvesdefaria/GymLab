import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks hoisted (patrón de healthBridge.test.ts): registerPlugin se llama al importar la impl.
const { updateSpy, getPlatformSpy } = vi.hoisted(() => ({
  updateSpy: vi.fn(async () => undefined),
  getPlatformSpy: vi.fn(() => 'web'),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: getPlatformSpy },
  registerPlugin: () => ({ update: updateSpy }),
}))

import { DEFAULT_STEPS_GOAL } from '@/domain/stepsTracker'
import { buildWidgetSnapshot, pushWidgetSnapshot } from '@/data/widgetBridge'

describe('buildWidgetSnapshot', () => {
  it('sin registro del día usa 0 pasos y conserva la meta', () => {
    expect(buildWidgetSnapshot(undefined, 10_000, '2026-10-09')).toEqual({
      steps: 0,
      goal: 10_000,
      date: '2026-10-09',
    })
  })

  it('redondea los pasos y nunca baja de 0', () => {
    expect(buildWidgetSnapshot(8432.6, 10_000, '2026-10-09').steps).toBe(8433)
    expect(buildWidgetSnapshot(-5, 10_000, '2026-10-09').steps).toBe(0)
  })

  it('meta inválida cae al default', () => {
    expect(buildWidgetSnapshot(10, 0, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
    expect(buildWidgetSnapshot(10, -1, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
  })
})

describe('pushWidgetSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no hace nada en web/PWA', async () => {
    getPlatformSpy.mockReturnValue('web')
    await pushWidgetSnapshot({ steps: 1, goal: 10_000, date: '2026-10-09' })
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('llama al plugin nativo en Android', async () => {
    getPlatformSpy.mockReturnValue('android')
    const payload = { steps: 8432, goal: 10_000, date: '2026-10-09' }
    await pushWidgetSnapshot(payload)
    expect(updateSpy).toHaveBeenCalledWith(payload)
  })

  it('no explota si el plugin falla (fire-and-forget)', async () => {
    getPlatformSpy.mockReturnValue('android')
    updateSpy.mockRejectedValueOnce(new Error('boom'))
    await expect(
      pushWidgetSnapshot({ steps: 1, goal: 10_000, date: '2026-10-09' }),
    ).resolves.toBeUndefined()
  })
})
