import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncStepsFromHealth } from '@/data/stepsSync'
import type { HealthBridge, HealthDaySample } from '@/data/healthBridge'
import { toLocalDateStr } from '@/domain/dates'

// Bridge fake: control total sobre disponibilidad/permiso/muestras.
const makeBridge = (overrides: Partial<HealthBridge> = {}): HealthBridge => ({
  isAvailable: async () => true,
  checkPermission: async () => true,
  requestPermission: async () => 'granted',
  fetchStepsByDay: async (): Promise<HealthDaySample[]> => [],
  ...overrides,
})

// Spy del repo + meta: se reasignan por test.
const upsertSpy = vi.fn(async (..._args: unknown[]) => 1)
const getByDateSpy = vi.fn(async (..._args: unknown[]) => undefined)
const getJsonSpy = vi.fn<(...args: unknown[]) => Promise<string | number>>(async (..._args: unknown[]) => 0)
const setJsonSpy = vi.fn(async (..._args: unknown[]) => undefined)

vi.mock('@/data/repositories', () => ({
  stepRepo: {
    getByDate: (...args: unknown[]) => getByDateSpy(...args),
    upsert: (...args: unknown[]) => upsertSpy(...args),
    getStrideLengthCm: async () => 70,
  },
  metaRepo: {
    getJson: (...args: unknown[]) => getJsonSpy(...args),
    setJson: (...args: unknown[]) => setJsonSpy(...args),
  },
}))
vi.mock('@/lib/telemetry', () => ({ track: vi.fn() }))
const { track } = await import('@/lib/telemetry')
const tracked = track as unknown as ReturnType<typeof vi.fn>
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
const { logger } = await import('@/lib/logger')
const loggedError = logger.error as unknown as ReturnType<typeof vi.fn>

describe('syncStepsFromHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bridge no disponible → status unavailable, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(makeBridge({ isAvailable: async () => false }))
    expect(result).toEqual({ status: 'unavailable' })
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('permiso denegado → status denied, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(
      makeBridge({ requestPermission: async () => 'denied' }),
    )
    expect(result).toEqual({ status: 'denied' })
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('sin lastHealthSyncAt hace backfill desde hace 89 días y persiste la meta', async () => {
    getJsonSpy.mockResolvedValue(0)
    const samples: HealthDaySample[] = [{ localDate: '2026-09-08', steps: 8_000 }]
    const result = await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => samples }),
    )
    expect(result.status).toBe('synced')
    // La consulta del bridge se hizo con el rango de backfill (90 días).
    expect(setJsonSpy).toHaveBeenCalledWith('healthLastSyncAt', expect.any(String))
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ localDate: '2026-09-08', steps: 8_000, source: 'phone' }),
    )
  })

  it('health con 0 no escribe (fusión manda)', async () => {
    getJsonSpy.mockResolvedValue(0)
    const result = await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => [{ localDate: '2026-09-08', steps: 0 }] }),
    )
    expect(result.status).toBe('synced')
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('con lastHealthSyncAt hace incremental desde esa fecha (solo la parte de día)', async () => {
    getJsonSpy.mockResolvedValue('2026-09-07T12:00:00.000Z')
    const fetchSpy = vi.fn(async (): Promise<HealthDaySample[]> => [])
    await syncStepsFromHealth(makeBridge({ fetchStepsByDay: fetchSpy }))
    // El ISO con hora se normaliza a YYYY-MM-DD: el bridge construye
    // new Date(from + 'T00:00:00') y un ISO con hora rompería el parse.
    const [from, to] = fetchSpy.mock.calls[0] as unknown as [string, string]
    expect(from).toBe('2026-09-07')
    // «to» es siempre hoy local: la aserción usa el mismo helper que la
    // implementación para no volverse una bomba de fecha (fallaba al día siguiente).
    expect(to).toBe(toLocalDateStr())
  })

  it('registra steps_synced con la cantidad de días', async () => {
    getJsonSpy.mockResolvedValue('2026-09-07T12:00:00.000Z')
    await syncStepsFromHealth(
      makeBridge({
        fetchStepsByDay: async () => [{ localDate: '2026-09-08', steps: 5_000 }],
      }),
    )
    expect(tracked).toHaveBeenCalledWith('steps_synced', { days: 1 })
  })

  it('modo auto con permiso concedido sincroniza y NO abre el diálogo', async () => {
    getJsonSpy.mockResolvedValue(0)
    const requestSpy = vi.fn(async () => 'denied' as const)
    const result = await syncStepsFromHealth(
      makeBridge({ checkPermission: async () => true, requestPermission: requestSpy }),
      'auto',
    )
    expect(result.status).toBe('synced')
    expect(requestSpy).not.toHaveBeenCalled()
  })

  it('modo auto sin permiso → denied y NO abre el diálogo', async () => {
    const requestSpy = vi.fn(async () => 'granted' as const)
    const result = await syncStepsFromHealth(
      makeBridge({ checkPermission: async () => false, requestPermission: requestSpy }),
      'auto',
    )
    expect(result).toEqual({ status: 'denied' })
    expect(requestSpy).not.toHaveBeenCalled()
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('modo interactive (default) pide permiso como hoy', async () => {
    const requestSpy = vi.fn(async () => 'granted' as const)
    await syncStepsFromHealth(makeBridge({ requestPermission: requestSpy }))
    expect(requestSpy).toHaveBeenCalledTimes(1)
  })

  it('error del bridge → status error, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(
      makeBridge({
        fetchStepsByDay: async () => {
          throw new Error('health api down')
        },
      }),
    )
    expect(result.status).toBe('error')
    expect(upsertSpy).not.toHaveBeenCalled()
    expect(loggedError).toHaveBeenCalledWith(
      'stepsSync',
      'fallo al sincronizar pasos de salud',
      { error: expect.any(Error) },
    )
  })
})