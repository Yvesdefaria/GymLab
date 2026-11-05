/**
 * F143/S1 — Paridad del catálogo con F142 (baseline 45fcb55c): el split
 * STRETCH_CORE/EXPLICIT_STRETCH_RE no cambia ninguna fila del seed (873) ni del
 * catálogo remoto (821).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'
import { detectCategory } from '@/domain/exerciseCategory'
import type { ExerciseCategory } from '@/domain/types'

const F142_CARDIO =
  /\b(cardio|running|jog|rowing|bike|bicycle|cycling|jump|burpee|ski|swim|treadmill|elliptical|stair|stepper|cardio)\b|cardio|aerobic|hiit|sprint|jumping|assault|skier/i
const F142_PUSH = /\b(chest[-_ ]?push|push[-_ ]?ups?)\b|empuje de pecho/i
const F142_MOBILITY = /\b(mobility|movilidad|mobility drill)\b|movilidad|mobility/i
const F142_STRETCH =
  /\b(stretch|stretching|smr|foam|roll|roller|flexibility|yoga|flexib|psoas|calves stretch|quad stretch|hamstring stretch)\b|estiramiento|estiramientos|flexibil|tibialis-smr|release/i

const f142 = (name: string, slug: string, externalId?: string): ExerciseCategory => {
  const h = `${name} ${slug} ${externalId ?? ''}`
  if (F142_PUSH.test(h)) return 'strength'
  if (F142_CARDIO.test(h)) return 'cardio'
  if (F142_MOBILITY.test(h)) return 'mobility'
  if (F142_STRETCH.test(h)) return 'stretch'
  return 'strength'
}

interface Row {
  name: string
  slug: string
  externalId?: string
}

const seed: Row[] = [...seedExercises, ...seedExercisesExtra]
const remote = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../public/catalog/exercises-v2.json', import.meta.url)), 'utf8'),
) as Row[]

const changed = (rows: Row[]) =>
  rows
    .filter((row) => detectCategory(row.name, row.slug, row.externalId) !== f142(row.name, row.slug, row.externalId))
    .map((row) => row.slug)
    .sort()

describe('F143/S1 — paridad de catálogo con F142', () => {
  it('seed: 873 filas y ningún cambio', () => {
    expect(seed).toHaveLength(873)
    expect(changed(seed)).toEqual([])
  })

  it('remoto: 821 filas y ningún cambio', () => {
    expect(remote).toHaveLength(821)
    expect(changed(remote)).toEqual([])
  })

  it('S1: estiramiento/movilidad explícitos ganan; release no', () => {
    expect(detectCategory('Push-Up Stretch', 'push-up-stretch')).toBe('stretch')
    expect(detectCategory('Movilidad de hombro', 'push-up-mobility')).toBe('mobility')
    expect(detectCategory('Chest Push with Run Release', 'chest-push-with-run-release')).toBe('strength')
    expect(detectCategory('Chest Push Release', 'chest-push-release')).toBe('strength')
    expect(detectCategory('Incline Push-Up Depth Jump', 'incline-push-up-depth-jump')).toBe('strength')
  })

  it('S1: los saltos de pierna siguen cardio', () => {
    expect(detectCategory('Bench Jump', 'bench-jump')).toBe('cardio')
    expect(detectCategory('Rope Jumping', 'rope-jumping')).toBe('cardio')
  })
})
