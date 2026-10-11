// Test del repo Dexie de series: create descarta el id placeholder del parser y
// persiste la fila con el id incremental real (contrato del import F81, R3-004).
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Tabla fake con trazado: replica orderBy('id').last() y add() de Dexie.
const dbMock = vi.hoisted(() => {
  const state = {
    lastRow: null as { id: number } | null,
    added: [] as unknown[],
  }
  return {
    state,
    db: {
      workoutSets: {
        orderBy: () => ({
          last: async () => state.lastRow,
        }),
        add: async (row: unknown) => {
          state.added.push(row)
        },
      },
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))

const { workoutSetRepo } = await import('@/data/repositories/dexie/workoutSetRepo')

describe('workoutSetRepo.create', () => {
  beforeEach(() => {
    dbMock.state.lastRow = null
    dbMock.state.added = []
  })

  // Placeholder del parser: create debe ignorarlo y asignar el id incremental.
  const draft = {
    id: 999,
    workoutId: 3,
    exerciseId: 7,
    setNumber: 1,
    weightKg: 60,
    reps: 10,
    completed: true,
    createdAt: '2024-01-02T00:00:00',
  }

  it('persiste con el id incremental (6) aunque el borrador traiga id 999, y lo devuelve', async () => {
    dbMock.state.lastRow = { id: 5 }
    const id = await workoutSetRepo.create(draft)

    expect(id).toBe(6)
    expect(dbMock.state.added).toEqual([{ ...draft, id: 6 }])
  })

  // Borde 81.R3-002: con la tabla vacía (primer import) nextId parte de 0 → id 1.
  it('tabla vacía: el primer insert recibe id 1', async () => {
    dbMock.state.lastRow = null
    const id = await workoutSetRepo.create(draft)

    expect(id).toBe(1)
    expect(dbMock.state.added).toEqual([{ ...draft, id: 1 }])
  })
})
