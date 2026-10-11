// Tests de la lógica pura de useWorkoutNote (F84/R3-2): el guardado se exporta
// aparte para testearlo sin jsdom (patrón del repo, ver useRecentLoadHistory);
// el glue React/IndexedDB se cubre con el build y la regresión e2e.
import { describe, expect, it, vi } from 'vitest'
import { saveWorkoutNote } from '@/hooks/useWorkoutNote'

describe('saveWorkoutNote (F84/R3-2)', () => {
  it('sin workout (null) no llama al update', async () => {
    const update = vi.fn(async (_id: number, _patch: { notes: string }) => undefined)
    await saveWorkoutNote(update, null, ' nota ')
    expect(update).not.toHaveBeenCalled()
  })

  it('recorta el valor y pasa el id correcto', async () => {
    const update = vi.fn(async (_id: number, _patch: { notes: string }) => undefined)
    await saveWorkoutNote(update, 7, '  hola  ')
    expect(update).toHaveBeenCalledWith(7, { notes: 'hola' })
  })

  it('propaga el rechazo del update', async () => {
    const update = vi.fn(async (_id: number, _patch: { notes: string }) => {
      throw new Error('offline')
    })
    await expect(saveWorkoutNote(update, 7, 'nota')).rejects.toThrow('offline')
  })
})
