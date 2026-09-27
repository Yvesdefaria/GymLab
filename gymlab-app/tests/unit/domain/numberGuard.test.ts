// Tests de las utilidades clamp/clampPercent (límites, extremos y NaN) y parseDecimal.
import { describe, expect, it } from 'vitest'
import {
  clamp,
  clampPercent,
  parseDecimal,
  resolveDraftCommit,
  resolveSanitizedDraft,
  sanitizeDecimalDraft,
} from '@/domain/numberGuard'

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

describe('parseDecimal', () => {
  it('acepta la coma como separador decimal', () => {
    expect(parseDecimal('16,5')).toEqual({ ok: true, value: 16.5 })
  })

  it('acepta el punto como separador decimal', () => {
    expect(parseDecimal('16.5')).toEqual({ ok: true, value: 16.5 })
  })

  it('recorta los espacios alrededor', () => {
    expect(parseDecimal('  16,5 ')).toEqual({ ok: true, value: 16.5 })
  })

  it('parsea enteros y negativos', () => {
    expect(parseDecimal('42')).toEqual({ ok: true, value: 42 })
    expect(parseDecimal('-3,5')).toEqual({ ok: true, value: -3.5 })
  })

  it('texto no numérico es inválido, nunca 0', () => {
    expect(parseDecimal('abc')).toEqual({ ok: false, error: 'invalid' })
  })

  it('vacío o solo espacios es empty', () => {
    expect(parseDecimal('')).toEqual({ ok: false, error: 'empty' })
    expect(parseDecimal('   ')).toEqual({ ok: false, error: 'empty' })
  })

  it('rechaza valores no finitos y separadores múltiples', () => {
    expect(parseDecimal('Infinity')).toEqual({ ok: false, error: 'invalid' })
    expect(parseDecimal('1,2,3')).toEqual({ ok: false, error: 'invalid' })
  })
})

// Contrato de confirmación al pulsar Enter (F98.4): un texto inválido NUNCA se
// confirma como 0; solo un decimal válido se escribe (recortado al rango) y un
// campo vacío se limpia. Así el foco puede avanzar sin corromper el valor.
describe('resolveDraftCommit', () => {
  it('texto inválido no confirma nada (nunca 0)', () => {
    expect(resolveDraftCommit('abc', 0, 100)).toEqual({ action: 'ignore' })
    expect(resolveDraftCommit('1,2,3', 0, 100)).toEqual({ action: 'ignore' })
    expect(resolveDraftCommit('Infinity', 0, 100)).toEqual({ action: 'ignore' })
  })

  it('vacío limpia el campo', () => {
    expect(resolveDraftCommit('', 0, 100)).toEqual({ action: 'clear' })
    expect(resolveDraftCommit('   ', 0, 100)).toEqual({ action: 'clear' })
  })

  it('un decimal válido confirma su valor recortado al rango', () => {
    expect(resolveDraftCommit('16,5', 0, 100)).toEqual({ action: 'commit', value: 16.5 })
    expect(resolveDraftCommit('200', 0, 100)).toEqual({ action: 'commit', value: 100 })
    expect(resolveDraftCommit('-5', 0, 100)).toEqual({ action: 'commit', value: 0 })
  })

  it('sin rango solo recorta lo no finito', () => {
    expect(resolveDraftCommit('42')).toEqual({ action: 'commit', value: 42 })
  })
})

