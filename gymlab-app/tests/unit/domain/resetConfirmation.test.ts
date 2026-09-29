// Gate del reset de fábrica (F112, D2): type-to-confirm con trim + case-insensitive.
import { describe, expect, it } from 'vitest'
import { matchesResetConfirmation, RESET_CONFIRMATION_WORD } from '@/domain/resetConfirmation'

describe('matchesResetConfirmation', () => {
  it('acepta la palabra exacta, con espacios y en cualquier caso', () => {
    expect(matchesResetConfirmation('BORRAR')).toBe(true)
    expect(matchesResetConfirmation('  borrar ')).toBe(true)
    expect(matchesResetConfirmation('Borrar')).toBe(true)
  })

  it('rechaza vacío, parciales y otras palabras', () => {
    expect(matchesResetConfirmation('')).toBe(false)
    expect(matchesResetConfirmation('BORRA')).toBe(false)
    expect(matchesResetConfirmation('borrar todo')).toBe(false)
    expect(matchesResetConfirmation('RESET')).toBe(false)
  })

  it('la palabra canónica es BORRAR', () => {
    expect(RESET_CONFIRMATION_WORD).toBe('BORRAR')
  })
})
