import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks hoisted (patrón de healthBridge.test.ts): registerPlugin se llama al importar la impl.
const { updateSpy, getPlatformSpy, registerPluginSpy } = vi.hoisted(() => ({
  updateSpy: vi.fn(async () => undefined),
  getPlatformSpy: vi.fn(() => 'web'),
  registerPluginSpy: vi.fn(() => ({ update: updateSpy })),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: getPlatformSpy },
  registerPlugin: registerPluginSpy,
}))

import { DEFAULT_STEPS_GOAL } from '@/domain/stepsTracker'
import { buildWidgetSnapshot, pushWidgetSnapshot } from '@/data/widgetBridge'

// 84d.followups (f) + lote 29 (R3-2): el nombre registrado debe coincidir con el
// nativo (@CapacitorPlugin(name = "GymLabWidget")). Re-registro fresco con el
// registry limpio: el pin ya no depende del orden en el archivo ni del estado
// previo del spy (antes dependía de correr antes de los clearAllMocks).
describe('registro del plugin nativo', () => {
  it("registra el plugin con el nombre exacto 'GymLabWidget'", async () => {
    registerPluginSpy.mockClear()
    vi.resetModules()
    await import('@/data/widgetBridge')
    expect(registerPluginSpy).toHaveBeenCalledWith('GymLabWidget')
  })
})

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

  // 84d.followups (b): los no finitos no viajan al nativo.
  it('steps no finitos caen a 0', () => {
    expect(buildWidgetSnapshot(Number.NaN, 10_000, '2026-10-09').steps).toBe(0)
    expect(buildWidgetSnapshot(Number.POSITIVE_INFINITY, 10_000, '2026-10-09').steps).toBe(0)
    expect(buildWidgetSnapshot(Number.NEGATIVE_INFINITY, 10_000, '2026-10-09').steps).toBe(0)
  })

  it('meta inválida cae al default', () => {
    expect(buildWidgetSnapshot(10, 0, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
    expect(buildWidgetSnapshot(10, -1, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
  })

  it('meta no finita cae al default', () => {
    expect(buildWidgetSnapshot(10, Number.NaN, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
    expect(buildWidgetSnapshot(10, Number.POSITIVE_INFINITY, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
  })

  // 84d.followups (b): (0, 0.5) redondeaba a 0 (el guard `goal > 0` dejaba pasar
  // 0.4); una meta que redondea a 0 no es válida.
  it('meta que redondea a 0 cae al default; 0.5 redondea a 1', () => {
    expect(buildWidgetSnapshot(10, 0.4, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
    expect(buildWidgetSnapshot(10, 0.5, '2026-10-09').goal).toBe(1)
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
