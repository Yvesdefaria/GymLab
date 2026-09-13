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

  // F96 D1: el modo por defecto (clock) preserva a los consumidores existentes
  // (duración de serie, cardio) sin cambiar su salida.
  it('sin formato explícito conserva la salida histórica (clock, minutos sin rellenar)', () => {
    expect(formatDuration(65, 'clock')).toBe('1:05')
    expect(formatDuration(65)).toBe(formatDuration(65, 'clock'))
    expect(formatDuration(59, 'clock')).toBe('0:59')
    expect(formatDuration(3661, 'clock')).toBe('1:01:01')
  })

  it("modo 'mm:ss' rellena los minutos a dos dígitos", () => {
    expect(formatDuration(0, 'mm:ss')).toBe('00:00')
    expect(formatDuration(5, 'mm:ss')).toBe('00:05')
    expect(formatDuration(59, 'mm:ss')).toBe('00:59')
    expect(formatDuration(65, 'mm:ss')).toBe('01:05')
    expect(formatDuration(600, 'mm:ss')).toBe('10:00')
    expect(formatDuration(3599, 'mm:ss')).toBe('59:59')
  })

  it("modo 'mm:ss' acumula horas en minutos en vez de añadir un campo", () => {
    expect(formatDuration(3600, 'mm:ss')).toBe('60:00')
    expect(formatDuration(3661, 'mm:ss')).toBe('61:01')
  })

  it("modo 'seconds' emite sólo el total de segundos", () => {
    expect(formatDuration(0, 'seconds')).toBe('0')
    expect(formatDuration(5, 'seconds')).toBe('5')
    expect(formatDuration(65, 'seconds')).toBe('65')
    expect(formatDuration(3600, 'seconds')).toBe('3600')
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