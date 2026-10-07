// F120/PC-1: el área del peso corporal dibuja un dot por punto solo hasta el tope;
// el rango «Todo» puede traer cientos de días y un círculo SVG por día jankea.
import { describe, expect, it } from 'vitest'
import { MAX_AREA_DOTS, showAreaDots } from '@/components/stats/chartStyle'

describe('showAreaDots (F120/PC-1)', () => {
  it('dibuja los puntos hasta el tope inclusive', () => {
    expect(showAreaDots(30)).toBe(true)
    expect(showAreaDots(MAX_AREA_DOTS)).toBe(true)
  })

  it('los omite por encima del tope (Todo con cientos de entradas)', () => {
    expect(showAreaDots(MAX_AREA_DOTS + 1)).toBe(false)
    expect(showAreaDots(400)).toBe(false)
  })
})
