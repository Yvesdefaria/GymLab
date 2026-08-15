// Tests de las etiquetas del catálogo de rutinas y del slugify.
import { describe, expect, it } from 'vitest'
import { slugify } from './routines'
import {
  LEVEL_LABELS_ES,
  LEVELS,
  MUSCLE_GROUP_LABELS_ES,
  MUSCLE_GROUPS,
  OBJECTIVE_LABELS_ES,
  OBJECTIVES,
} from './catalog'

describe('OBJECTIVE_LABELS_ES', () => {
  it('mapea los 5 objetivos', () => {
    expect(OBJECTIVES).toHaveLength(5)
    expect(OBJECTIVE_LABELS_ES.volumen).toBe('Volumen')
    expect(OBJECTIVE_LABELS_ES.definicion).toBe('Definición')
    expect(OBJECTIVE_LABELS_ES.fuerza).toBe('Fuerza')
    expect(OBJECTIVE_LABELS_ES.resistencia).toBe('Resistencia')
    expect(OBJECTIVE_LABELS_ES.general).toBe('General')
  })
})

describe('LEVEL_LABELS_ES', () => {
  it('mapea los 3 niveles', () => {
    expect(LEVELS).toHaveLength(3)
    expect(LEVEL_LABELS_ES.principiante).toBe('Principiante')
    expect(LEVEL_LABELS_ES.intermedio).toBe('Intermedio')
    expect(LEVEL_LABELS_ES.avanzado).toBe('Avanzado')
  })
})

describe('MUSCLE_GROUP_LABELS_ES', () => {
  it('etiqueta todos los grupos musculares del catálogo', () => {
    expect(MUSCLE_GROUPS).toHaveLength(10)
    expect(MUSCLE_GROUP_LABELS_ES.pecho).toBe('Pecho')
    expect(MUSCLE_GROUP_LABELS_ES.biceps).toBe('Bíceps')
    expect(MUSCLE_GROUP_LABELS_ES.abdomen).toBe('Abdomen')
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
