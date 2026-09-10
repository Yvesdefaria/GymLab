// Tests de cloneRoutineDraft (mápeador puro de clonación de rutinas predefinidas).
import { describe, expect, it } from 'vitest'
import { cloneRoutineDraft, reorderArray } from '@/domain/routines'
import type { RoutineDay, RoutineItem } from '@/domain/types'

const makeSource = (overrides?: Partial<{ id: number; title: string; objective: string; level: string; description: string; imageUrl: string }>) => ({
  id: 5,
  slug: 'ppl-volumen',
  title: 'PPL Volumen',
  objective: 'volumen' as const,
  level: 'intermedio' as const,
  description: 'Rutina PPL de 4 días',
  daysCount: 2,
  imageUrl: 'https://example.com/img.webp',
  ...overrides,
})

const makeDays = (count = 2): RoutineDay[] =>
  Array.from({ length: count }, (_, i) => ({
    id: 100 + i,
    routineId: 5,
    dayIndex: i,
    name: `Día ${i + 1}`,
  }))

const makeItems = (): RoutineItem[] => [
  { id: 200, routineDayId: 100, exerciseId: 10, targetSets: 4, targetReps: 8, restSec: 120, order: 1, notes: 'Controlado' },
  { id: 201, routineDayId: 100, exerciseId: 20, targetSets: 3, targetReps: 12, restSec: 90, order: 2, supersetGroup: 'A' },
  { id: 202, routineDayId: 101, exerciseId: 30, targetSets: 3, targetReps: 10, restSec: 90, order: 1 },
]

describe('cloneRoutineDraft', () => {
  it('copia title, objective, level, description del source', () => {
    const source = makeSource()
    const draft = cloneRoutineDraft(source, makeDays(), makeItems())
    expect(draft.title).toBe('PPL Volumen')
    expect(draft.objective).toBe('volumen')
    expect(draft.level).toBe('intermedio')
    expect(draft.description).toBe('Rutina PPL de 4 días')
  })

  it('set basedOnId = source.id', () => {
    const source = makeSource({ id: 7 })
    const draft = cloneRoutineDraft(source, makeDays(), makeItems())
    expect(draft.basedOnId).toBe(7)
  })

  it('excluye imageUrl del draft', () => {
    const source = makeSource()
    const draft = cloneRoutineDraft(source, makeDays(), makeItems())
    expect(draft).not.toHaveProperty('imageUrl')
  })

  it('slug = title (resolve uniqueSlug en createRoutine)', () => {
    const source = makeSource()
    const draft = cloneRoutineDraft(source, makeDays(), makeItems())
    expect(draft.slug).toBe('PPL Volumen')
  })

  it('re-indexa day order 1-based secuencial', () => {
    const days = makeDays(3)
    const draft = cloneRoutineDraft(makeSource(), days, makeItems())
    // Los días no tienen campo order en RoutineDayDraft — order se establece por el índice.
    // Verificamos que los días están en orden y con la misma cantidad.
    expect(draft.days).toHaveLength(3)
    expect(draft.days[0].name).toBe('Día 1')
    expect(draft.days[1].name).toBe('Día 2')
    expect(draft.days[2].name).toBe('Día 3')
  })

  it('re-indexa item order 1-based por día', () => {
    const days = makeDays(2)
    const items = makeItems()
    const draft = cloneRoutineDraft(makeSource(), days, items)
    // Día 100: items con order 1,2 → 1,2
    expect(draft.days[0].items).toHaveLength(2)
    expect(draft.days[0].items[0].order).toBe(1)
    expect(draft.days[0].items[1].order).toBe(2)
    // Día 101: item con order 1 → 1
    expect(draft.days[1].items).toHaveLength(1)
    expect(draft.days[1].items[0].order).toBe(1)
  })

  it('copia targetSets, targetReps, restSec, supersetGroup, notes de cada item', () => {
    const days = makeDays(2)
    const items = makeItems()
    const draft = cloneRoutineDraft(makeSource(), days, items)
    expect(draft.days[0].items[0]).toMatchObject({
      exerciseId: 10,
      targetSets: 4,
      targetReps: 8,
      restSec: 120,
      order: 1,
      notes: 'Controlado',
    })
    expect(draft.days[0].items[1]).toMatchObject({
      exerciseId: 20,
      targetSets: 3,
      targetReps: 12,
      restSec: 90,
      supersetGroup: 'A',
    })
  })

  it('no copia exerciseName (campo enriquecido de UI, no del draft)', () => {
    const days = makeDays(2)
    const items = makeItems()
    const draft = cloneRoutineDraft(makeSource(), days, items)
    expect(draft.days[0].items[0]).not.toHaveProperty('exerciseName')
  })

  it('maneja lista vacía de items', () => {
    const source = makeSource()
    const days = makeDays(1)
    const draft = cloneRoutineDraft(source, days, [])
    expect(draft.days).toHaveLength(1)
    expect(draft.days[0].items).toHaveLength(0)
  })

  it('maneja un solo día con un solo item', () => {
    const source = makeSource()
    const days = makeDays(1)
    const items: RoutineItem[] = [
      { id: 300, routineDayId: 100, exerciseId: 10, targetSets: 3, targetReps: 10, restSec: 60, order: 5 },
    ]
    const draft = cloneRoutineDraft(source, days, items)
    expect(draft.days).toHaveLength(1)
    expect(draft.days[0].items).toHaveLength(1)
    expect(draft.days[0].items[0].order).toBe(1) // re-indexado a 1
  })
})

describe('reorderArray (reorderDays)', () => {
  it('reordena correctamente', () => {
    const arr = ['A', 'B', 'C']
    expect(reorderArray(arr, 2, 0)).toEqual(['C', 'A', 'B'])
  })

  it('noop si fromIndex === toIndex', () => {
    const arr = ['A', 'B', 'C']
    expect(reorderArray(arr, 1, 1)).toEqual(['A', 'B', 'C'])
  })

  it('noop si fromIndex < 0', () => {
    const arr = ['A', 'B']
    expect(reorderArray(arr, -1, 0)).toEqual(['A', 'B'])
  })

  it('noop si toIndex < 0', () => {
    const arr = ['A', 'B']
    expect(reorderArray(arr, 0, -1)).toEqual(['A', 'B'])
  })
})
