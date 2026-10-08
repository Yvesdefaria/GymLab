import { describe, expect, it } from 'vitest'
import { mergeSessionNotes } from '@/domain/sessionNotes'

describe('mergeSessionNotes (F84)', () => {
  it('sin nota de journal devuelve la de sesión', () => {
    expect(mergeSessionNotes('durante', undefined)).toBe('durante')
    expect(mergeSessionNotes('durante', '')).toBe('durante')
  })

  it('sin nota de sesión devuelve la del journal', () => {
    expect(mergeSessionNotes('', 'después')).toBe('después')
  })

  it('textos iguales quedan una sola vez', () => {
    expect(mergeSessionNotes('igual', 'igual')).toBe('igual')
  })

  it('textos distintos se unen con línea en blanco (sesión primero)', () => {
    expect(mergeSessionNotes('durante', 'después')).toBe('durante\n\ndespués')
  })

  it('trim de ambas entradas; ambas vacías → cadena vacía', () => {
    expect(mergeSessionNotes('  durante  ', ' después ')).toBe('durante\n\ndespués')
    expect(mergeSessionNotes('   ', undefined)).toBe('')
  })
})