// Guarda de borrador (F102): filtra cada carácter inválido antes de pintarlo,
// así el input nunca muestra texto que no pueda volver a parsearse.
describe('sanitizeDecimalDraft', () => {
  describe('mode decimal', () => {
    it('conserva solo dígitos y el primer separador decimal', () => {
      expect(sanitizeDecimalDraft('', 'decimal')).toBe('')
      expect(sanitizeDecimalDraft('123', 'decimal')).toBe('123')
      expect(sanitizeDecimalDraft('12,5', 'decimal')).toBe('12,5')
      expect(sanitizeDecimalDraft('12.5', 'decimal')).toBe('12.5')
      expect(sanitizeDecimalDraft(',', 'decimal')).toBe(',')
      expect(sanitizeDecimalDraft('.5', 'decimal')).toBe('.5')
      expect(sanitizeDecimalDraft('5,', 'decimal')).toBe('5,')
      expect(sanitizeDecimalDraft('007', 'decimal')).toBe('007')
    })

    it('descarta los separadores posteriores al primero', () => {
      expect(sanitizeDecimalDraft('1,2.3', 'decimal')).toBe('1,23')
      expect(sanitizeDecimalDraft('1.2,3', 'decimal')).toBe('1.23')
    })

    it('descarta letras, signos y espacios', () => {
      expect(sanitizeDecimalDraft('abc', 'decimal')).toBe('')
      expect(sanitizeDecimalDraft('a1b2', 'decimal')).toBe('12')
      expect(sanitizeDecimalDraft('-5', 'decimal')).toBe('5')
      expect(sanitizeDecimalDraft(' 12 ', 'decimal')).toBe('12')
    })
  })

  describe('mode integer', () => {
    it('conserva solo dígitos y corta en el primer separador', () => {
      expect(sanitizeDecimalDraft('12', 'integer')).toBe('12')
      expect(sanitizeDecimalDraft('1a2', 'integer')).toBe('12')
      // El separador corta: lo que sigue es parte decimal que el campo no acepta.
      expect(sanitizeDecimalDraft('1,5', 'integer')).toBe('1')
      expect(sanitizeDecimalDraft('2.5', 'integer')).toBe('2')
      expect(sanitizeDecimalDraft('5.5.5', 'integer')).toBe('5')
      expect(sanitizeDecimalDraft(',5', 'integer')).toBe('')
      expect(sanitizeDecimalDraft('-3', 'integer')).toBe('3')
      expect(sanitizeDecimalDraft('', 'integer')).toBe('')
    })
  })

  describe('mode duration', () => {
    it('formatea m:ss insertando los dos puntos solo', () => {
      expect(sanitizeDecimalDraft('5', 'duration')).toBe('0:05')
      expect(sanitizeDecimalDraft('45', 'duration')).toBe('0:45')
      expect(sanitizeDecimalDraft('530', 'duration')).toBe('5:30')
      expect(sanitizeDecimalDraft('2000', 'duration')).toBe('20:00')
      expect(sanitizeDecimalDraft('0', 'duration')).toBe('0:00')
      expect(sanitizeDecimalDraft('00', 'duration')).toBe('0:00')
      expect(sanitizeDecimalDraft('1015', 'duration')).toBe('10:15')
      expect(sanitizeDecimalDraft('12000', 'duration')).toBe('120:00')
    })

    it('ignora los ceros a la izquierda del bloque de minutos', () => {
      expect(sanitizeDecimalDraft('0530', 'duration')).toBe('5:30')
      expect(sanitizeDecimalDraft('0000', 'duration')).toBe('0:00')
    })

    it('es idempotente al re-alimentar el valor formateado', () => {
      expect(sanitizeDecimalDraft('5:30', 'duration')).toBe('5:30')
      expect(sanitizeDecimalDraft('5:300', 'duration')).toBe('53:00')
    })

    it('sin dígitos devuelve vacío', () => {
      expect(sanitizeDecimalDraft('abc', 'duration')).toBe('')
    })
  })
})

// Decisión de pintado (F102.3): combina el filtro con la confirmación para que
// el input pinte el borrador limpio. Un texto con SOLO caracteres inválidos se
// ignora (no debe limpiar el valor guardado); el vacío real (el usuario borró
// todo) sí se confirma como clear.
describe('resolveSanitizedDraft', () => {
  it('el vacío real confirma la limpieza', () => {
    expect(resolveSanitizedDraft('', 'decimal')).toEqual({ draft: '', shouldCommit: true })
    expect(resolveSanitizedDraft('', 'integer')).toEqual({ draft: '', shouldCommit: true })
  })

  it('un texto con solo caracteres inválidos se ignora', () => {
    expect(resolveSanitizedDraft('abc', 'decimal')).toEqual({ draft: '', shouldCommit: false })
    expect(resolveSanitizedDraft(' ', 'decimal')).toEqual({ draft: '', shouldCommit: false })
    expect(resolveSanitizedDraft('abc', 'integer')).toEqual({ draft: '', shouldCommit: false })
  })

  it('un borrador filtrado no vacío confirma el texto limpio', () => {
    expect(resolveSanitizedDraft('12', 'decimal')).toEqual({ draft: '12', shouldCommit: true })
    expect(resolveSanitizedDraft('1,2.3', 'decimal')).toEqual({ draft: '1,23', shouldCommit: true })
    expect(resolveSanitizedDraft('a1b2', 'decimal')).toEqual({ draft: '12', shouldCommit: true })
    expect(resolveSanitizedDraft(',', 'decimal')).toEqual({ draft: ',', shouldCommit: true })
    expect(resolveSanitizedDraft('1,5', 'integer')).toEqual({ draft: '1', shouldCommit: true })
  })

  it('sin modo usa decimal por defecto', () => {
    expect(resolveSanitizedDraft('12')).toEqual({ draft: '12', shouldCommit: true })
  })
})
