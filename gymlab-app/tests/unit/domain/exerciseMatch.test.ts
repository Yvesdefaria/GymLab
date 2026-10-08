/**
 * Tests del matcher puro de ejercicios (F81): normalización (acentos, guiones,
 * paréntesis), índice por nombre/slug/externalId y fallback por tokens ordenados.
 */
import { describe, expect, it } from 'vitest'
import { buildExerciseMatcher, normalize, tokenKey } from '@/domain/exerciseMatch'
import type { Exercise } from '@/domain/types'

const makeExercise = (over: Partial<Exercise> & { id: number; name: string }): Exercise => ({
  slug: `slug-${over.id}`,
  muscleGroup: 'pecho',
  equipment: ['barra'],
  instructions: '',
  ...over,
})

describe('normalize', () => {
  it('quita diacríticos, baja a minúsculas y colapsa no-alfanuméricos', () => {
    expect(normalize('  Sentadilla BÚLGARA (con barra) ')).toBe('sentadilla bulgara con barra')
    expect(normalize('Barbell_Bench-Press')).toBe('barbell bench press')
  })
})

describe('tokenKey', () => {
  it('ordena los tokens alfabéticamente', () => {
    expect(tokenKey('Barbell Bench Press')).toBe('barbell bench press')
    expect(tokenKey('Bench Press (Barbell)')).toBe('barbell bench press')
  })
})

describe('buildExerciseMatcher', () => {
  it('matchea por nombre exacto normalizado (acentos incluidos)', () => {
    const matcher = buildExerciseMatcher([
      makeExercise({ id: 27, name: 'Sentadilla búlgara', slug: 'sentadilla-bulgara' }),
    ])
    expect(matcher('Sentadilla bulgara')).toBe(27)
    expect(matcher('SENTADILLA BÚLGARA')).toBe(27)
    expect(matcher('sentadilla búlgara')).toBe(27)
  })

  it('matchea por externalId con guiones bajos y por slug kebab', () => {
    const matcher = buildExerciseMatcher([
      makeExercise({
        id: 1,
        name: 'Press de pecho con barra',
        slug: 'press-de-pecho-con-barra',
        externalId: 'Barbell_Bench_Press',
      }),
    ])
    expect(matcher('Barbell_Bench_Press')).toBe(1)
    expect(matcher('barbell bench press')).toBe(1)
    expect(matcher('Press de pecho con barra')).toBe(1)
    expect(matcher('press-de-pecho-con-barra')).toBe(1)
  })

  it('cae al fallback por tokens ordenados (paréntesis y orden distinto)', () => {
    const matcher = buildExerciseMatcher([
      makeExercise({ id: 3, name: 'Bench Press (Barbell)', slug: 'bench-press-barbell' }),
    ])
    expect(matcher('Barbell Bench Press')).toBe(3)
    expect(matcher('press bench barbell')).toBe(3)
  })

  it('devuelve null para un nombre desconocido o vacío', () => {
    const matcher = buildExerciseMatcher([makeExercise({ id: 1, name: 'Dominadas' })])
    expect(matcher('Ejercicio inexistente')).toBeNull()
    expect(matcher('')).toBeNull()
    expect(matcher('   ')).toBeNull()
  })

  it('en colisión de clave gana el id más bajo', () => {
    const matcher = buildExerciseMatcher([
      makeExercise({ id: 5, name: 'Press banca' }),
      makeExercise({ id: 2, name: 'press-banca' }),
    ])
    expect(matcher('Press banca')).toBe(2)
    expect(matcher('PRESS BANCA')).toBe(2)
  })

  it('en colisión por tokens gana el id más bajo aunque el orden cambie', () => {
    const matcher = buildExerciseMatcher([
      makeExercise({ id: 4, name: 'Press Banca Plano' }),
      makeExercise({ id: 2, name: 'Banca Plano Press' }),
    ])
    // La query no coincide exactamente con ninguna clave: cae al índice por tokens.
    expect(matcher('Plano Press Banca')).toBe(2)
  })

  it('ignora claves vacías (externalId ausente) y no matchea la cadena vacía', () => {
    const matcher = buildExerciseMatcher([
      makeExercise({ id: 9, name: 'Remo con barra', externalId: '' }),
      makeExercise({ id: 10, name: 'Jalón al pecho', externalId: undefined }),
    ])
    expect(matcher('')).toBeNull()
    expect(matcher('Remo con barra')).toBe(9)
    expect(matcher('Jalon al pecho')).toBe(10)
  })
})
