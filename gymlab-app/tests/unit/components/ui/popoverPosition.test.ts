import { describe, expect, it } from 'vitest'
import { computePopoverPos } from '@/components/ui/popoverPosition'

const VIEWPORT = { width: 375, height: 812 }

describe('computePopoverPos', () => {
  it('abre a la derecha y debajo cuando hay espacio', () => {
    expect(computePopoverPos({ top: 100, right: 64, bottom: 124, left: 40 }, VIEWPORT)).toEqual({
      top: 132,
      left: 72,
      maxHeight: 320,
    })
  })

  it('voltea a la izquierda cerca del borde derecho', () => {
    expect(computePopoverPos({ top: 100, right: 300, bottom: 124, left: 276 }, VIEWPORT)).toEqual({
      top: 132,
      left: 12,
      maxHeight: 320,
    })
  })

  it('clampa horizontalmente cuando ningún lado entra', () => {
    expect(computePopoverPos({ top: 100, right: 224, bottom: 124, left: 200 }, VIEWPORT)).toEqual({
      top: 132,
      left: 111,
      maxHeight: 320,
    })
  })

  it('voltea arriba cerca del borde inferior', () => {
    expect(computePopoverPos({ top: 700, right: 64, bottom: 724, left: 40 }, VIEWPORT)).toEqual({
      top: 372,
      left: 72,
      maxHeight: 320,
    })
  })

  it('clampa en un viewport chico (320×568)', () => {
    expect(computePopoverPos({ top: 250, right: 150, bottom: 274, left: 126 }, { width: 320, height: 568 })).toEqual({
      top: 240,
      left: 56,
      maxHeight: 320,
    })
  })

  it('recorta maxHeight cuando el viewport es más bajo que el popover + bordes', () => {
    expect(computePopoverPos({ top: 100, right: 150, bottom: 124, left: 126 }, { width: 320, height: 300 })).toEqual({
      top: 8,
      left: 56,
      maxHeight: 284,
    })
  })
})
