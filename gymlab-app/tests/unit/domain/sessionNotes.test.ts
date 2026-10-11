import { describe, expect, it } from 'vitest'
import { mergeSessionNotes, persistJournalEntry } from '@/domain/sessionNotes'

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

describe('persistJournalEntry (F84/R3-1)', () => {
  it('guarda ratings primero y la nota después; devuelve saved', async () => {
    const order: string[] = []
    const saveRatings = async () => void order.push('ratings')
    const saveNote = async () => void order.push('note')
    await expect(persistJournalEntry(saveRatings, saveNote)).resolves.toBe('saved')
    expect(order).toEqual(['ratings', 'note'])
  })

  it('si fallan los ratings corta: la nota no se llama y devuelve failed', async () => {
    let noteCalls = 0
    const saveRatings = async () => {
      throw new Error('offline')
    }
    const saveNote = async () => void noteCalls++
    await expect(persistJournalEntry(saveRatings, saveNote)).resolves.toBe('failed')
    expect(noteCalls).toBe(0)
  })

  it('si falla la nota tras ratings ok devuelve failed; el reintento re-ejecuta ambos', async () => {
    let ratingsCalls = 0
    let noteFails = true
    const saveRatings = async () => void ratingsCalls++
    const saveNote = async () => {
      if (noteFails) throw new Error('quota')
    }
    await expect(persistJournalEntry(saveRatings, saveNote)).resolves.toBe('failed')
    expect(ratingsCalls).toBe(1)
    // El reintento re-ejecuta ambos pasos (los repos son idempotentes por upsert/modify).
    noteFails = false
    await expect(persistJournalEntry(saveRatings, saveNote)).resolves.toBe('saved')
    expect(ratingsCalls).toBe(2)
  })
})
