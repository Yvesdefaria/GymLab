// F132.7: orden canónico de guías y elección de la destacada para el índice editorial.
import { describe, expect, it } from 'vitest'
import { splitGuides } from '@/domain/guideIndex'
import type { Guide } from '@/domain/types'

const guide = (id: number, category: Guide['category'], title: string): Guide => ({
  id,
  slug: `guia-${id}`,
  category,
  title,
  summary: '',
  keyPoints: [],
  sourceUrl: '',
})

describe('splitGuides', () => {
  it('elige la primera guía del primer grupo canónico y la saca de la lista', () => {
    const guides = [
      guide(1, 'nutricion', 'Proteína'),
      guide(2, 'entrenamiento', 'Progresión'),
      guide(3, 'entrenamiento', 'Volumen'),
      guide(4, 'dietas', 'Déficit'),
    ]

    const { featured, rest } = splitGuides(guides)

    expect(featured?.title).toBe('Progresión')
    expect(rest.map((g) => g.title)).toEqual(['Volumen', 'Proteína', 'Déficit'])
  })

  it('respeta el orden del repositorio dentro de cada categoría', () => {
    const guides = [
      guide(1, 'recuperacion', 'Sueño'),
      guide(2, 'entrenamiento', 'B'),
      guide(3, 'entrenamiento', 'A'),
    ]

    const { featured, rest } = splitGuides(guides)

    expect(featured?.title).toBe('B')
    expect(rest.map((g) => g.title)).toEqual(['A', 'Sueño'])
  })

  it('sin guías devuelve featured undefined y lista vacía', () => {
    const { featured, rest } = splitGuides([])
    expect(featured).toBeUndefined()
    expect(rest).toEqual([])
  })

  it('con una sola guía la destacada es esa y la lista queda vacía', () => {
    const { featured, rest } = splitGuides([guide(1, 'mujer', 'Fase lútea')])
    expect(featured?.title).toBe('Fase lútea')
    expect(rest).toEqual([])
  })
})
