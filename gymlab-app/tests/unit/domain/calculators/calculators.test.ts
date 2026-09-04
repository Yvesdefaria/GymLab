// Tests de las calculadoras de 1RM (Epley y Brzycki) y de distribución de discos en barra.
import { describe, expect, it } from 'vitest'
import { calcBrzyckiOneRepMax, calcEpleyOneRepMax, compareOneRepMax, oneRepMaxLabel } from '@/domain/calculators/oneRepMax'
import { MAX_WEIGHT_KG, platesForWeight } from '@/domain/calculators/plates'

describe('calcBrzyckiOneRepMax', () => {
  it('estima para rango normal', () => {
    expect(calcBrzyckiOneRepMax(100, 5)).toBe(112.5)
    expect(calcBrzyckiOneRepMax(100, 10)).toBe(133.3)
  })

  it('devuelve 0 con pesos o reps no válidos', () => {
    expect(calcBrzyckiOneRepMax(0, 5)).toBe(0)
    expect(calcBrzyckiOneRepMax(-100, 5)).toBe(0)
    expect(calcBrzyckiOneRepMax(100, 0)).toBe(0)
  })

  it('no explota ni da negativo con reps altas', () => {
    expect(calcBrzyckiOneRepMax(100, 37)).toBe(0)
    expect(calcBrzyckiOneRepMax(100, 40)).toBe(0)
    expect(calcBrzyckiOneRepMax(100, 1000)).toBe(0)
  })
})

describe('calcEpleyOneRepMax', () => {
  it('devuelve 0 con pesos o reps no válidos', () => {
    expect(calcEpleyOneRepMax(0, 5)).toBe(0)
    expect(calcEpleyOneRepMax(100, 0)).toBe(0)
    expect(calcEpleyOneRepMax(100, -3)).toBe(0)
  })

  it('no explota con reps altas', () => {
    const r = calcEpleyOneRepMax(100, 1000)
    expect(Number.isFinite(r)).toBe(true)
    expect(r).toBeGreaterThan(100)
  })
})

describe('oneRepMaxLabel', () => {
  it('sigue acotado con reps extremas', () => {
    const { brzycki, epley } = oneRepMaxLabel(100, 40)
    expect(brzycki).toBe(0)
    expect(Number.isFinite(epley)).toBe(true)
  })
})

describe('compareOneRepMax', () => {
  it('marca como superado cuando la nueva estimación supera el récord', () => {
    expect(compareOneRepMax(100, 112.5)).toEqual({ superado: true, diferenciaKg: 12.5 })
  })

  it('marca como no superado cuando empata el récord', () => {
    expect(compareOneRepMax(100, 100)).toEqual({ superado: false, diferenciaKg: 0 })
  })

  it('marca como no superado cuando la estimación es inferior', () => {
    expect(compareOneRepMax(100, 90)).toEqual({ superado: false, diferenciaKg: -10 })
  })

  it('no marca como superado cuando no hay récord (0)', () => {
    expect(compareOneRepMax(0, 90)).toEqual({ superado: false, diferenciaKg: 90 })
  })

  it('devuelve diferenciaKg a 1 decimal', () => {
    expect(compareOneRepMax(100, 112.56)).toEqual({ superado: true, diferenciaKg: 12.6 })
  })
})

describe('platesForWeight', () => {
  it('computa discos para un peso normal', () => {
    const r = platesForWeight(60, 20)
    expect(r.perSide).toContain(20)
    expect(r.exact).toBe(true)
  })

  it('no se cuelga ni desborda con pesos extremadamente grandes', () => {
    const r = platesForWeight(1e15, 20)
    expect(r.totalLoaded).toBeLessThanOrEqual(MAX_WEIGHT_KG)
    expect(Number.isFinite(r.totalLoaded)).toBe(true)
  })

  it('no genera perSide con negativos', () => {
    const r = platesForWeight(-100, 20)
    expect(r.totalLoaded).toBe(20)
    expect(r.exact).toBe(false)
  })
})
