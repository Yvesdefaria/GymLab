/**
 * F139.18 — migración v19: los remos que quedaron persistidos como `cardio` por el
 * heurístico viejo (`\brow\b`) vuelven a `strength`. Solo toca filas con el token
 * suelto `row` que el heurístico actual ya no marca cardio: no reclasifica cardio
 * legítimo (rowing, bicicleta) ni categorías explícitas de otros tipos.
 */
import { describe, expect, it } from 'vitest'
import {
  reclassifyRowExercises,
  type CategoryMigrationTable,
  type ExerciseCategoryRow,
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

describe('reclassifyRowExercises', () => {
  it('pasa a fuerza los remos que el heurístico viejo marcó como cardio', async () => {
    const { table, updates } = makeTable([
      row(1076, 'Bent Over Two-Dumbbell Row', 'bent-over-two-dumbbell-row', 'cardio'),
      row(1049, 'Deltoides posterior remo con barra', 'barbell-rear-delt-row', 'cardio'),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(2)
    expect(updates).toEqual([
      { id: 1076, category: 'strength' },
      { id: 1049, category: 'strength' },
    ])
  })

  it('detecta el token row en el nombre aunque el slug no lo tenga', async () => {
    const { table, updates } = makeTable([
      row(2001, 'Bent Over Row', 'bent-over', 'cardio'),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(1)
    expect(updates).toEqual([{ id: 2001, category: 'strength' }])
  })

  it('no toca el plural rows: el heurístico viejo tampoco lo marcaba', async () => {
    const { table, updates } = makeTable([
      row(2002, 'Remo sentado con polea', 'seated-cable-rows', 'cardio'),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })

  it('no toca la máquina de remo: sigue siendo cardio', async () => {
    const { table, updates } = makeTable([
      row(1573, 'Remo, estacionario', 'rowing-stationary', 'cardio'),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })

  it('no toca una fila que el heurístico nuevo todavía detecta como cardio', async () => {
    const { table, updates } = makeTable([
      row(2003, 'Row, rowing machine', 'rowing-machine', 'cardio'),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })

  it('no toca cardio sin el token row (categoría explícita)', async () => {
    const { table, updates } = makeTable([
      row(17, 'Bicicleta', 'bicicleta', 'cardio'),
      row(18, 'Cinta de correr', 'treadmill', 'cardio'),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })

  it('ignora filas que ya son fuerza o no tienen categoría', async () => {
    const { table, updates } = makeTable([
      row(1, 'Sentadilla', 'sentadilla', 'strength'),
      row(2, 'Remo en punta', 'bent-over-row', undefined),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(0)
    expect(updates).toEqual([])
  })

  it('es idempotente: una segunda pasada no cambia nada', async () => {
    const { table, updates } = makeTable([
      row(1076, 'Bent Over Two-Dumbbell Row', 'bent-over-two-dumbbell-row', 'cardio'),
    ])

    await expect(reclassifyRowExercises(table)).resolves.toBe(1)
    await expect(reclassifyRowExercises(table)).resolves.toBe(0)
    expect(updates).toHaveLength(1)
  })
})
