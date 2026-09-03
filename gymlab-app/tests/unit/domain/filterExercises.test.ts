import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, filterExercises, type ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import type { Exercise } from '@/domain/types'

const mk = (id: number, muscleGroup: Exercise['muscleGroup'], zones?: string[]): Exercise =>
  ({ id, slug: `ex-${id}`, name: `Ejercicio ${id}`, muscleGroup, equipment: 'barra', instructions: '', muscleZones: zones as Exercise['muscleZones'] })

const ex1 = mk(1, 'pierna', ['pierna:cuadriceps', 'pierna:femoral'])
const ex2 = mk(2, 'pierna', ['pierna:femoral'])
const ex3 = mk(3, 'pecho', ['pecho:superior'])
const all = [ex1, ex2, ex3]

describe('filterExercises por zona', () => {
  it('filtra por zona específica', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, zone: 'pierna:cuadriceps' }
    const r = filterExercises(all, f, new Set())
    expect(r.map((e) => e.id)).toEqual([1])
  })

  it('un ejercicio con varias zonas sale al filtrar por cualquiera', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, zone: 'pierna:femoral' }
    const r = filterExercises(all, f, new Set())
    expect(r.map((e) => e.id).sort()).toEqual([1, 2])
  })

  it('sin zona activa no filtra por zona', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS }
    const r = filterExercises(all, f, new Set())
    expect(r).toHaveLength(3)
  })

  it('combina grupo principal y zona', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, muscle: 'pierna', zone: 'pierna:femoral' }
    const r = filterExercises(all, f, new Set())
    expect(r.map((e) => e.id).sort()).toEqual([1, 2])
  })
})
