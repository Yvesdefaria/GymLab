import { describe, expect, it } from 'vitest'
import { formatDate, formatNumber } from './intl'

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
})
