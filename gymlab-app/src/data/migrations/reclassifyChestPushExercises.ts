// F142 — migración v20: dos ejercicios de pecho quedaron persistidos como `cardio`
// por los tokens anchos `run` y `jump` del heurístico viejo. El movimiento principal
// en ambos es fuerza (empuje de pecho / flexión), así que vuelven a `strength`.
// Solo toca esos dos slugs: no reclasifica los saltos de pierna/glúteo (siguen cardio)
// ni el cardio legítimo (cinta, trail running). Es idempotente.
import { detectCategory } from '@/domain/exerciseCategory'
import type {
  CategoryMigrationTable,
  ExerciseCategoryRow,
} from './reclassifyRowExercises'

const PUSH_STRENGTH_SLUGS = new Set([
  'chest-push-with-run-release',
  'incline-push-up-depth-jump',
])

// Devuelve cuántas filas cambió; un segundo pase sobre las mismas filas devuelve 0.
export const reclassifyChestPushExercises = async (
  table: CategoryMigrationTable,
): Promise<number> => {
  const rows: ExerciseCategoryRow[] = await table.toArray()
  let changed = 0
  for (const row of rows) {
    if (row.category !== 'cardio' || !PUSH_STRENGTH_SLUGS.has(row.slug)) continue
    const category = detectCategory(row.name, row.slug, row.externalId)
    if (category === 'cardio') continue
    await table.update(row.id, { category })
    changed += 1
  }
  return changed
}
