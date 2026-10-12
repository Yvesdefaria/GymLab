// @vitest-environment jsdom
// 84.unificacion-nota.followups-3 (a) — R3-JOURNAL-SAVE-ERROR (lote 16): la rama
// de fallo del guardado del journal (ratings OK + nota que rechaza) solo se
// auditaba en la FUENTE. jsdom + RTL ejercitan el flujo real del sheet: aviso
// accesible, cierre bloqueado, botón re-habilitado y reintento posterior.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { SessionJournalSheet } from '@/components/journal/SessionJournalSheet'

// El componente solo usa `t`; identidad para asertar las claves i18n.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Spies hoisted: los hooks se mockean por módulo y el componente los consume
// como dependencias externas (sin Dexie ni queries reales en jsdom).
const { journalSaveSpy, noteSaveSpy } = vi.hoisted(() => ({
  journalSaveSpy: vi.fn(async () => undefined),
  noteSaveSpy: vi.fn(async () => undefined),
}))

vi.mock('@/hooks/useSessionJournal', () => ({
  useSessionJournal: () => ({ entry: undefined, save: journalSaveSpy }),
}))

vi.mock('@/hooks/useWorkoutNote', () => ({
  useWorkoutNote: () => ({ note: undefined, save: noteSaveSpy, ready: true }),
}))

beforeEach(() => {
  journalSaveSpy.mockReset()
  noteSaveSpy.mockReset()
  // Default sano: cada caso configura solo el fallo que quiere ejercitar.
  journalSaveSpy.mockResolvedValue(undefined)
  noteSaveSpy.mockResolvedValue(undefined)
})

afterEach(() => {
  // El repo no usa `globals: true`: RTL no auto-limpia, hay que desmontar a mano.
  cleanup()
})

const renderSheet = () => {
  const onClose = vi.fn()
  const view = render(<SessionJournalSheet workoutId={1} onClose={onClose} />)
  const saveButton = view.getByRole('button', { name: 'journal.guardar' }) as HTMLButtonElement
  return { onClose, view, saveButton }
}

describe('SessionJournalSheet — guardado y rama de fallo', () => {
  it('si la nota rechaza muestra el aviso, no cierra y re-habilita Guardar', async () => {
    noteSaveSpy.mockRejectedValueOnce(new Error('sin storage'))
    const { onClose, view, saveButton } = renderSheet()

    fireEvent.click(saveButton)

    const alert = await view.findByRole('alert')
    expect(alert.textContent).toBe('journal.saveError')
    expect(onClose).not.toHaveBeenCalled()
    expect(saveButton.disabled).toBe(false)
    // Ambos intentos ocurrieron: ratings primero y nota después (R3-1).
    expect(journalSaveSpy).toHaveBeenCalledTimes(1)
    expect(noteSaveSpy).toHaveBeenCalledTimes(1)
  })

  it('tras el fallo, un reintento con storage sano cierra el sheet', async () => {
    noteSaveSpy.mockRejectedValueOnce(new Error('sin storage'))
    const { onClose, view, saveButton } = renderSheet()

    fireEvent.click(saveButton)
    await view.findByRole('alert')

    // Reconfigura a resolver: el reintento completa la secuencia completa.
    journalSaveSpy.mockResolvedValue(undefined)
    noteSaveSpy.mockResolvedValue(undefined)
    fireEvent.click(saveButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  // R3-JOURNAL-FIRST-SAVE-REJECT (lote 17): el fallo de la PRIMERA escritura
  // (ratings) también corta la secuencia — la nota no llega a intentarse — y el
  // reintento posterior re-ejecuta el guardado completo hasta cerrar.
  it('si la PRIMERA escritura (ratings) rechaza: avisa, no intenta la nota y el reintento cierra', async () => {
    journalSaveSpy.mockRejectedValueOnce(new Error('sin storage'))
    const { onClose, view, saveButton } = renderSheet()

    fireEvent.click(saveButton)

    const alert = await view.findByRole('alert')
    expect(alert.textContent).toBe('journal.saveError')
    expect(onClose).not.toHaveBeenCalled()
    // Secuencial (persistJournalEntry): el fallo de ratings corta ANTES de la nota.
    expect(noteSaveSpy).not.toHaveBeenCalled()
    expect(saveButton.disabled).toBe(false)

    // Reintento sano: la secuencia completa corre y cierra el sheet.
    journalSaveSpy.mockResolvedValue(undefined)
    noteSaveSpy.mockResolvedValue(undefined)
    fireEvent.click(saveButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(journalSaveSpy).toHaveBeenCalledTimes(2)
    expect(noteSaveSpy).toHaveBeenCalledTimes(1)
  })

  it('camino feliz: ambos guardados resuelven, cierra y sin aviso', async () => {
    const { onClose, view, saveButton } = renderSheet()

    fireEvent.click(saveButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(view.queryByRole('alert')).toBeNull()
  })
})
