// @vitest-environment jsdom
// BottomSheet: diálogo modal con título asociado, foco inicial y cierre por Escape/backdrop.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { BottomSheet } from '@/components/ui/BottomSheet'

const renderSheet = (onClose = vi.fn()) =>
  render(
    <BottomSheet title="Filtros" subtitle="Acotá el catálogo" onClose={onClose}>
      <button type="button">Programa</button>
    </BottomSheet>,
  )

afterEach(cleanup)

describe('BottomSheet', () => {
  it('expone un diálogo modal con el título asociado y el foco inicial', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const titleId = dialog.getAttribute('aria-labelledby')
    expect(titleId).toBeTruthy()
    expect(document.getElementById(titleId!)?.textContent).toBe('Filtros')
    expect(document.activeElement).toBe(dialog)
  })

  it('cierra con Escape', () => {
    const onClose = vi.fn()
    renderSheet(onClose)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cierra al tocar el backdrop y no al tocar el panel', () => {
    const onClose = vi.fn()
    renderSheet(onClose)
    fireEvent.click(screen.getByRole('button', { name: 'Programa' }))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
