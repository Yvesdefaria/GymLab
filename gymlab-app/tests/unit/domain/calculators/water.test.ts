// Tests de la calculadora de hidratación (F93 #12).
// Evidencia: base 30 ml/kg (extremo inferior del rango 30–35 ml/kg: EFSA, Popkin 2010)
// más recarga por ejercicio intenso de 0.5 L por cada 30 min (ACSM 0.4–0.8 L/h).
import { describe, expect, it } from 'vitest'
import { calcDailyWater, calcVasosAgua, BASE_ML_PER_KG } from '@/domain/calculators/water'

describe('calcDailyWater', () => {
  it('usa 30 ml/kg como base (extremo inferior evidencia)', () => {
    expect(BASE_ML_PER_KG).toBe(30)
    expect(calcDailyWater(70, 0)).toBe(2.1) // 70*0.030 = 2.1
    expect(calcDailyWater(80, 0)).toBe(2.4) // 80*0.030 = 2.4
  })

  it('añade 0.5 L por cada 30 min de ejercicio', () => {
    expect(calcDailyWater(80, 30)).toBe(2.9) // 2.4 + 0.5
    expect(calcDailyWater(80, 60)).toBe(3.4) // 2.4 + 1.0
  })

  it('sin minutos de ejercicio no añade recarga', () => {
    expect(calcDailyWater(80, 0)).toBe(2.4)
    expect(calcDailyWater(80)).toBe(2.4) // default 0
  })

  it('devuelve 0 con peso no válido', () => {
    expect(calcDailyWater(0, 30)).toBe(0)
    expect(calcDailyWater(-10, 30)).toBe(0)
  })

  it('no dispara la recarga con casos extremos dentro de lo razonable', () => {
    // 120 kg con 2 h de ejercicio (antes 6.2 L con 35 ml/kg) ahora 5.6 L.
    expect(calcDailyWater(120, 120)).toBe(5.6)
  })
})

describe('calcVasosAgua', () => {
  it('convierte litros a vasos de 250 ml redondeando hacia arriba', () => {
    expect(calcVasosAgua(2.4)).toBe(10) // 2.4 / 0.25 = 9.6 -> 10
    expect(calcVasosAgua(2.9)).toBe(12) // 2.9 / 0.25 = 11.6 -> 12
  })

  it('devuelve 0 con litros no válidos', () => {
    expect(calcVasosAgua(0)).toBe(0)
    expect(calcVasosAgua(-1)).toBe(0)
  })
})
