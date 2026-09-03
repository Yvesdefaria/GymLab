import { describe, expect, it } from 'vitest'
import {
  MUSCLE_ZONE_BY_GROUP,
  MUSCLE_ZONE_LABELS_ES,
  MUSCLE_ZONE_LABELS_EN,
  muscleZonesOfGroup,
} from '@/domain/catalog'
import { localizeMuscleZone } from '@/i18n/catalog'
import type { MuscleGroup, MuscleZone } from '@/domain/types'

const ALL_GROUPS: MuscleGroup[] = [
  'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
  'pierna', 'gluteo', 'abdomen', 'trapecios', 'antebrazo',
]

describe('MUSCLE_ZONE_BY_GROUP', () => {
  it('define zonas para todos los grupos musculares', () => {
    for (const g of ALL_GROUPS) {
      expect(MUSCLE_ZONE_BY_GROUP[g].length).toBeGreaterThanOrEqual(1)
    }
  })

  it('pierna incluye cuadriceps y femoral', () => {
    const zones = MUSCLE_ZONE_BY_GROUP.pierna
    expect(zones).toContain('pierna:cuadriceps')
    expect(zones).toContain('pierna:femoral')
  })

  it('cada zona usa el prefijo de su grupo', () => {
    for (const g of ALL_GROUPS) {
      for (const z of MUSCLE_ZONE_BY_GROUP[g]) {
        expect(z.startsWith(`${g}:`)).toBe(true)
      }
    }
  })

  it('no duplica zonas entre grupos', () => {
    const seen = new Set<MuscleZone>()
    for (const g of ALL_GROUPS) {
      for (const z of MUSCLE_ZONE_BY_GROUP[g]) {
        expect(seen.has(z)).toBe(false)
        seen.add(z)
      }
    }
  })
})

describe('muscleZonesOfGroup', () => {
  it('devuelve las zonas de un grupo', () => {
    expect(muscleZonesOfGroup('pierna')).toEqual(MUSCLE_ZONE_BY_GROUP.pierna)
  })
})

describe('MUSCLE_ZONE_LABELS', () => {
  it('tienen etiqueta ES y EN para cada zona', () => {
    for (const g of ALL_GROUPS) {
      for (const z of MUSCLE_ZONE_BY_GROUP[g]) {
        expect(MUSCLE_ZONE_LABELS_ES[z]).toBeTruthy()
        expect(MUSCLE_ZONE_LABELS_EN[z]).toBeTruthy()
      }
    }
  })
})

describe('localizeMuscleZone', () => {
  it('devuelve etiqueta ES por defecto', () => {
    expect(localizeMuscleZone('pierna:cuadriceps', 'es')).toBe('Cuádriceps')
  })
  it('devuelve etiqueta EN en inglés', () => {
    expect(localizeMuscleZone('pierna:cuadriceps', 'en')).toBe('Quadriceps')
  })
  it('devuelve el valor crudo si no conoce la zona', () => {
    expect(localizeMuscleZone('desconocido:x', 'es')).toBe('desconocido:x')
  })
})
