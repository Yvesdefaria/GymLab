import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, filterExercises, type ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import type { Equipment, Exercise } from '@/domain/types'

const mk = (id: number, muscleGroup: Exercise['muscleGroup'], zones?: string[], equipment: Equipment = 'barra'): Exercise =>
  ({ id, slug: `ex-${id}`, name: `Ejercicio ${id}`, muscleGroup, equipment, instructions: '', muscleZones: zones as Exercise['muscleZones'] })

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

// F66: el equipamiento disponible es una preferencia persistida («mi gym»), no un filtro efímero.
describe('filterExercises por equipamiento disponible', () => {
  const barra = mk(10, 'pecho', undefined, 'barra')
  const mancuernas = mk(11, 'pecho', undefined, 'mancuernas')
  const banda = mk(12, 'espalda', undefined, 'banda')
  const pesoCorporal = mk(13, 'abdomen', undefined, 'peso corporal')
  const catalog = [barra, mancuernas, banda, pesoCorporal]

  it('sin equipamiento declarado no filtra: aparece todo', () => {
    const r = filterExercises(catalog, EMPTY_FILTERS, new Set(), [])
    expect(r.map((e) => e.id)).toEqual([10, 11, 12, 13])
  })

  it('filtra a los ejercicios cuyo equipo está en la lista disponible', () => {
    const r = filterExercises(catalog, EMPTY_FILTERS, new Set(), ['barra', 'mancuernas'])
    expect(r.map((e) => e.id).sort()).toEqual([10, 11])
  })

  it('un solo equipo disponible deja solo sus ejercicios', () => {
    const r = filterExercises(catalog, EMPTY_FILTERS, new Set(), ['peso corporal'])
    expect(r.map((e) => e.id)).toEqual([13])
  })

  it('declarar todos los equipos equivale a no filtrar', () => {
    const all: Equipment[] = ['barra', 'mancuernas', 'banda', 'peso corporal']
    const r = filterExercises(catalog, EMPTY_FILTERS, new Set(), all)
    expect(r.map((e) => e.id)).toEqual([10, 11, 12, 13])
  })

  it('se combina con el resto de filtros (músculo)', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, muscle: 'pecho' }
    const r = filterExercises(catalog, f, new Set(), ['mancuernas'])
    expect(r.map((e) => e.id)).toEqual([11])
  })

  it('un equipamiento no disponible no vacía la lista si hay otros válidos', () => {
    const r = filterExercises(catalog, EMPTY_FILTERS, new Set(), ['kettlebell', 'banda'])
    expect(r.map((e) => e.id)).toEqual([12])
  })
})

// La consulta efímera de equipo (selector de sesión) es otra cosa que «mi gym»: es exacta,
// se resetea al salir y por eso sobrevive aunque el catálogo no filtre por disponibilidad.
describe('filterExercises por consulta efímera de equipo', () => {
  const barra = mk(10, 'pecho', undefined, 'barra')
  const mancuernas = mk(11, 'pecho', undefined, 'mancuernas')
  const catalog = [barra, mancuernas]

  it('sin consulta no filtra', () => {
    const r = filterExercises(catalog, EMPTY_FILTERS, new Set())
    expect(r.map((e) => e.id)).toEqual([10, 11])
  })

  it('la consulta es exacta: un solo equipo', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, equipmentQuery: 'mancuernas' }
    const r = filterExercises(catalog, f, new Set())
    expect(r.map((e) => e.id)).toEqual([11])
  })

  it('consulta efímera y equipamiento declarado se combinan', () => {
    const f: ExerciseCatalogFilters = { ...EMPTY_FILTERS, equipmentQuery: 'barra' }
    const r = filterExercises(catalog, f, new Set(), ['barra', 'mancuernas'])
    expect(r.map((e) => e.id)).toEqual([10])
  })
})
