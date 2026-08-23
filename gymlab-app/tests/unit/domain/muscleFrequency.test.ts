// Tests de frecuencia muscular vs objetivo (F73).
import { describe, expect, it } from 'vitest'
import type { MuscleGroup } from '@/domain/types'
import {
  FREQUENCY_TARGETS,
  calculateMuscleFrequency,
  compareFrequency,
  getImbalancedGroups,
} from '@/domain/muscleFrequency'

describe('FREQUENCY_TARGETS', () => {
  it('contiene todos los grupos musculares con valores numéricos positivos', () => {
    const groups: MuscleGroup[] = [
      'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
      'pierna', 'gluteo', 'abdomen', 'trapecios', 'antebrazo',
    ]
    for (const g of groups) {
      expect(FREQUENCY_TARGETS[g]).toBeGreaterThan(0)
    }
  })

  it('la mayoría de grupos objetivo son 2 sesiones/semana', () => {
    const groups: MuscleGroup[] = [
      'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
      'pierna', 'gluteo',
    ]
    for (const g of groups) {
      expect(FREQUENCY_TARGETS[g]).toBe(2)
    }
  })

  it('abdomen tiene objetivo 3 (mayor frecuencia)', () => {
    expect(FREQUENCY_TARGETS.abdomen).toBe(3)
  })

  it('trapecios y antebrazo tienen objetivo 1 (menor frecuencia)', () => {
    expect(FREQUENCY_TARGETS.trapecios).toBe(1)
    expect(FREQUENCY_TARGETS.antebrazo).toBe(1)
  })
})

describe('calculateMuscleFrequency', () => {
  it('cuenta fechas por grupo muscular', () => {
    const input: Partial<Record<MuscleGroup, string[]>> = {
      pecho: ['2025-01-06', '2025-01-13', '2025-01-20'],
      espalda: ['2025-01-07', '2025-01-14'],
    }
    const result = calculateMuscleFrequency(input)
    expect(result.pecho).toBe(3)
    expect(result.espalda).toBe(2)
  })

  it('devuelve objeto vacío si no hay datos', () => {
    expect(calculateMuscleFrequency({})).toEqual({})
  })

  it('grupo con 0 fechas devuelve 0', () => {
    const result = calculateMuscleFrequency({ pecho: [] })
    expect(result.pecho).toBe(0)
  })

  it('maneja un solo grupo con una sola fecha', () => {
    const result = calculateMuscleFrequency({ pierna: ['2025-03-01'] })
    expect(result.pierna).toBe(1)
  })
})

describe('compareFrequency', () => {
  it('devuelve resultado para cada grupo muscular', () => {
    const result = compareFrequency({})
    expect(result).toHaveLength(Object.keys(FREQUENCY_TARGETS).length)
  })

  it('devuelve 0 actual y alerta false cuando no hay datos', () => {
    const result = compareFrequency({})
    for (const r of result) {
      expect(r.actual).toBe(0)
      expect(r.target).toBe(FREQUENCY_TARGETS[r.group])
      expect(r.deviation).toBe(-100)
      expect(r.alert).toBe(true)
    }
  })

  it('alerta true cuando desviación > 20%', () => {
    const result = compareFrequency({ pecho: 1 })
    const pecho = result.find((r) => r.group === 'pecho')!
    expect(pecho.actual).toBe(1)
    expect(pecho.target).toBe(2)
    expect(pecho.deviation).toBe(-50)
    expect(pecho.alert).toBe(true)
  })

  it('alerta false cuando desviación <= 20%', () => {
    const result = compareFrequency({ pecho: 2 })
    const pecho = result.find((r) => r.group === 'pecho')!
    expect(pecho.deviation).toBe(0)
    expect(pecho.alert).toBe(false)
  })

  it('alerta true cuando sobrentrenamiento (>20% por encima)', () => {
    const result = compareFrequency({ pecho: 3 })
    const pecho = result.find((r) => r.group === 'pecho')!
    expect(pecho.deviation).toBe(50)
    expect(pecho.alert).toBe(true)
  })

  it('calcula desviación correctamente para grupos con objetivo 1', () => {
    const result = compareFrequency({ trapecios: 2 })
    const traps = result.find((r) => r.group === 'trapecios')!
    expect(traps.target).toBe(1)
    expect(traps.deviation).toBe(100)
    expect(traps.alert).toBe(true)
  })

  it('mezcla grupos con datos y sin datos', () => {
    const result = compareFrequency({ pecho: 2, espalda: 0 })
    const pecho = result.find((r) => r.group === 'pecho')!
    const espalda = result.find((r) => r.group === 'espalda')!
    expect(pecho.alert).toBe(false)
    expect(espalda.alert).toBe(true)
  })
})

describe('getImbalancedGroups', () => {
  it('devuelve solo grupos con desbalance', () => {
    const imbalanced = getImbalancedGroups({ pecho: 2, espalda: 0 })
    expect(imbalanced.some((r) => r.group === 'pecho')).toBe(false)
    expect(imbalanced.some((r) => r.group === 'espalda')).toBe(true)
  })

  it('devuelve vacío cuando todos los grupos están en rango', () => {
    const allOnTarget: Partial<Record<MuscleGroup, number>> = {
      pecho: 2, espalda: 2, biceps: 2, triceps: 2, hombro: 2,
      pierna: 2, gluteo: 2, abdomen: 3, trapecios: 1, antebrazo: 1,
    }
    expect(getImbalancedGroups(allOnTarget)).toHaveLength(0)
  })

  it('devuelve todos los grupos cuando no hay datos', () => {
    expect(getImbalancedGroups({})).toHaveLength(Object.keys(FREQUENCY_TARGETS).length)
  })

  it('incluye deviation en cada elemento', () => {
    const result = getImbalancedGroups({ abdomen: 0 })
    expect(result[0]).toHaveProperty('deviation')
    expect(typeof result[0].deviation).toBe('number')
  })
})
