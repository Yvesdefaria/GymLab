// Default del producto: una instalación nueva arranca en inglés; la preferencia
// guardada por el usuario (settings.language) siempre gana sobre este valor.
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '@/domain/settings'

describe('DEFAULT_SETTINGS', () => {
  it('arranca en inglés por defecto', () => {
    expect(DEFAULT_SETTINGS.language).toBe('en')
  })

  it('la telemetría arranca apagada (D6)', () => {
    expect(DEFAULT_SETTINGS.telemetry).toBe(false)
  })
})
