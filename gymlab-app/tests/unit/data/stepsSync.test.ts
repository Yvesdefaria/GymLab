import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetHealthSyncSessionCaches, syncStepsFromHealth } from '@/data/stepsSync'
import type { HealthBridge, HealthDaySample } from '@/data/healthBridge'
import { toLocalDateStr } from '@/domain/dates'
import { mergeHealthSample } from '@/domain/stepsFusion'
import type { DailyStepsEntry } from '@/domain/types'

// Bridge fake: control total sobre disponibilidad/permiso/muestras.
const makeBridge = (overrides: Partial<HealthBridge> = {}): HealthBridge => ({
  isAvailable: async () => true,
  checkPermission: async () => true,
  requestPermission: async () => 'granted',
  fetchStepsByDay: async (): Promise<HealthDaySample[]> => [],
  ...overrides,
})

// Spies del repo + meta: se reasignan por test. getRange/bulkUpsert son el
// contrato de H1 (una lectura de rango + un bulk write); getByDate/upsert quedan
// solo para demostrar que el camino viejo ya no se usa.
const getRangeSpy = vi.fn(
  async (..._args: unknown[]): Promise<DailyStepsEntry[]> => [],
)
const bulkUpsertSpy = vi.fn(async (..._args: unknown[]) => 1)
const getByDateSpy = vi.fn(
  async (..._args: unknown[]): Promise<DailyStepsEntry | undefined> => undefined,
)
const upsertSpy = vi.fn(async (..._args: unknown[]) => 1)
const getStrideSpy = vi.fn(async () => 70)
const getJsonSpy = vi.fn<(...args: unknown[]) => Promise<string | number>>(async (..._args: unknown[]) => 0)
const setJsonSpy = vi.fn(async (..._args: unknown[]) => undefined)

