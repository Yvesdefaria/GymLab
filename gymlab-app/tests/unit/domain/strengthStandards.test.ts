// Tests de caracterización de los estándares de fuerza: umbrales por peso corporal
// (con interpolación y clamp), nivel alcanzado y percentil estimado.
import { describe, expect, it } from 'vitest'
import {
  getStrengthLevel,
  getStrengthPercentile,
  getStrengthThresholds,
} from '@/domain/strengthStandards'

describe('getStrengthThresholds', () => {
  it('devuelve la fila exacta de sentadilla a 80 kg', () => {
    expect(getStrengthThresholds('sentadilla', 80)).toEqual([80, 120, 160, 205])
  })

  it('interpola linealmente sentadilla entre 80 kg y 90 kg', () => {
    expect(getStrengthThresholds('sentadilla', 85)).toEqual([85, 127.5, 170, 217.5])
  })

  it('clampea sentadilla por debajo del primer peso de la tabla (50 kg → fila de 60)', () => {
    expect(getStrengthThresholds('sentadilla', 50)).toEqual([60, 90, 120, 155])
  })

  it('clampea sentadilla por encima del último peso de la tabla (130 kg → fila de 120)', () => {
    expect(getStrengthThresholds('sentadilla', 130)).toEqual([120, 180, 240, 305])
  })

  it('usa la fila de banca a 80 kg', () => {
    expect(getStrengthThresholds('banca', 80)).toEqual([70, 105, 140, 180])
  })
})

describe('getStrengthLevel', () => {
  it('principiante justo debajo del umbral intermedio (119.9)', () => {
    expect(getStrengthLevel('sentadilla', 119.9, 80)).toBe('principiante')
  })

  it('intermedio desde el umbral exacto (120)', () => {
    expect(getStrengthLevel('sentadilla', 120, 80)).toBe('intermedio')
  })

  it('avanzado desde 160', () => {
    expect(getStrengthLevel('sentadilla', 160, 80)).toBe('avanzado')
  })

  it('elite desde 205', () => {
    expect(getStrengthLevel('sentadilla', 205, 80)).toBe('elite')
  })

  it('aplica la tabla de banca: 105 kg a 80 kg → intermedio', () => {
    expect(getStrengthLevel('banca', 105, 80)).toBe('intermedio')
  })
})

describe('getStrengthPercentile', () => {
  it('percentil proporcional por debajo del p25 (40 kg → 12.5)', () => {
    expect(getStrengthPercentile('sentadilla', 40, 80)).toBe(12.5)
  })

  it('p25 exacto (80 kg → 25)', () => {
    expect(getStrengthPercentile('sentadilla', 80, 80)).toBe(25)
  })

  it('interpola entre p25 y p50 (100 kg → 37.5)', () => {
    expect(getStrengthPercentile('sentadilla', 100, 80)).toBe(37.5)
  })

  it('p50 exacto (120 kg → 50)', () => {
    expect(getStrengthPercentile('sentadilla', 120, 80)).toBe(50)
  })

  it('p75 exacto (160 kg → 75)', () => {
    expect(getStrengthPercentile('sentadilla', 160, 80)).toBe(75)
  })

  it('p90 exacto (205 kg → 90)', () => {
    expect(getStrengthPercentile('sentadilla', 205, 80)).toBe(90)
  })

  it('extrapola por encima del p90 (225 kg → ~90.98)', () => {
    expect(getStrengthPercentile('sentadilla', 225, 80)).toBeCloseTo(90.98, 1)
  })

  it('tope de 100 en el tramo sobre p90 (1000 kg)', () => {
    expect(getStrengthPercentile('sentadilla', 1000, 80)).toBe(100)
  })
})
