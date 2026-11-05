/**
 * F142 — migración v20: los dos empujes de pecho que quedaron persistidos como
 * `cardio` por los tokens anchos `run` y `jump` vuelven a `strength`. Solo toca
 * esos slugs: no reclasifica los saltos de pierna/glúteo (siguen cardio) ni el
 * cardio legítimo (cinta, trail running).
 */
import { describe, expect, it } from 'vitest'
import {
  reclassifyChestPushExercises,
} from '@/data/migrations/reclassifyChestPushExercises'
import type {
  CategoryMigrationTable,
  ExerciseCategoryRow,
} from '@/data/migrations/reclassifyRowExercises'

const makeTable = (rows: ExerciseCategoryRow[]) => {
  const updates: Array<{ id: number; category?: string }> = []
  const table: CategoryMigrationTable = {
    toArray: async () => rows,
    update: async (id, changes) => {
      const row = rows.find((r) => r.id === id)
      if (row) Object.assign(row, changes)
      updates.push({ id, ...changes })
      return 1
    },
  }
  return { table, updates }
}

const row = (id: number, name: string, slug: string, category?: ExerciseCategoryRow['category']) => ({
  id,
  name,
  slug,
  category,
})

describe('reclassifyChestPushExercises', () => {
  it('pasa a fuerza los dos empujes de pecho persistidos como cardio', async () => {
    const { table, updates } = makeTable([
      row(1146, 'Empuje de pecho con salida corriendo', 'chest-push-with-run-release', 'cardio'),
      row(1323, 'Salto de profundidad con flexión inclinada', 'incline-push-up-depth-jump', 'cardio'),
    ])

    await expect(reclassifyChestPushExercises(table)).resolves.toBe(2)
    expect(updates).toEqual([
      { id: 1146, category: 'strength' },
      { id: 1323, category: 'strength' },
    ])
  })

  it('es idempotente: un segundo pase no cambia nada', async () => {
    const { table, updates } = makeTable([
      row(1146, 'Empuje de pecho con salida corriendo', 'chest-push-with-run-release', 'strength'),
      row(1323, 'Salto de profundidad con flexión inclinada', 'incline-push-up-depth-jump', 'strength'),
    ])

    await expect(reclassifyChestPushExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })

  it('no toca los saltos de pierna: siguen cardio', async () => {
    const { table, updates } = makeTable([
      row(1064, 'Banca salto', 'bench-jump', 'cardio'),
      row(1570, 'Salto de cuerda', 'rope-jumping', 'cardio'),
    ])

    await expect(reclassifyChestPushExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })

  it('no toca el cardio de cinta ni el trail running', async () => {
    const { table, updates } = makeTable([
      row(1575, 'Correr, cinta', 'running-treadmill', 'cardio'),
      row(1772, 'Trail Running/Walking', 'trail-running-walking', 'cardio'),
    ])

    await expect(reclassifyChestPushExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })
})
