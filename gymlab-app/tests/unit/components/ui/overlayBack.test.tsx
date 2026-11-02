// @vitest-environment jsdom
// Cierre de overlays con el back físico de Android: el overlay montado registra su
// handler en la pila LIFO y, al desmontarse, no deja basura que consuma el back (F134/T1).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import '@/i18n'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { StepSheet } from '@/components/steps/StepSheet'
import { resetBackHandlers, runBackHandlers } from '@/lib/backHandlers'

beforeEach(() => {
  resetBackHandlers()
})

afterEach(() => {
  cleanup()
  resetBackHandlers()
})

describe('overlays y botón back físico', () => {
  it('ConfirmSheet se cierra con el back y consume el evento', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmSheet title="Salir" message="Se pierde el progreso" onConfirm={() => {}} onCancel={onCancel} />
    )

    expect(runBackHandlers()).toBe(true)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('BottomSheet se cierra con el back y consume el evento', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet title="Filtros" onClose={onClose}>
        <p>contenido</p>
      </BottomSheet>
    )

    expect(runBackHandlers()).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('al desmontarse, el overlay deja de consumir el back', () => {
    const onClose = vi.fn()
    const { unmount } = render(
      <BottomSheet title="Filtros" onClose={onClose}>
        <p>contenido</p>
      </BottomSheet>
    )

    unmount()

    expect(runBackHandlers()).toBe(false)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('el overlay más reciente gana sobre el anterior', () => {
    const first = vi.fn()
    const second = vi.fn()
    render(
      <>
        <BottomSheet title="Primero" onClose={first}>
          <p>uno</p>
        </BottomSheet>
        <BottomSheet title="Segundo" onClose={second}>
          <p>dos</p>
        </BottomSheet>
      </>
    )

    expect(runBackHandlers()).toBe(true)
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it('Escape sigue cerrando el overlay', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmSheet title="Salir" message="Se pierde el progreso" onConfirm={() => {}} onCancel={onCancel} />
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('un overlay montado pero cerrado no consume el back ni el Escape', () => {
    const onClose = vi.fn()
    render(
      <StepSheet open={false} title="Opciones" onClose={onClose}>
        <p>contenido</p>
      </StepSheet>
    )

    expect(runBackHandlers()).toBe(false)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('el mismo overlay consume el back cuando se abre', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <StepSheet open={false} title="Opciones" onClose={onClose}>
        <p>contenido</p>
      </StepSheet>
    )

    rerender(
      <StepSheet open title="Opciones" onClose={onClose}>
        <p>contenido</p>
      </StepSheet>
    )

    expect(runBackHandlers()).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
