// 84.unificacion-nota.followups-3(d) — R3-4 (lote 17): idempotencia del upsert del
// journal contra la implementación REAL del repo. El reintento del sheet re-ejecuta
// este upsert sobre el mismo workout; el contrato es actualizar la fila existente
// (mismo id) en vez de duplicarla.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Tabla fake en memoria con la superficie mínima que usa la impl:
// where('workoutId').equals(x).first(), update(id, changes), add(row) y
// orderBy('id').last() (la que necesita nextId de base.ts).
const dbMock = vi.hoisted(() => {
  type Row = {
    id: number
    workoutId: number
    energy: number
    sleep: number
    mood: number
    soreness: number
    createdAt: string
  }
  const rows: Row[] = []
  return {
    rows,
    db: {
      sessionJournals: {
        where: (field: 'workoutId') => ({
          equals: (value: number) => ({
            first: async () => rows.find((row) => row[field] === value),
          }),
        }),
        update: async (id: number, changes: Partial<Row>) => {
          const row = rows.find((r) => r.id === id)
          if (row) Object.assign(row, changes)
          return 1
        },
        add: async (row: Row) => {
          rows.push(row)
          return row.id
        },
        orderBy: () => ({
          last: async () =>
            rows.length > 0 ? [...rows].sort((a, b) => a.id - b.id)[rows.length - 1] : undefined,
        }),
      },
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))

const { sessionJournalRepo } = await import('@/data/repositories/dexie/sessionJournalRepo')

const entry = (workoutId: number) =>
  ({ workoutId, energy: 3, sleep: 3, mood: 3, soreness: 3 }) as const

describe('sessionJournalRepo.upsert — idempotencia (R3-4)', () => {
  beforeEach(() => {
    dbMock.rows.length = 0
  })

  it('repetir el upsert del mismo workout devuelve el mismo id y deja UNA fila actualizada', async () => {
    const firstId = await sessionJournalRepo.upsert(entry(1))
    const secondId = await sessionJournalRepo.upsert({
      workoutId: 1,
      energy: 5,
      sleep: 4,
      mood: 2,
      soreness: 1,
    })

    // El retry del sheet no duplica: mismo id y una sola fila con los valores del segundo llamado.
    expect(secondId).toBe(firstId)
    expect(dbMock.rows).toHaveLength(1)
    expect(dbMock.rows[0]).toMatchObject({
      id: firstId,
      workoutId: 1,
      energy: 5,
      sleep: 4,
      mood: 2,
      soreness: 1,
    })
  })

  it('un workoutId distinto crea una fila nueva con id incremental', async () => {
    const firstId = await sessionJournalRepo.upsert(entry(1))
    const secondId = await sessionJournalRepo.upsert(entry(2))

    expect(secondId).toBe(firstId + 1)
    expect(dbMock.rows).toHaveLength(2)
    expect(dbMock.rows.map((row) => row.workoutId)).toEqual([1, 2])
  })
})
