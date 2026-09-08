// Tests de las utilidades clamp/clampPercent (límites, extremos y NaN).
import { describe, expect, it } from 'vitest'
import { clamp, clampPercent } from '@/domain/numberGuard'

describe('clamp', () => {
  it('deja valores dentro del rango', () => {
    expect(clamp(5, 0, 100)).toBe(5)
    expect(clamp(0, 0, 100)).toBe(0)
    expect(clamp(100, 0, 100)).toBe(100)
  })

  it('recorta negativos al mínimo', () => {
    expect(clamp(-5, 0, 100)).toBe(0)
    expect(clamp(-999999, 0, 100)).toBe(0)
  })

  it('recorta extremadamente grandes al máximo', () => {
    expect(clamp(1e15, 0, 1000)).toBe(1000)
    expect(clamp(Number.MAX_SAFE_INTEGER, 0, 1000)).toBe(1000)
    expect(clamp(Infinity, 0, 1000)).toBe(1000)
  })

  it('NaN cae al mínimo', () => {
    expect(clamp(Number.NaN, 0, 1000)).toBe(0)
  })
})

describe('clampPercent', () => {
  it('deja porcentajes dentro de 0-100', () => {
    expect(clampPercent(0)).toBe(0)
    expect(clampPercent(37.5)).toBe(37.5)
    expect(clampPercent(100)).toBe(100)
  })

  it('recorta negativos a 0', () => {
    expect(clampPercent(-10)).toBe(0)
    expect(clampPercent(-0.01)).toBe(0)
  })

  it('satura por encima de 100', () => {
    expect(clampPercent(150)).toBe(100)
    expect(clampPercent(Infinity)).toBe(100)
  })

  it('NaN cae a 0', () => {
    expect(clampPercent(Number.NaN)).toBe(0)
  })
})
