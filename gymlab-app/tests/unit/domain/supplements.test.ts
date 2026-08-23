import { describe, expect, it } from 'vitest'
import { getActiveSupplements, countActive, SUPPLEMENT_SEED } from '@/domain/supplements'
import type { SupplementEntry } from '@/domain/types'

const makeSup = (overrides: Partial<SupplementEntry> = {}): SupplementEntry => ({
  id: 1,
  name: 'Creatina',
  dose: '5g',
  frequency: 'diario',
  active: true,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('SUPPLEMENT_SEED', () => {
  it('tiene al menos 6 suplementos', () => {
    expect(SUPPLEMENT_SEED.length).toBeGreaterThanOrEqual(6)
  })

  it('cada entrada tiene name, dose, frequency y active', () => {
    for (const s of SUPPLEMENT_SEED) {
      expect(typeof s.name).toBe('string')
      expect(s.name.length).toBeGreaterThan(0)
      expect(typeof s.dose).toBe('string')
      expect(s.dose.length).toBeGreaterThan(0)
      expect(['diario', 'pre_entreno', 'post_entreno', 'semanal']).toContain(s.frequency)
      expect(typeof s.active).toBe('boolean')
    }
  })

  it('hay suplementos con frequency diario', () => {
    const diarios = SUPPLEMENT_SEED.filter((s) => s.frequency === 'diario')
    expect(diarios.length).toBeGreaterThanOrEqual(1)
  })
})

describe('getActiveSupplements', () => {
  it('devuelve solo los activos', () => {
    const all = [
      makeSup({ id: 1, active: true }),
      makeSup({ id: 2, active: false }),
      makeSup({ id: 3, active: true }),
    ]
    const result = getActiveSupplements(all)
    expect(result).toHaveLength(2)
    expect(result.every((s) => s.active)).toBe(true)
  })

  it('devuelve array vacío si ninguno está activo', () => {
    const all = [makeSup({ active: false }), makeSup({ id: 2, active: false })]
    expect(getActiveSupplements(all)).toHaveLength(0)
  })

  it('devuelve todos si todos están activos', () => {
    const all = [makeSup({ active: true }), makeSup({ id: 2, active: true })]
    expect(getActiveSupplements(all)).toHaveLength(2)
  })

  it('devuelve array vacío para input vacío', () => {
    expect(getActiveSupplements([])).toHaveLength(0)
  })
})

describe('countActive', () => {
  it('cuenta suplementos activos', () => {
    const all = [
      makeSup({ active: true }),
      makeSup({ id: 2, active: false }),
      makeSup({ id: 3, active: true }),
    ]
    expect(countActive(all)).toBe(2)
  })

  it('devuelve 0 si ninguno está activo', () => {
    expect(countActive([makeSup({ active: false })])).toBe(0)
  })

  it('devuelve 0 para input vacío', () => {
    expect(countActive([])).toBe(0)
  })

  it('devuelve el total si todos están activos', () => {
    expect(countActive([makeSup({ active: true }), makeSup({ id: 2, active: true })])).toBe(2)
  })
})
