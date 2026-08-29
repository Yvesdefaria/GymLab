import { describe, it, expect } from 'vitest'
import { uniqueSlug, routineDraftFrom, type RoutineDraftDay } from '@/domain/routines'

describe('uniqueSlug', () => {
  it('slugifica el título base (NFD, espacios)', () => {
    expect(uniqueSlug('  Push Day  ', [])).toBe('push-day')
  })

  it('añade sufijo numérico cuando el slug ya existe', () => {
    expect(uniqueSlug('Push Day', ['push-day'])).toBe('push-day-2')
    expect(uniqueSlug('Push Day', ['push-day', 'push-day-2'])).toBe('push-day-3')
  })

  it('ignora el slug propio en modo edición', () => {
    expect(uniqueSlug('Push Day', ['push-day', 'push-day-2'], 'push-day')).toBe('push-day')
  })
})

describe('routineDraftFrom', () => {
  const days: RoutineDraftDay[] = [
    {
      name: 'Pierna',
      items: [
        {
          exerciseId: 1,
          exerciseName: 'Sentadilla',
          targetSets: 4,
          targetReps: 8,
          restSec: 120,
          supersetGroup: 'A',
        },
        { exerciseId: 2, exerciseName: 'Peso muerto', targetSets: 3, targetReps: 5, restSec: 180 },
      ],
    },
    { name: '   ', items: [] },
  ]

  it('mapea metadatos recortados, orden 1-based y fallback de nombre de día', () => {
    const draft = routineDraftFrom({
      title: '  Full Body  ',
      objective: 'fuerza',
      level: 'intermedio',
      description: '  x  ',
      days,
    })
    expect(draft.title).toBe('Full Body')
    expect(draft.description).toBe('x')
    expect(draft.objective).toBe('fuerza')
    expect(draft.level).toBe('intermedio')
    expect(draft.days[1].name).toBe('Día 2')
  })

  it('preserva serie/descanso y supersetGroup con order incremental', () => {
    const draft = routineDraftFrom({
      title: 'Test',
      objective: 'volumen',
      level: 'principiante',
      description: '',
      days,
    })
    expect(draft.days[0].items).toHaveLength(2)
    expect(draft.days[0].items[0]).toMatchObject({
      exerciseId: 1,
      targetSets: 4,
      targetReps: 8,
      restSec: 120,
      supersetGroup: 'A',
      order: 1,
    })
    expect(draft.days[0].items[1]).toMatchObject({ order: 2, supersetGroup: undefined })
  })
})