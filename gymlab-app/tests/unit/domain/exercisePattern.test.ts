import { describe, expect, it } from 'vitest'
import { isCompoundExercise } from '@/domain/exercisePattern'

describe('isCompoundExercise', () => {
  it('detecta compuestos por nombre', () => {
    expect(isCompoundExercise('pecho', 'Press de banca')).toBe(true)
    expect(isCompoundExercise('pierna', 'Sentadilla con barra')).toBe(true)
    expect(isCompoundExercise('gluteo', 'Hip thrust')).toBe(true)
  })

  it('detecta aislamiento por nombre', () => {
    expect(isCompoundExercise('pierna', 'Curl femoral')).toBe(false)
    expect(isCompoundExercise('hombro', 'Elevación lateral')).toBe(false)
    expect(isCompoundExercise('biceps', 'Curl con barra')).toBe(false)
  })

  it('cae al grupo cuando el nombre no da pistas', () => {
    expect(isCompoundExercise('pierna', 'Ejercicio genérico')).toBe(true)
    expect(isCompoundExercise('biceps', 'Ejercicio genérico')).toBe(false)
  })

  it('el aislamiento gana sobre el fallback del grupo', () => {
    expect(isCompoundExercise('pierna', 'Extensión de piernas')).toBe(false)
  })
})
