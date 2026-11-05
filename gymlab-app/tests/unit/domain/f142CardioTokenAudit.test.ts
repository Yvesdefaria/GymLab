/**
 * F142 — auditoría de tokens de cardio (S1–S4) sobre el catálogo real.
 * Verificación independiente: no reutiliza los tests del writer.
 */
import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'
import { db } from '@/data/repositories/dexie/db'
import { detectCategory, withCategory } from '@/domain/exerciseCategory'
import {
  countVolumeSets,
  type VolumeSetSample,
  type VolumeWorkoutSample,
} from '@/domain/volumeModel'
import { reclassifyChestPushExercises } from '@/data/migrations/reclassifyChestPushExercises'
import { reclassifyRowExercises } from '@/data/migrations/reclassifyRowExercises'
import type {
  CategoryMigrationTable,
  ExerciseCategoryRow,
} from '@/data/migrations/reclassifyRowExercises'
import type { Exercise } from '@/domain/types'

const catalog = [...seedExercises, ...seedExercisesExtra]

const rowOf = (slug: string): Exercise => {
  const row = catalog.find((ex) => ex.slug === slug)
  if (!row) throw new Error(`Falta ${slug} en el catálogo`)
  return row
}

const categoryOf = (slug: string): string | undefined => withCategory(rowOf(slug)).category

// S1/S2 — los dos únicos slugs que deben salir de cardio.
const INTENDED_STRENGTH = ['chest-push-with-run-release', 'incline-push-up-depth-jump'] as const

// S3 — los 20 saltos de pierna/glúteo que conservan cardio.
const LEG_JUMPS = [
  'bench-jump', 'box-jump-multiple-response', 'depth-jump-leap', 'dumbbell-seated-box-jump',
  'freehand-jump-squat', 'front-box-jump', 'knee-tuck-jump', 'kneeling-jump-squat',
  'lateral-box-jump', 'linear-depth-jump', 'rocket-jump', 'rope-jumping', 'scissors-jump',
  'side-standing-long-jump', 'single-leg-stride-jump', 'split-jump', 'standing-long-jump',
  'star-jump', 'stride-jump-crossover', 'weighted-jump-squat',
] as const

const volumeFor = (slug: string) => {
  const exercise = withCategory(rowOf(slug))
  const workouts = new Map<number, VolumeWorkoutSample>([[1, { localDate: '2026-11-05' }]])
  const sets: VolumeSetSample[] = [
    { workoutId: 1, exerciseId: exercise.id, completed: true, reps: 10 },
  ]
  return countVolumeSets(sets, workouts, new Map([[exercise.id, exercise]]), '2026-10-09', '2026-11-05')
}

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

const migrationRow = (
  id: number,
  name: string,
  slug: string,
  category?: ExerciseCategoryRow['category'],
): ExerciseCategoryRow => ({ id, name, slug, category })

describe('F142 S1/S2 — detección', () => {
  it.each(INTENDED_STRENGTH)('%s es strength en el catálogo', (slug) => {
    const row = rowOf(slug)
    expect(detectCategory(row.name, row.slug, row.externalId)).toBe('strength')
    expect(categoryOf(slug)).toBe('strength')
  })

  it('el token suelto run ya no implica cardio; running y treadmill sí', () => {
    expect(detectCategory('Run', 'run')).toBe('strength')
    expect(detectCategory('Running', 'running')).toBe('cardio')
    expect(detectCategory('Treadmill', 'treadmill')).toBe('cardio')
  })

  it('running-treadmill y trail-running-walking siguen cardio', () => {
    expect(categoryOf('running-treadmill')).toBe('cardio')
    expect(categoryOf('trail-running-walking')).toBe('cardio')
  })
})

describe('F142 S1 — volumen de pecho', () => {
  it('chest-push-with-run-release suma una serie directa a pecho igual que chest-push-from-3-point-stance', () => {
    const chestPush = volumeFor('chest-push-with-run-release')
    const threePoint = volumeFor('chest-push-from-3-point-stance')
    expect(chestPush.total).toBe(1)
    expect(chestPush.direct.pecho).toBe(1)
    expect(threePoint.direct.pecho).toBe(1)
  })
})

describe('F142 S2 — incline-push-up-depth-jump', () => {
  it('es strength pero F138 lo excluye del volumen por salto (esperado)', () => {
    expect(categoryOf('incline-push-up-depth-jump')).toBe('strength')
    const counts = volumeFor('incline-push-up-depth-jump')
    expect(counts.excluded).toBe(1)
    expect(counts.direct.pecho).toBeUndefined()
  })
})

describe('F142 S3 — saltos y cardio legítimo', () => {
  it.each(LEG_JUMPS)('%s existe y sigue cardio', (slug) => {
    expect(categoryOf(slug)).toBe('cardio')
  })
})

describe('F142 S4 — migración v20', () => {
  it('solo pasa cardio→strength los dos slugs; idempotente y sin tocar el resto', async () => {
    const rows: ExerciseCategoryRow[] = [
      migrationRow(1, 'Empuje de pecho con salida corriendo', 'chest-push-with-run-release', 'cardio'),
      migrationRow(2, 'Salto de profundidad con flexión inclinada', 'incline-push-up-depth-jump', 'cardio'),
      migrationRow(3, 'Salto de profundidad con flexión inclinada', 'incline-push-up-depth-jump', 'strength'),
      migrationRow(4, 'Empuje de pecho con salida corriendo', 'chest-push-with-run-release', undefined),
      migrationRow(5, 'Salto de profundidad con flexión inclinada', 'incline-push-up-depth-jump', 'mobility'),
      migrationRow(6, 'Banca salto', 'bench-jump', 'cardio'),
      migrationRow(7, 'Salto de cuerda', 'rope-jumping', 'cardio'),
      migrationRow(8, 'Correr, cinta', 'running-treadmill', 'cardio'),
      migrationRow(9, 'Trail Running/Walking', 'trail-running-walking', 'cardio'),
      migrationRow(10, 'Bent Over Two-Dumbbell Row', 'bent-over-two-dumbbell-row', 'cardio'),
    ]
    const { table, updates } = makeTable(rows)
    await expect(reclassifyChestPushExercises(table)).resolves.toBe(2)
    expect(updates).toEqual([
      { id: 1, category: 'strength' },
      { id: 2, category: 'strength' },
    ])
    await expect(reclassifyChestPushExercises(table)).resolves.toBe(0)
    expect(updates).toHaveLength(2)
    expect(rows[2].category).toBe('strength')
    expect(rows[3].category).toBeUndefined()
    expect(rows[4].category).toBe('mobility')
    expect(rows[5].category).toBe('cardio')
    expect(rows[6].category).toBe('cardio')
    expect(rows[7].category).toBe('cardio')
    expect(rows[8].category).toBe('cardio')
    expect(rows[9].category).toBe('cardio')
  })

  it('v20 está registrada en Dexie', () => {
    expect(db.verno).toBeGreaterThanOrEqual(20)
  })

  it('v19 sigue reclasificando remos', async () => {
    const { table } = makeTable([
      migrationRow(20, 'Bent Over Two-Dumbbell Row', 'bent-over-two-dumbbell-row', 'cardio'),
    ])
    await expect(reclassifyRowExercises(table)).resolves.toBe(1)
  })
})
