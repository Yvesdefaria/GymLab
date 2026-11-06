import { describe, expect, it } from 'vitest'
import { routineCover } from '@/components/routines/routineMeta'
import type { Routine } from '@/domain/types'

const routine = (overrides: Partial<Routine> = {}): Routine => ({
  id: 1,
  slug: 'ppl-volumen',
  title: 'PPL Volumen',
  objective: 'volumen',
  level: 'intermedio',
  description: '',
  daysCount: 3,
  ...overrides,
})

const FALLBACKS = ['/images/routines/5x5-stronglifts.jpg', '/images/routines/bro-split.jpg']

describe('routineCover', () => {
  it('usa la portada local de la rutina', () => {
    expect(routineCover(routine({ imageUrl: '/images/routines/ppl-volumen.jpg' }), FALLBACKS)).toBe(
      '/images/routines/ppl-volumen.jpg',
    )
  })

  it('no deja que una portada restaurada apunte a un host externo', () => {
    expect(
      routineCover(routine({ imageUrl: 'https://collector.example/routine.png' }), FALLBACKS),
    ).toBe('/images/routines/bro-split.jpg')
  })

  it('tampoco elige un fallback contaminado', () => {
    expect(
      routineCover(
        routine({ id: 0, imageUrl: undefined }),
        ['https://collector.example/x.png', '/images/routines/bro-split.jpg'],
      ),
    ).toBe('/images/routines/bro-split.jpg')
  })

  it('sin fallbacks cae al default empaquetado', () => {
    expect(routineCover(routine({ imageUrl: 'javascript:alert(1)' }), [])).toBe(
      '/images/routines/default.jpg',
    )
  })
})
