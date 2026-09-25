import { describe, expect, it } from 'vitest'
import { WHTR_LIMITS, WHR_LIMITS, whtrCategory, whrCategory } from '@/domain/calculators/bodyComposition'

describe('umbrales de ratios', () => {
  it('WHTR_LIMITS y WHR_LIMITS son la fuente única', () => {
    expect(WHTR_LIMITS).toEqual({ healthy: 0.5, medium: 0.6 })
    expect(WHR_LIMITS).toEqual({ male: { low: 0.9, high: 1.0 }, female: { low: 0.8, high: 0.9 } })
  })

  it('whtrCategory usa los umbrales', () => {
    expect(whtrCategory(0.5)).toBe('saludable')
    expect(whtrCategory(0.51)).toBe('riesgo_aumentado')
    expect(whtrCategory(0.61)).toBe('riesgo_alto')
  })

  it('whrCategory usa los umbrales por sexo', () => {
    expect(whrCategory(0.89, 'male')).toBe('bajo')
    expect(whrCategory(0.95, 'male')).toBe('moderado')
    expect(whrCategory(0.79, 'female')).toBe('bajo')
  })
})
