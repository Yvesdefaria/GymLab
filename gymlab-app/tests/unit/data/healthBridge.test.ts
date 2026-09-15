import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHealthBridge, isPermissionGranted } from '@/data/healthBridge'

// Mock de los módulos nativos antes de importar la impl.
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}))
vi.mock('capacitor-health', () => ({
  Health: {
    isHealthAvailable: vi.fn(),
    requestHealthPermissions: vi.fn(),
    queryAggregated: vi.fn(),
  },
}))

// Import después de los mocks (hoisted por vitest igualmente, pero explícito).
const { Health } = await import('capacitor-health')
const { Capacitor } = await import('@capacitor/core')

const mockIsAvailable = Health.isHealthAvailable as unknown as ReturnType<typeof vi.fn>
const mockRequest = Health.requestHealthPermissions as unknown as ReturnType<typeof vi.fn>
const mockQuery = Health.queryAggregated as unknown as ReturnType<typeof vi.fn>

describe('healthBridge (nativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('isAvailable delega en Health.isHealthAvailable', async () => {
    mockIsAvailable.mockResolvedValue({ available: true })
    const bridge = await getHealthBridge()
    expect(await bridge.isAvailable()).toBe(true)
    expect(mockIsAvailable).toHaveBeenCalledTimes(1)
  })

  it('requestPermission mapea READ_STEPS concedido → granted', async () => {
    mockRequest.mockResolvedValue({ permissions: [{ READ_STEPS: true }] })
    const bridge = await getHealthBridge()
    expect(await bridge.requestPermission()).toBe('granted')
  })

  it('requestPermission mapea READ_STEPS denegado → denied', async () => {
    mockRequest.mockResolvedValue({ permissions: [{ READ_STEPS: false }] })
    const bridge = await getHealthBridge()
    expect(await bridge.requestPermission()).toBe('denied')
  })

  it('fetchStepsByDay agrupa muestras del plugin por localDate y suma', async () => {
    mockQuery.mockResolvedValue({
      aggregatedData: [
        { startDate: '2026-09-08T00:00:00.000Z', endDate: '2026-09-08T01:00:00.000Z', value: 100 },
        { startDate: '2026-09-08T01:00:00.000Z', endDate: '2026-09-08T02:00:00.000Z', value: 150 },
        { startDate: '2026-09-09T00:00:00.000Z', endDate: '2026-09-10T00:00:00.000Z', value: 900 },
      ],
    })
    const bridge = await getHealthBridge()
    const samples = await bridge.fetchStepsByDay('2026-09-08', '2026-09-09')
    // Las 2 muestras del 08 (horarias) se suman; el 09 queda aparte.
    expect(samples).toEqual([
      { localDate: '2026-09-08', steps: 250 },
      { localDate: '2026-09-09', steps: 900 },
    ])
  })
})

describe('healthBridge (web)', () => {
  it('no importa capacitor-health y devuelve el bridge nulo', async () => {
    const nativeSpy = vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false)
    const bridge = await getHealthBridge()
    expect(await bridge.isAvailable()).toBe(false)
    expect(await bridge.requestPermission()).toBe('denied')
    expect(await bridge.fetchStepsByDay('2026-09-08', '2026-09-09')).toEqual([])
    nativeSpy.mockRestore()
  })
})

// Regresión del bug de /pasos: el plugin devuelve un MAPA y el código hacía `.some()`
// sobre él -> `TypeError: .some is not a function` -> el sync fallaba al 100% con
// «Could not sync steps», incluso con el permiso ya concedido.
describe('isPermissionGranted', () => {
  it('acepta la forma REAL del plugin (un mapa)', () => {
    expect(isPermissionGranted({ READ_STEPS: true }, 'READ_STEPS')).toBe(true)
    expect(isPermissionGranted({ READ_STEPS: false }, 'READ_STEPS')).toBe(false)
  })

  it('sigue aceptando la forma que documenta el README (array de mapas)', () => {
    expect(isPermissionGranted([{ READ_STEPS: true }], 'READ_STEPS')).toBe(true)
    expect(isPermissionGranted([{ READ_STEPS: false }], 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted([{ OTRO: true }, { READ_STEPS: true }], 'READ_STEPS')).toBe(true)
  })

  it('no explota con entradas inesperadas', () => {
    expect(isPermissionGranted(undefined, 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted(null, 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted('nope', 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted(42, 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted([], 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted([null, undefined], 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted({}, 'READ_STEPS')).toBe(false)
  })
})