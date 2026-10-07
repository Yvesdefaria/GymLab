// Test del repo Dexie de rutinas (F98.3): addItem añade al final del día con el
// siguiente `order` sin chocar con los ids del seed, y removeItem borra por id.
// F120/W4: getAllDays/getAllItems devuelven las tablas completas en una query. Se
// mockean la tabla Dexie y el helper de ids, sin IndexedDB real en node.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => {
  const state = {
    items: [] as { id: number; routineDayId: number; order: number }[],
    days: [] as { id: number; routineId: number }[],
    added: [] as Record<string, unknown>[],
    deleted: [] as number[],
  }
  return {
    state,
    db: {
      routineDays: {
        toArray: async () => state.days,
      },
      routineItems: {
        toArray: async () => state.items,
        where: () => ({
          equals: (dayId: number) => ({
            toArray: async () => state.items.filter((i) => i.routineDayId === dayId),
          }),
        }),
        add: async (row: Record<string, unknown>) => {
          state.added.push(row)
        },
        delete: async (id: number) => {
          state.deleted.push(id)
        },
      },
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))
vi.mock('@/data/repositories/dexie/base', () => ({
  getBySlug: vi.fn(),
  nextId: vi.fn(async () => 7),
}))

const { routineRepo } = await import('@/data/repositories/dexie/routineRepo')

const draft = { exerciseId: 42, targetSets: 3, targetReps: 10, restSec: 90 }

describe('routineRepo.addItem', () => {
  beforeEach(() => {
    dbMock.state.items = []
    dbMock.state.added = []
    dbMock.state.deleted = []
  })

  it('añade al final del día con el siguiente order y devuelve un id personalizado', async () => {
    dbMock.state.items = [
      { id: 10001, routineDayId: 5, order: 1 },
      { id: 10002, routineDayId: 5, order: 3 },
      { id: 10003, routineDayId: 9, order: 1 },
    ]
    const id = await routineRepo.addItem(5, draft)
    // nextCustomId = max(10000, nextId) → nunca baja de CUSTOM_ID_BASE.
    expect(id).toBe(10000)
    expect(dbMock.state.added).toEqual([
      { id: 10000, routineDayId: 5, ...draft, order: 4 },
    ])
  })

  it('con un día sin ítems usa order 1', async () => {
    await routineRepo.addItem(9, draft)
    expect(dbMock.state.added).toHaveLength(1)
    expect(dbMock.state.added[0].order).toBe(1)
  })
})

describe('routineRepo.removeItem', () => {
  it('borra el ítem por id', async () => {
    dbMock.state.deleted = []
    await routineRepo.removeItem(10005)
    expect(dbMock.state.deleted).toEqual([10005])
  })
})

describe('routineRepo.getAllDays / getAllItems', () => {
  beforeEach(() => {
    dbMock.state.days = []
    dbMock.state.items = []
  })

  it('devuelve los días y los ítems de TODAS las rutinas en una query por tabla', async () => {
    dbMock.state.days = [
      { id: 100, routineId: 1 },
      { id: 200, routineId: 2 },
    ]
    dbMock.state.items = [
      { id: 10, routineDayId: 100, order: 2 },
      { id: 11, routineDayId: 100, order: 1 },
      { id: 12, routineDayId: 200, order: 1 },
    ]
    await expect(routineRepo.getAllDays()).resolves.toEqual([
      { id: 100, routineId: 1 },
      { id: 200, routineId: 2 },
    ])
    await expect(routineRepo.getAllItems()).resolves.toEqual([
      { id: 10, routineDayId: 100, order: 2 },
      { id: 11, routineDayId: 100, order: 1 },
      { id: 12, routineDayId: 200, order: 1 },
    ])
  })

  it('con las tablas vacías devuelve listas vacías', async () => {
    await expect(routineRepo.getAllDays()).resolves.toEqual([])
    await expect(routineRepo.getAllItems()).resolves.toEqual([])
  })
})
