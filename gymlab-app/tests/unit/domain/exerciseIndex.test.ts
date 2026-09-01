// Tests del índice alfabético de ejercicios: orden localizado y agrupación por inicial.
import { describe, expect, it } from 'vitest'
import {
  charInitial,
  groupExercisesByInitial,
  sortAndGroupExercises,
  sortExercisesAlphabetically,
} from '@/domain/exerciseIndex'
import type { Exercise } from '@/domain/types'

const makeExercise = (id: number, name: string): Exercise => ({
  id,
  slug: `ex-${id}`,
  name,
  muscleGroup: 'pecho',
  equipment: 'barra',
  instructions: '',
  category: 'strength',
})

describe('charInitial', () => {
  it('normaliza la inicial: quita acentos pero conserva la eñe', () => {
    expect(charInitial('extensión', 'es')).toBe('E')
    expect(charInitial('ñu press', 'es')).toBe('Ñ')
    expect(charInitial('zancadas', 'es')).toBe('Z')
  })

  it('agrupa los nombres que no empiezan por letra bajo «#»', () => {
    expect(charInitial('3/4 abdominal', 'es')).toBe('#')
    expect(charInitial('12 repeticiones', 'es')).toBe('#')
    expect(charInitial('(press) militar', 'es')).toBe('#')
  })
})

describe('sortExercisesAlphabetically', () => {
  it('ordena por nombre ignorando mayúsculas y sin mutar la entrada', () => {
    const input = [
      makeExercise(1, 'Zancadas'),
      makeExercise(2, 'aperturas con mancuernas'),
      makeExercise(3, 'Press militar'),
    ]
    const result = sortExercisesAlphabetically(input, 'es')
    expect(result.map((e) => e.name)).toEqual([
      'aperturas con mancuernas',
      'Press militar',
      'Zancadas',
    ])
    expect(input.map((e) => e.name)).toEqual([
      'Zancadas',
      'aperturas con mancuernas',
      'Press militar',
    ])
  })

  it('trata los acentos como su letra base (é ≈ e)', () => {
    const result = sortExercisesAlphabetically(
      [makeExercise(1, 'Éxtensión de piernas'), makeExercise(2, 'Elevaciones laterales')],
      'es',
    )
    expect(result.map((e) => e.name)).toEqual(['Elevaciones laterales', 'Éxtensión de piernas'])
  })

  it('coloca la eñe tras la ene en español', () => {
    const result = sortExercisesAlphabetically(
      [makeExercise(1, 'Ñu press'), makeExercise(2, 'Peso muerto'), makeExercise(3, 'Noqueo')],
      'es',
    )
    expect(result.map((e) => e.name)).toEqual(['Noqueo', 'Ñu press', 'Peso muerto'])
  })
})

describe('groupExercisesByInitial', () => {
  it('agrupa por inicial en mayúscula y cuenta los miembros', () => {
    const sections = groupExercisesByInitial(
      sortExercisesAlphabetically(
        [
          makeExercise(1, 'Zancadas'),
          makeExercise(2, 'Aperturas con mancuernas'),
          makeExercise(3, 'Aperturas con barra'),
          makeExercise(4, 'Sentadilla'),
        ],
        'es',
      ),
      'es',
    )
    expect(sections.map((s) => s.letter)).toEqual(['A', 'S', 'Z'])
    expect(sections.map((s) => s.count)).toEqual([2, 1, 1])
  })

  it('une las iniciales acentuadas a su letra base', () => {
    const sections = groupExercisesByInitial(
      sortExercisesAlphabetically(
        [
          makeExercise(1, 'Éxtensión de piernas'),
          makeExercise(2, 'Elevaciones laterales'),
        ],
        'es',
      ),
      'es',
    )
    expect(sections).toHaveLength(1)
    expect(sections[0].letter).toBe('E')
    expect(sections[0].count).toBe(2)
  })

  it('conserva la eñe como letra propia', () => {
    const sections = groupExercisesByInitial(
      sortExercisesAlphabetically(
        [makeExercise(1, 'Ñu press'), makeExercise(2, 'Peso muerto'), makeExercise(3, 'Noqueo')],
        'es',
      ),
      'es',
    )
    expect(sections.map((s) => s.letter)).toEqual(['N', 'Ñ', 'P'])
  })

  it('devuelve la lista vacía sin ejercicios', () => {
    expect(groupExercisesByInitial([], 'es')).toEqual([])
  })

  it('agrupa los nombres no alfabéticos bajo «#»', () => {
    const sections = groupExercisesByInitial(
      sortExercisesAlphabetically(
        [makeExercise(1, '3/4 abdominal'), makeExercise(2, 'Aperturas'), makeExercise(3, 'Sentadilla')],
        'es',
      ),
      'es',
    )
    expect(sections.map((s) => s.letter)).toEqual(['#', 'A', 'S'])
  })
})

describe('sortAndGroupExercises', () => {
  it('ordena y agrupa en un solo paso', () => {
    const sections = sortAndGroupExercises(
      [makeExercise(1, 'Sentadilla'), makeExercise(2, 'Aperturas')],
      'es',
    )
    expect(sections.map((s) => s.letter)).toEqual(['A', 'S'])
    expect(sections[0].items[0].slug).toBe('ex-2')
  })
})