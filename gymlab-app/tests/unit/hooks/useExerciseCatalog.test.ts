// Tests del filtrado del catálogo de ejercicios (regresión del filtro «Con foto» eliminado en F93 #17
// y del filtro «Comunes» añadido en F93 #18).
import { describe, expect, it } from 'vitest'
import { COMMON_EXERCISE_SLUGS } from '@/domain/catalog'
import { EMPTY_FILTERS, filterExercises } from '@/hooks/useExerciseCatalog'
import type { Exercise } from '@/domain/types'

const makeExercise = (overrides: Partial<Exercise> & { id: number }): Exercise => ({
  slug: `ex-${overrides.id}`,
  name: `Ejercicio ${overrides.id}`,
  muscleGroup: 'pecho',
  equipment: 'barra',
  instructions: 'Instrucciones',
  ...overrides,
})

const withPhoto = makeExercise({ id: 1, name: 'Press con foto', imageUrls: ['/x.jpg'] })
const withoutPhoto = makeExercise({ id: 2, name: 'Sentadilla sin foto' })
const cardio = makeExercise({ id: 3, name: 'Press militar', muscleGroup: 'hombro', equipment: 'maquina' })

const all = [withPhoto, withoutPhoto, cardio]

describe('filterExercises', () => {
  it('sin criterios devuelve todos los ejercicios, incluidos los que no tienen foto', () => {
    // F93 #17: el filtro «Con foto» se eliminó; un ejercicio sin photo no debe descartarse.
    expect(filterExercises(all, EMPTY_FILTERS, new Set())).toEqual(all)
  })

  it('con otros criterios activos, los ejercicios sin foto siguen apareciendo', () => {
    const filters = { ...EMPTY_FILTERS, muscle: 'pecho' as const }
    const result = filterExercises(all, filters, new Set())
    expect(result.map((e) => e.id)).toEqual([1, 2])
  })

  it('el criterio de músculo sigue filtrando por grupo', () => {
    const filters = { ...EMPTY_FILTERS, muscle: 'hombro' as const }
    expect(filterExercises(all, filters, new Set()).map((e) => e.id)).toEqual([3])
  })

  it('el criterio de equipo sigue filtrando', () => {
    const filters = { ...EMPTY_FILTERS, equipment: 'barra' as const }
    expect(filterExercises(all, filters, new Set()).map((e) => e.id)).toEqual([1, 2])
  })

  it('el criterio de favoritos sigue filtrando por el set', () => {
    const filters = { ...EMPTY_FILTERS, onlyFavorites: true }
    expect(filterExercises(all, filters, new Set([1, 3])).map((e) => e.id)).toEqual([1, 3])
  })

  it('la búsqueda sigue coincidiendo por nombre', () => {
    const filters = { ...EMPTY_FILTERS, search: 'sentadilla' }
    expect(filterExercises(all, filters, new Set()).map((e) => e.id)).toEqual([2])
  })

  it('EMPTY_FILTERS no activa el filtro de comunes', () => {
    expect(EMPTY_FILTERS.onlyCommon).toBe(false)
  })
})

// Fixtures para el filtro «Comunes» (F93 #18): slugs que existen en COMMON_EXERCISE_SLUGS.
const commonSquat = makeExercise({ id: 10, slug: 'sentadilla-con-barra', name: 'Sentadilla con barra' })
const commonBench = makeExercise({ id: 11, slug: 'press-de-pecho-con-barra', name: 'Press de pecho con barra' })
const commonMilitary = makeExercise({ id: 12, slug: 'press-militar', name: 'Press militar', muscleGroup: 'hombro' })
const notCommon = makeExercise({ id: 13, slug: 'cruces-en-polea', name: 'Cruces en polea' })

describe('filterExercises con filtro de comunes', () => {
  it('limita al set canónico de slugs', () => {
    const filters = { ...EMPTY_FILTERS, onlyCommon: true }
    expect(filterExercises([commonSquat, notCommon, commonBench], filters, new Set()).map((e) => e.id)).toEqual([
      10, 11,
    ])
  })

  it('respeta el orden canónico definido en COMMON_EXERCISE_SLUGS', () => {
    const filters = { ...EMPTY_FILTERS, onlyCommon: true }
    const result = filterExercises([commonMilitary, commonSquat, commonBench], filters, new Set())
    const expectedOrder = COMMON_EXERCISE_SLUGS.filter((slug) => result.some((e) => e.slug === slug))
    expect(result.map((e) => e.slug)).toEqual(expectedOrder)
  })

  it('se combina con el filtro de músculo (AND)', () => {
    const filters = { ...EMPTY_FILTERS, onlyCommon: true, muscle: 'hombro' as const }
    expect(filterExercises([commonSquat, commonMilitary, commonBench], filters, new Set()).map((e) => e.id)).toEqual([
      12,
    ])
  })
})