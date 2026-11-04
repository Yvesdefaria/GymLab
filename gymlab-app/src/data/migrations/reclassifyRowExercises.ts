// F139.18 — migración v19: los remos persistidos como `cardio` por el heurístico viejo
// (`CARDIO_RE` incluía `\brow\b`) vuelven a `strength`. Solo toca filas con el token
// suelto `row` que el heurístico actual ya no marca cardio: no reclasifica cardio
// legítimo (rowing, bicicleta) ni categorías explícitas de otros tipos.
// Se ejecuta una sola vez por instalación (upgrade de Dexie) y es idempotente.
import { detectCategory } from '@/domain/exerciseCategory'
import type { ExerciseCategory } from '@/domain/types'

export interface ExerciseCategoryRow {
  id: number
  name: string
  slug: string
  externalId?: string
  category?: ExerciseCategory
}

export interface CategoryMigrationTable {
  toArray: () => Promise<ExerciseCategoryRow[]>
  update: (id: number, changes: Partial<Pick<ExerciseCategoryRow, 'category'>>) => Promise<number>
}

const ROW_TOKEN = /\brow\b/i

const haystackOf = (row: ExerciseCategoryRow): string =>
  `${row.name} ${row.slug} ${row.externalId ?? ''}`

// Devuelve cuántas filas cambió; un segundo pase sobre las mismas filas devuelve 0.
export const reclassifyRowExercises = async (
  table: CategoryMigrationTable,
): Promise<number> => {
  const rows = await table.toArray()
  let changed = 0
  for (const row of rows) {
    if (row.category !== 'cardio' || !ROW_TOKEN.test(haystackOf(row))) continue
    const category = detectCategory(row.name, row.slug, row.externalId)
    if (category === 'cardio') continue
    await table.update(row.id, { category })
    changed += 1
  }
  return changed
}
