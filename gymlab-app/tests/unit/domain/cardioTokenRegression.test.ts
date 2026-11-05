/**
 * F143/R3-003 — regresión durable de los tokens de cardio.
 *
 * Compara el heurístico actual contra el anterior a F142 (commit `0fb98ab7^`)
 * sobre el catálogo completo: seed (873 filas) y catálogo remoto (821 filas).
 * El único cambio permitido es el de los dos empujes de pecho decididos en F142.
 * Si una fila futura con `run`/`jump`/`ski` cambia de categoría sin actualizar
 * esta lista, el test falla y obliga a revisar la decisión.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'
import { detectCategory } from '@/domain/exerciseCategory'
import type { ExerciseCategory } from '@/domain/types'

const OLD_CARDIO_RE =
  /\b(cardio|running|run|jog|rowing|bike|bicycle|cycling|jump|burpee|ski|swim|treadmill|elliptical|stair|stepper|cardio)\b|cardio|aerobic|hiit|sprint|jumping|assault|skier/i
const OLD_MOBILITY_RE = /\b(mobility|movilidad|mobility drill)\b|movilidad|mobility/i
const OLD_STRETCH_RE =
  /\b(stretch|stretching|smr|foam|roll|roller|flexibility|yoga|flexib|psoas|calves stretch|quad stretch|hamstring stretch)\b|estiramiento|estiramientos|flexibil|tibialis-smr|release/i

const oldDetect = (name: string, slug: string, externalId?: string): ExerciseCategory => {
  const haystack = `${name} ${slug} ${externalId ?? ''}`
  if (OLD_CARDIO_RE.test(haystack)) return 'cardio'
  if (OLD_MOBILITY_RE.test(haystack)) return 'mobility'
  if (OLD_STRETCH_RE.test(haystack)) return 'stretch'
  return 'strength'
}

interface CatalogRow {
  name: string
  slug: string
  externalId?: string
}

const changedSlugs = (rows: readonly CatalogRow[]): string[] =>
  rows
    .filter(
      (row) =>
        detectCategory(row.name, row.slug, row.externalId) !==
        oldDetect(row.name, row.slug, row.externalId),
    )
    .map((row) => row.slug)
    .sort()

const EXPECTED = ['chest-push-with-run-release', 'incline-push-up-depth-jump']

const seed: CatalogRow[] = [...seedExercises, ...seedExercisesExtra]
const remotePath = fileURLToPath(
  new URL('../../../public/catalog/exercises-v2.json', import.meta.url),
)
const remote = JSON.parse(readFileSync(remotePath, 'utf8')) as CatalogRow[]

describe('F143 — regresión de tokens de cardio', () => {
  it('el seed solo cambia los dos empujes de pecho', () => {
    expect(changedSlugs(seed)).toEqual(EXPECTED)
  })

  it('el catálogo remoto solo cambia los dos empujes de pecho', () => {
    expect(changedSlugs(remote)).toEqual(EXPECTED)
  })
})
