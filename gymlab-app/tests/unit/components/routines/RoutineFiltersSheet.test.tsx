// @vitest-environment jsdom
// Sheet de filtros: borrador (no aplica al tocar), conteo en vivo y Limpiar.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { RoutineFiltersSheet } from '@/components/routines/RoutineFiltersSheet'

const base = { type: 'todas' as const, objective: null, level: null }

const renderSheet = (props: Partial<Parameters<typeof RoutineFiltersSheet>[0]> = {}) => {
  const onApply = vi.fn()
  const onClose = vi.fn()
  const countFor = vi.fn(() => 5)
  render(
    <RoutineFiltersSheet
      value={base}
      countFor={countFor}
      onApply={onApply}
      onClose={onClose}
      {...props}
    />,
  )
  return { onApply, onClose, countFor }
}

afterEach(cleanup)

describe('RoutineFiltersSheet', () => {
  it('muestra el conteo en vivo en el botón de aplicar', () => {
    renderSheet()
    expect(screen.getByRole('button', { name: 'Ver 5 rutinas' })).toBeTruthy()
  })

  it('no aplica al tocar un filtro: solo al confirmar', () => {
    const { onApply, countFor } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Programa' }))
    expect(onApply).not.toHaveBeenCalled()
    expect(countFor).toHaveBeenLastCalledWith({ ...base, type: 'programa' })
    fireEvent.click(screen.getByRole('button', { name: 'Ver 5 rutinas' }))
    expect(onApply).toHaveBeenCalledWith({ ...base, type: 'programa' })
  })

  it('Limpiar vuelve a Todas y sin nivel', () => {
    const { onApply, countFor } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Avanzado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(countFor).toHaveBeenLastCalledWith(base)
    fireEvent.click(screen.getByRole('button', { name: 'Ver 5 rutinas' }))
    expect(onApply).toHaveBeenCalledWith(base)
  })

  it('cerrar sin confirmar descarta el borrador', () => {
    const { onApply } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Programa' }))
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onApply).not.toHaveBeenCalled()
  })
})
