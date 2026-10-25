// @vitest-environment jsdom
// F132.6: sheet de alta de suplemento con guardado condicionado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { AddSupplementSheet } from '@/components/supplements/AddSupplementSheet'

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('AddSupplementSheet', () => {
  it('mantiene Guardar deshabilitado hasta completar nombre y dosis', () => {
    render(<AddSupplementSheet onAdd={() => {}} onClose={() => {}} />)
    const save = screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement
    expect(save.disabled).toBe(true)
    fireEvent.change(screen.getByPlaceholderText('Nombre del suplemento'), {
      target: { value: 'Zinc' },
    })
    expect(save.disabled).toBe(true)
    fireEvent.change(screen.getByPlaceholderText('Dosis (ej: 5 g, 200 mg)'), {
      target: { value: '10 mg' },
    })
    expect(save.disabled).toBe(false)
  })

  it('agrega con la frecuencia elegida y cierra', () => {
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(<AddSupplementSheet onAdd={onAdd} onClose={onClose} />)
    fireEvent.change(screen.getByPlaceholderText('Nombre del suplemento'), {
      target: { value: 'Zinc' },
    })
    fireEvent.change(screen.getByPlaceholderText('Dosis (ej: 5 g, 200 mg)'), {
      target: { value: '10 mg' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Semanal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onAdd).toHaveBeenCalledWith({
      name: 'Zinc',
      dose: '10 mg',
      frequency: 'semanal',
      active: true,
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('cancelar no escribe', () => {
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(<AddSupplementSheet onAdd={onAdd} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
