import { describe, expect, it } from 'vitest'
import { clamp } from './numberGuard'

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
