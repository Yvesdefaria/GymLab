/**
 * F143/R3-001, R3-004 — upgrades reales de Dexie.
 *
 * Crea una base v19 (o v18) con filas en `cardio`, abre la base de la app (v20)
 * y verifica que las migraciones v19 (remos) y v20 (empujes de pecho) se ejecutan
 * de verdad. Los tests anteriores solo miraban `db.verno`, que sigue siendo 20
 * aunque el callback de upgrade desaparezca.
 */
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/repositories/dexie/db'

const DB_NAME = 'GymLabDB'

const exerciseRow = (
  id: number,
  name: string,
  slug: string,
  category: string,
): Record<string, unknown> => ({
  id,
  name,
  slug,
  category,
  muscleGroup: 'pecho',
  equipment: [],
  instructions: '',
  imageUrls: [],
})

const seedLegacy = async (version: 18 | 19, rows: Array<Record<string, unknown>>) => {
  const legacy = new Dexie(DB_NAME)
  legacy.version(version).stores({ exercises: 'id, slug' })
  await legacy.open()
  await legacy.table('exercises').bulkAdd(rows)
  legacy.close()
}

beforeEach(async () => {
  if (db.isOpen()) db.close()
  await Dexie.delete(DB_NAME)
})

afterEach(async () => {
  if (db.isOpen()) db.close()
  await Dexie.delete(DB_NAME)
})

describe('F143 — upgrades reales de Dexie', () => {
  it('la v20 corrige los empujes de pecho sobre una base v19', async () => {
    await seedLegacy(19, [
      exerciseRow(1146, 'Empuje de pecho con salida corriendo', 'chest-push-with-run-release', 'cardio'),
      exerciseRow(1323, 'Salto de profundidad con flexión inclinada', 'incline-push-up-depth-jump', 'cardio'),
      exerciseRow(1064, 'Banca salto', 'bench-jump', 'cardio'),
    ])

    await db.open()

    const rows = await db.exercises.bulkGet([1146, 1323, 1064])
    expect(rows.map((row) => row?.category)).toEqual(['strength', 'strength', 'cardio'])
  })

  it('la v19 y la v20 corren encadenadas sobre una base v18', async () => {
    await seedLegacy(18, [
      exerciseRow(1076, 'Bent Over Two-Dumbbell Row', 'bent-over-two-dumbbell-row', 'cardio'),
      exerciseRow(1146, 'Empuje de pecho con salida corriendo', 'chest-push-with-run-release', 'cardio'),
    ])

    await db.open()

    const rows = await db.exercises.bulkGet([1076, 1146])
    expect(rows.map((row) => row?.category)).toEqual(['strength', 'strength'])
  })
})
