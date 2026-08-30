import { describe, expect, it } from 'vitest'
import { formatDuration, parseDuration } from '@/lib/duration'

describe('formatDuration', () => {
  it('formatea segundos a MM:SS', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(5)).toBe('0:05')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(600)).toBe('10:00')
  })

  it('usa HH:MM:SS por encima de una hora', () => {
    expect(formatDuration(3600)).toBe('1:00:00')
    expect(formatDuration(3661)).toBe('1:01:01')
  })
})

describe('parseDuration', () => {
  it('interpreta un número suelto como minutos', () => {
    expect(parseDuration('5')).toBe(300)
    expect(parseDuration('')).toBe(0)
    expect(parseDuration('0')).toBe(0)
  })

  it('interpreta formato M:SS', () => {
    expect(parseDuration('5:30')).toBe(330)
    expect(parseDuration('0:45')).toBe(45)
  })

  it('interpreta formato H:MM:SS', () => {
    expect(parseDuration('1:05:30')).toBe(3930)
  })

  it('devuelve 0 en entradas inválidas', () => {
    expect(parseDuration('abc')).toBe(0)
    expect(parseDuration('1:x:2')).toBe(0)
  })
})