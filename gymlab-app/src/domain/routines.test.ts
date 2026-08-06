import { describe, expect, it } from 'vitest'
import { LEVEL_LABELS, MUSCLE_GROUP_LABELS, OBJECTIVE_LABELS, slugify } from './routines'

describe('OBJECTIVE_LABELS', () => {
  it('mapea los 5 objetivos', () => {
    expect(Object.keys(OBJECTIVE_LABELS)).toHaveLength(5)
    expect(OBJECTIVE_LABELS.volumen).toBe('Volumen')
    expect(OBJECTIVE_LABELS.definicion).toBe('Definición')
    expect(OBJECTIVE_LABELS.fuerza).toBe('Fuerza')
    expect(OBJECTIVE_LABELS.resistencia).toBe('Resistencia')
    expect(OBJECTIVE_LABELS.general).toBe('General')
  })
})

describe('LEVEL_LABELS', () => {
  it('mapea los 3 niveles', () => {
    expect(LEVEL_LABELS.principiante).toBe('Principiante')
    expect(LEVEL_LABELS.intermedio).toBe('Intermedio')
    expect(LEVEL_LABELS.avanzado).toBe('Avanzado')
  })
})

describe('MUSCLE_GROUP_LABELS', () => {
  it('mapea los grupos conocidos y deja el resto sin mapear', () => {
    expect(MUSCLE_GROUP_LABELS.pecho).toBe('Pecho')
    expect(MUSCLE_GROUP_LABELS.biceps).toBe('Bíceps')
    expect(MUSCLE_GROUP_LABELS.abdomen).toBe('Abdomen')
    expect(MUSCLE_GROUP_LABELS.cardio).toBeUndefined()
  })
})

describe('slugify', () => {
  it('normaliza, quita acentos y espacia con guiones', () => {
    expect(slugify('Press Banca')).toBe('press-banca')
    expect(slugify('Fuerza Volumen 3 días')).toBe('fuerza-volumen-3-dias')
    expect(slugify('Espalda  Casa')).toBe('espalda-casa')
  })

  it('recorta guiones iniciales y finales', () => {
    expect(slugify('  Rutina  ')).toBe('rutina')
  })

  it('limita a 60 caracteres', () => {
    const long = 'a'.repeat(80)
    expect(slugify(long)).toHaveLength(60)
  })
})
