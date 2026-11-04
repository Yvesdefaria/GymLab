import { describe, expect, it } from 'vitest'
import {
  attributeVolume,
  SYNERGIST_FACTOR,
  VOLUME_GROUPS,
  VOLUME_TARGETS,
  volumeGroupOf,
  volumeTarget,
} from '@/domain/volumeGroup'
import type { Exercise } from '@/domain/types'

const ex = (muscleGroup: Exercise['muscleGroup'], name: string, muscleZones?: Exercise['muscleZones']) =>
  ({ muscleGroup, name, slug: name.toLowerCase().replace(/\s+/g, '-'), muscleZones }) as Exercise

describe('volumeGroupOf', () => {
  it('separa pierna por zona', () => {
    expect(volumeGroupOf(ex('pierna', 'Sentadilla', ['pierna:cuadriceps']))).toBe('cuadriceps')
    expect(volumeGroupOf(ex('pierna', 'Curl femoral', ['pierna:femoral']))).toBe('isquios')
    expect(volumeGroupOf(ex('pierna', 'Elevación de gemelos', ['pierna:gemelo']))).toBe('gemelos')
  })

  it('hombro lateral y posterior cuentan como hombro; el anterior no', () => {
    expect(volumeGroupOf(ex('hombro', 'Elevación lateral', ['hombro:lateral']))).toBe('hombro')
    expect(volumeGroupOf(ex('hombro', 'Pájaros', ['hombro:posterior']))).toBe('hombro')
    expect(volumeGroupOf(ex('hombro', 'Press militar', ['hombro:anterior']))).toBeNull()
  })

  it('pierna sin zona queda sin clasificar', () => {
    expect(volumeGroupOf(ex('pierna', 'Ejercicio genérico'))).toBeNull()
  })

  it('abductores y aductores quedan sin clasificar', () => {
    expect(volumeGroupOf(ex('pierna', 'Abducción de cadera', ['pierna:abductor']))).toBeNull()
    expect(volumeGroupOf(ex('pierna', 'Aducción de cadera', ['pierna:aductor']))).toBeNull()
  })

  it('los grupos 1:1 caen al grupo aunque no tengan zona', () => {
    expect(volumeGroupOf(ex('pecho', 'Press banca'))).toBe('pecho')
    expect(volumeGroupOf(ex('espalda', 'Remo con barra'))).toBe('espalda')
    expect(volumeGroupOf(ex('biceps', 'Curl con barra'))).toBe('biceps')
    expect(volumeGroupOf(ex('gluteo', 'Hip thrust'))).toBe('gluteo')
  })

  it('el peso muerto se atribuye a isquios aunque el catálogo lo ponga en espalda', () => {
    expect(volumeGroupOf(ex('espalda', 'Peso muerto convencional', ['espalda:dorsal']))).toBe('isquios')
    expect(volumeGroupOf(ex('espalda', 'Peso muerto rumano', ['espalda:dorsal']))).toBe('isquios')
  })

  it('el press militar queda fuera de la banda de hombro (anterior)', () => {
    expect(volumeGroupOf(ex('hombro', 'Press militar con barra'))).toBeNull()
  })

  it('todas las bandas existen y son rangos válidos', () => {
    for (const group of VOLUME_GROUPS) {
      expect(volumeTarget(group)).toBeTruthy()
      expect(VOLUME_TARGETS[group].min).toBeLessThanOrEqual(VOLUME_TARGETS[group].max)
    }
  })

  it('el factor sinérgico es 0,5', () => {
    expect(SYNERGIST_FACTOR).toBe(0.5)
  })

  it('distingue excluido por diseño de sin datos', () => {
    expect(attributeVolume(ex('hombro', 'Press militar'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('hombro', 'Elevación frontal con polea'))).toEqual({ kind: 'excluded' })
    expect(attributeVolume(ex('pierna', 'Ejercicio raro'))).toEqual({ kind: 'unknown' })
    expect(attributeVolume(ex('pierna', 'Sentadilla', ['pierna:cuadriceps']))).toEqual({
      kind: 'group',
      group: 'cuadriceps',
    })
  })
})