vi.mock('@/data/repositories', () => ({
  stepRepo: {
    getRange: (...args: unknown[]) => getRangeSpy(...args),
    bulkUpsert: (...args: unknown[]) => bulkUpsertSpy(...args),
    getByDate: (...args: unknown[]) => getByDateSpy(...args),
    upsert: (...args: unknown[]) => upsertSpy(...args),
    getStrideLengthCm: () => getStrideSpy(),
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
    // Implementaciones explícitas por test (clearAllMocks no las borra).
    getRangeSpy.mockReset().mockResolvedValue([])
    bulkUpsertSpy.mockReset().mockResolvedValue(1)
    getByDateSpy.mockReset().mockResolvedValue(undefined)
    upsertSpy.mockReset().mockResolvedValue(1)
    getStrideSpy.mockReset().mockResolvedValue(70)
    getJsonSpy.mockReset().mockResolvedValue(0)
    setJsonSpy.mockReset().mockResolvedValue(undefined)
    // La caché de sesión (H2) es estado de módulo: cada test arranca en frío.
    resetHealthSyncSessionCaches()
  })

  it('bridge no disponible → status unavailable, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(makeBridge({ isAvailable: async () => false }))
    expect(result).toEqual({ status: 'unavailable' })
    expect(bulkUpsertSpy).not.toHaveBeenCalled()
  })

  it('permiso denegado → status denied, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(
      makeBridge({ requestPermission: async () => 'denied' }),
    )
    expect(result).toEqual({ status: 'denied' })
    expect(bulkUpsertSpy).not.toHaveBeenCalled()
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
    expect(bulkUpsertSpy).toHaveBeenCalledWith([
      expect.objectContaining({ localDate: '2026-09-08', steps: 8_000, source: 'phone' }),
    ])
  })

  it('health con 0 no escribe (fusión manda)', async () => {
    getJsonSpy.mockResolvedValue(0)
    const result = await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => [{ localDate: '2026-09-08', steps: 0 }] }),
    )
    expect(result.status).toBe('synced')
    expect(bulkUpsertSpy).not.toHaveBeenCalled()
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
    expect(bulkUpsertSpy).not.toHaveBeenCalled()
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
    expect(bulkUpsertSpy).not.toHaveBeenCalled()
    expect(loggedError).toHaveBeenCalledWith(
      'stepsSync',
      'fallo al sincronizar pasos de salud',
      { error: expect.any(Error) },
    )
  })

  // ─── F120/H1: backfill por lotes ────────────────────────────────

  it('backfill de varios días: una lectura de rango y UN solo bulk write', async () => {
    getJsonSpy.mockResolvedValue(0)
    const samples: HealthDaySample[] = [
      { localDate: '2026-09-06', steps: 6_000 },
      { localDate: '2026-09-07', steps: 7_000 },
      { localDate: '2026-09-08', steps: 8_000 },
    ]
    await syncStepsFromHealth(makeBridge({ fetchStepsByDay: async () => samples }), 'auto')

    expect(getRangeSpy).toHaveBeenCalledTimes(1)
    expect(getRangeSpy).toHaveBeenCalledWith(expect.any(String), toLocalDateStr())
    expect(bulkUpsertSpy).toHaveBeenCalledTimes(1)
    const [entries] = bulkUpsertSpy.mock.calls[0] as unknown as [DailyStepsEntry[]]
    expect(entries.map((e) => e.localDate)).toEqual(['2026-09-06', '2026-09-07', '2026-09-08'])
    // El camino viejo (lectura + upsert por día) ya no se usa.
    expect(getByDateSpy).not.toHaveBeenCalled()
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('sin samples no lee el rango ni la zancada (tick ocioso barato)', async () => {
    getJsonSpy.mockResolvedValue(toLocalDateStr())
    await syncStepsFromHealth(makeBridge({ fetchStepsByDay: async () => [] }), 'auto')

    expect(getRangeSpy).not.toHaveBeenCalled()
    expect(getStrideSpy).not.toHaveBeenCalled()
    expect(bulkUpsertSpy).not.toHaveBeenCalled()
  })

  // F108 (tick rápido): releer el mismo día no debe reescribir nada.
  it('sin cambios relevantes no hace bulk del día', async () => {
    const localDate = toLocalDateStr()
    const stored = mergeHealthSample(localDate, undefined, 8_000, 70, new Date().toISOString())!
    getJsonSpy.mockResolvedValue(new Date().toISOString())
    getRangeSpy.mockResolvedValue([{ ...stored, id: 7 } as DailyStepsEntry])

    const result = await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => [{ localDate, steps: 8_000 }] }),
      'auto',
    )

    expect(result).toEqual({ status: 'synced', days: 0 })
    expect(bulkUpsertSpy).not.toHaveBeenCalled()
  })

  it('misma fecha: la meta de última sync no se reescribe', async () => {
    const localDate = toLocalDateStr()
    const stored = mergeHealthSample(localDate, undefined, 8_000, 70, new Date().toISOString())!
    getJsonSpy.mockResolvedValue(new Date().toISOString())
    getRangeSpy.mockResolvedValue([{ ...stored, id: 7 } as DailyStepsEntry])

    await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => [{ localDate, steps: 8_000 }] }),
      'auto',
    )

    expect(setJsonSpy).not.toHaveBeenCalled()
  })

  it('sin días escritos no emite steps_synced', async () => {
    const localDate = toLocalDateStr()
    const stored = mergeHealthSample(localDate, undefined, 8_000, 70, new Date().toISOString())!
    getJsonSpy.mockResolvedValue(new Date().toISOString())
    getRangeSpy.mockResolvedValue([{ ...stored, id: 7 } as DailyStepsEntry])

    await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => [{ localDate, steps: 8_000 }] }),
      'auto',
    )

    expect(tracked).not.toHaveBeenCalled()
  })

  it('un día manual sí se pisa con la fuente salud (la fusión sigue mandando)', async () => {
    const localDate = toLocalDateStr()
    getJsonSpy.mockResolvedValue(new Date().toISOString())
    getRangeSpy.mockResolvedValue([
      {
        id: 7,
        localDate,
        steps: 8_000,
        distanceKm: 1,
        calories: 2,
        source: 'manual',
        syncedAt: '2026-09-01T00:00:00.000Z',
      } as DailyStepsEntry,
    ])

    const result = await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => [{ localDate, steps: 8_000 }] }),
      'auto',
    )

    expect(result).toEqual({ status: 'synced', days: 1 })
    expect(bulkUpsertSpy).toHaveBeenCalledTimes(1)
    const [entries] = bulkUpsertSpy.mock.calls[0] as unknown as [DailyStepsEntry[]]
    expect(entries).toEqual([
      expect.objectContaining({ localDate, steps: 8_000, source: 'phone' }),
    ])
  })

  // ─── F120/H2: caché de sesión ───────────────────────────────────

  it('ticks auto repetidos no vuelven a consultar availability/permiso/zancada', async () => {
    const isAvailable = vi.fn(async () => true)
    const checkPermission = vi.fn(async () => true)
    const bridge = makeBridge({
      isAvailable,
      checkPermission,
      fetchStepsByDay: async () => [{ localDate: toLocalDateStr(), steps: 5_000 }],
    })

    await syncStepsFromHealth(bridge, 'auto')
    await syncStepsFromHealth(bridge, 'auto')

    expect(isAvailable).toHaveBeenCalledTimes(1)
    expect(checkPermission).toHaveBeenCalledTimes(1)
    expect(getStrideSpy).toHaveBeenCalledTimes(1)
  })

  it('el denied también se cachea en auto y no se re-consulta por tick', async () => {
    const checkPermission = vi.fn(async () => false)
    const bridge = makeBridge({ checkPermission })

    expect(await syncStepsFromHealth(bridge, 'auto')).toEqual({ status: 'denied' })
    expect(await syncStepsFromHealth(bridge, 'auto')).toEqual({ status: 'denied' })
    expect(checkPermission).toHaveBeenCalledTimes(1)
  })

  it('resetHealthSyncSessionCaches revalida en el primer tick siguiente (foreground)', async () => {
    const isAvailable = vi.fn(async () => true)
    const checkPermission = vi.fn(async () => true)
    const bridge = makeBridge({
      isAvailable,
      checkPermission,
      fetchStepsByDay: async () => [{ localDate: toLocalDateStr(), steps: 5_000 }],
    })

    await syncStepsFromHealth(bridge, 'auto')
    resetHealthSyncSessionCaches()
    await syncStepsFromHealth(bridge, 'auto')

    expect(isAvailable).toHaveBeenCalledTimes(2)
    expect(checkPermission).toHaveBeenCalledTimes(2)
    expect(getStrideSpy).toHaveBeenCalledTimes(2)
  })

  it('interactive revalida el permiso en cada intento y actualiza la caché', async () => {
    const requestPermission = vi.fn(async () => 'granted' as const)
    const checkPermission = vi.fn(async () => true)
    const bridge = makeBridge({ checkPermission, requestPermission })

    await syncStepsFromHealth(bridge, 'interactive')
    await syncStepsFromHealth(bridge, 'interactive')

    expect(requestPermission).toHaveBeenCalledTimes(2)
    // El resultado interactivo deja la caché en granted: el tick auto siguiente
    // no vuelve a chequear.
    await syncStepsFromHealth(bridge, 'auto')
    expect(checkPermission).not.toHaveBeenCalled()
  })
})
