// Test del repo Dexie de pasos (F120/H1): bulkUpsert resuelve los ids existentes
// con UNA query por el índice localDate y escribe todos los días con bulkPut
// (una transacción), en vez del getByDate + upsert por fila del backfill.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => {
  const state = {
    existing: [] as Array<{ id: number; localDate: string }>,
    queriedDates: [] as string[],
    puts: [] as Array<Array<Record<string, unknown>>>,
  }
  return {
    state,
    db: {
      dailySteps: {
        where: (_index: string) => ({
          anyOf: (dates: string[]) => {
            state.queriedDates.push(...dates)
            return { toArray: async () => state.existing }
          },
        }),
        bulkPut: async (rows: Array<Record<string, unknown>>) => {
          state.puts.push(rows)
        },
      },
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))
vi.mock('@/data/repositories/dexie/base', () => ({
  getByDate: vi.fn(),
  nextId: vi.fn(async () => 100),
}))
vi.mock('@/data/repositories/dexie/metaRepo', () => ({
  metaRepo: { getJson: vi.fn(), setJson: vi.fn() },
}))

const { stepRepo } = await import('@/data/repositories/dexie/stepRepo')

const entry = (localDate: string, steps: number) => ({
  localDate,
  steps,
  distanceKm: 1,
  calories: 2,
  source: 'phone' as const,
})

describe('stepRepo.bulkUpsert', () => {
  beforeEach(() => {
    dbMock.state.existing = []
    dbMock.state.queriedDates = []
    dbMock.state.puts = []
  })

  it('reusa el id del día existente y asigna ids nuevos desde el último id', async () => {
    dbMock.state.existing = [{ id: 7, localDate: '2026-09-08' }]

    const written = await stepRepo.bulkUpsert([
      entry('2026-09-07', 5_000),
      entry('2026-09-08', 8_000),
    ])

    expect(written).toBe(2)
    expect(dbMock.state.puts).toHaveLength(1)
    expect(dbMock.state.puts[0]).toEqual([
      expect.objectContaining({ id: 100, localDate: '2026-09-07', steps: 5_000 }),
      expect.objectContaining({ id: 7, localDate: '2026-09-08', steps: 8_000 }),
    ])
    // Una única consulta con todas las fechas del lote.
    expect(dbMock.state.queriedDates).toEqual(['2026-09-07', '2026-09-08'])
  })

  it('con lista vacía no toca la base', async () => {
    expect(await stepRepo.bulkUpsert([])).toBe(0)
    expect(dbMock.state.puts).toHaveLength(0)
    expect(dbMock.state.queriedDates).toEqual([])
  })
})
