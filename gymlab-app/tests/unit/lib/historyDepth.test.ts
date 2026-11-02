import { describe, expect, it } from 'vitest'
import { canNavigateBack } from '@/lib/historyDepth'

describe('canNavigateBack', () => {
  it('en la primera entrada (idx 0) no se puede volver', () => {
    expect(canNavigateBack({ idx: 0 }, 'k1')).toBe(false)
  })

  it('con una entrada detrás (idx > 0) se puede volver', () => {
    expect(canNavigateBack({ idx: 2 }, 'k1')).toBe(true)
  })

  it('un replace en la primera entrada no habilita el back (regresión R4-1)', () => {
    // `replace` acuña una key nueva pero el idx sigue en 0: antes esto hacía
    // que el BackLink llamara navigate(-1) y no pasara nada.
    expect(canNavigateBack({ idx: 0 }, 'nueva-key-por-replace')).toBe(false)
  })

  it('sin estado de historial (MemoryRouter) cae a la key de la ubicación', () => {
    expect(canNavigateBack(null, 'default')).toBe(false)
    expect(canNavigateBack(null, 'otra-key')).toBe(true)
  })
})
