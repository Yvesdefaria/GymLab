import { describe, expect, it } from 'vitest'
import type { Transaction } from 'dexie'
import { migrateJournalNotesToWorkouts } from '@/data/sessionNoteMigration'

interface RecordedUpdate {
  table: string
  id: number
  changes: Record<string, unknown>
}

const makeTx = (
  journals: Array<Record<string, unknown>>,
  workouts: Array<Record<string, unknown>>,
) => {
  const updates: RecordedUpdate[] = []
  const tx = {
    table: (name: string) => ({
      toArray: async () => (name === 'sessionJournals' ? journals : workouts),
      get: async (id: number) => workouts.find((w) => w.id === id),
      update: async (id: number, changes: Record<string, unknown>) => {
        updates.push({ table: name, id, changes })
        return 1
      },
    }),
  }
  return { updates, tx: tx as unknown as Transaction }
}

describe('migrateJournalNotesToWorkouts (F84)', () => {
  it('copia la nota del journal al workout vacío y limpia el campo viejo', async () => {
    const { updates, tx } = makeTx(
      [{ id: 1, workoutId: 10, note: 'nota journal' }],
      [{ id: 10, notes: '' }],
    )
    await migrateJournalNotesToWorkouts(tx)
    expect(updates).toStrictEqual([
      { table: 'workouts', id: 10, changes: { notes: 'nota journal' } },
      { table: 'sessionJournals', id: 1, changes: { note: undefined } },
    ])
  })

  it('une ambas notas cuando existen (sesión primero)', async () => {
    const { updates, tx } = makeTx(
      [{ id: 1, workoutId: 10, note: 'después' }],
      [{ id: 10, notes: 'durante' }],
    )
    await migrateJournalNotesToWorkouts(tx)
    expect(updates[0]).toStrictEqual({
      table: 'workouts',
      id: 10,
      changes: { notes: 'durante\n\ndespués' },
    })
    expect(updates[1]).toStrictEqual({ table: 'sessionJournals', id: 1, changes: { note: undefined } })
  })

  it('journals sin nota no se tocan', async () => {
    const { updates, tx } = makeTx([{ id: 1, workoutId: 10 }], [{ id: 10, notes: 'x' }])
    await migrateJournalNotesToWorkouts(tx)
    expect(updates).toStrictEqual([])
  })

  it('journals huérfanos (sin workout) no se tocan', async () => {
    const { updates, tx } = makeTx([{ id: 1, workoutId: 99, note: 'huérfana' }], [])
    await migrateJournalNotesToWorkouts(tx)
    expect(updates).toStrictEqual([])
  })
})
