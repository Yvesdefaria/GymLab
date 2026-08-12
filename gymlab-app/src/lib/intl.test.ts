import { describe, expect, it } from 'vitest'
import { formatDate, formatNumber, formatVolume } from './intl'

describe('intl', () => {
  it('formatea fechas con el locale correcto', () => {
    const d = new Date(2026, 7, 12)
    const es = formatDate(d, 'es', { day: 'numeric', month: 'short' })
    const en = formatDate(d, 'en', { day: 'numeric', month: 'short' })
    expect(es).toContain('ago')
    expect(en).toContain('Aug')
  })

  it('usa es-ES y en-GB en números', () => {
    expect(formatNumber(1234.5, 'es')).toBe('1234,5')
    expect(formatNumber(1234.5, 'en')).toBe('1,234.5')
  })

  it('formatea el volumen en «k» desde 1000 con el separador del locale', () => {
    expect(formatVolume(950, 'es')).toBe('950')
    expect(formatVolume(12500, 'es')).toBe('12,5k')
    expect(formatVolume(12500, 'en')).toBe('12.5k')
  })
})
