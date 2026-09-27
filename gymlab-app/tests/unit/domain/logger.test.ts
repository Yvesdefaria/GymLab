import { describe, expect, it } from 'vitest'
import { LOG_FLAG_KEY, formatCategory, parseFlagState, shouldLog } from '@/domain/logger'

describe('parseFlagState', () => {
  it("'1' → on, '0' → off, cualquier otra cosa → auto", () => {
    expect(parseFlagState('1')).toBe('on')
    expect(parseFlagState('0')).toBe('off')
    expect(parseFlagState(null)).toBe('auto')
    expect(parseFlagState('')).toBe('auto')
    expect(parseFlagState('true')).toBe('auto')
  })
})

describe('shouldLog', () => {
  const LEVELS = ['debug', 'info', 'warn', 'error'] as const

  it('error siempre sale (cualquier estado y entorno)', () => {
    for (const dev of [true, false]) {
      for (const state of ['on', 'off', 'auto'] as const) {
        expect(shouldLog('error', { dev, state })).toBe(true)
      }
    }
  })

  it("'off' silencia debug/info/warn incluso en dev", () => {
    for (const level of ['debug', 'info', 'warn'] as const) {
      expect(shouldLog(level, { dev: true, state: 'off' })).toBe(false)
      expect(shouldLog(level, { dev: false, state: 'off' })).toBe(false)
    }
  })

  it("'on' habilita todo, también sin dev", () => {
    for (const level of LEVELS) {
      expect(shouldLog(level, { dev: false, state: 'on' })).toBe(true)
    }
  })

  it("'auto' decide por el entorno", () => {
    for (const level of LEVELS) {
      expect(shouldLog(level, { dev: true, state: 'auto' })).toBe(true)
      expect(shouldLog(level, { dev: false, state: 'auto' })).toBe(level === 'error')
    }
  })
})

describe('formatCategory', () => {
  it('prefija con [gymlab:…] para poder grepear en consola/logcat', () => {
    expect(formatCategory('stepsSync')).toBe('[gymlab:stepsSync]')
  })
})

describe('LOG_FLAG_KEY', () => {
  it('mantiene la clave de storage acordada', () => {
    expect(LOG_FLAG_KEY).toBe('gymlab.debug')
  })
})
