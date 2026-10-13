import { describe, expect, it } from 'vitest'
import { formatDuration, parseDuration } from '@/lib/duration'
import { sanitizeDecimalDraft } from '@/domain/numberGuard'

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

// 102.followups(a) — lote 21: el campo duración cardio muestra el valor guardado
// con formatDuration(v, 'mm:ss') y lo edita con el saneador del borrador
// (sanitizeDecimalDraft(..., 'duration'), modelo m:ss con minutos acumulados).
// Ambos deben compartir modelo para que el texto mostrado round-tripée:
// el formato 'clock' lo rompía — 7200 s → '2:00:00' y re-alimentarlo al saneador
// daba '200:00' (200 min = 12000 s), reemplazando el valor guardado en silencio.
describe('round-trip segundos ↔ texto del campo duración (lote 21)', () => {
  it("valores de ≥ 10 min round-tripean exacto en modo 'mm:ss'", () => {
    for (const seconds of [600, 3599, 3600, 7200, 12000]) {
      const shown = formatDuration(seconds, 'mm:ss')
      expect(sanitizeDecimalDraft(shown, 'duration')).toBe(shown)
      expect(parseDuration(shown)).toBe(seconds)
    }
  })

  it('valores más cortos conservan el VALOR aunque el saneador normalice el cero inicial', () => {
    // '01:05' (65 s) re-alimentado da '1:05' — mismo par m:ss, mismo valor:
    // la normalización del cero inicial es cosmética y no corrompe el guardado.
    for (const seconds of [0, 5, 65]) {
      const shown = formatDuration(seconds, 'mm:ss')
      expect(parseDuration(sanitizeDecimalDraft(shown, 'duration'))).toBe(seconds)
    }
  })

  it("el formato 'clock' NO round-trippea (documenta la causa raíz)", () => {
    const clock = formatDuration(7200)
    expect(clock).toBe('2:00:00')
    expect(sanitizeDecimalDraft(clock, 'duration')).toBe('200:00')
    expect(parseDuration(sanitizeDecimalDraft(clock, 'duration'))).toBe(12000)
  })
})