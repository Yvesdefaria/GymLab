// F132.7: la clasificación Navy conserva los cortes del baseline y la concordancia de
// género en español (el copy se movió del dominio a i18n).
import { describe, expect, it } from 'vitest'
import { classifyNavy } from '@/domain/calculators/navy'
import { es } from '@/i18n/locales/es'

describe('classifyNavy', () => {
  it('mantiene los cortes masculinos', () => {
    expect(classifyNavy(5.9, 'hombre')).toBe('essential')
    expect(classifyNavy(6, 'hombre')).toBe('athletic')
    expect(classifyNavy(14, 'hombre')).toBe('fitness')
    expect(classifyNavy(18, 'hombre')).toBe('average')
    expect(classifyNavy(25, 'hombre')).toBe('obese')
  })

  it('mantiene los cortes femeninos', () => {
    expect(classifyNavy(13.9, 'mujer')).toBe('essential')
    expect(classifyNavy(14, 'mujer')).toBe('athletic')
    expect(classifyNavy(21, 'mujer')).toBe('fitness')
    expect(classifyNavy(25, 'mujer')).toBe('average')
    expect(classifyNavy(32, 'mujer')).toBe('obese')
  })

  it('conserva las formas femeninas del copy español', () => {
    expect(es.navy.classificationsFemale.athletic).toBe('Atlética')
    expect(es.navy.classificationsFemale.obese).toBe('Obesa')
    expect(es.navy.classifications.athletic).toBe('Atlético')
  })
})
