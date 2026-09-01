// Tests del filtrado del catálogo de ejercicios (regresión del filtro «Con foto» eliminado en F93 #17).
import { describe, expect, it } from 'vitest'
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
})