// @vitest-environment jsdom
// F132.6: fila de suplemento con check diario, frecuencia neutra y borrado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { SupplementRow } from '@/components/supplements/SupplementRow'
import type { SupplementEntry } from '@/domain/types'

const supplement: SupplementEntry = {
  id: 9,
  name: 'Creatina monohidratada',
  dose: '5 g',
  frequency: 'diario',
  active: true,
  createdAt: '2026-10-25T10:00:00.000Z',
  lastCheckedAt: new Date().toISOString(),
}

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('SupplementRow', () => {
  it('muestra nombre, dosis y frecuencia', () => {
    render(<SupplementRow supplement={supplement} onToggle={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('Creatina monohidratada')).not.toBeNull()
    expect(screen.getByText(/5 g/)).not.toBeNull()
    expect(screen.getByText(/Diario/)).not.toBeNull()
  })

  it('el check refleja el estado tomado y avisa el toggle', () => {
    const onToggle = vi.fn()
    render(<SupplementRow supplement={supplement} onToggle={onToggle} onDelete={() => {}} />)
    const check = screen.getByRole('button', { name: 'Tomado hoy' })
    expect(check.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(check)
    expect(onToggle).toHaveBeenCalledWith(supplement)
  })

  it('pendiente no usa verde y borra con etiqueta', () => {
    const onDelete = vi.fn()
    const pending = { ...supplement, lastCheckedAt: undefined }
    render(<SupplementRow supplement={pending} onToggle={() => {}} onDelete={onDelete} />)
    const check = screen.getByRole('button', { name: 'Tomado hoy' })
    expect(check.getAttribute('aria-pressed')).toBe('false')
    expect(check.className).not.toContain('bg-success')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Creatina monohidratada' }))
    expect(onDelete).toHaveBeenCalledWith(9)
  })
})
