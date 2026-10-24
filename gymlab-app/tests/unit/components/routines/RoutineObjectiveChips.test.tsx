// @vitest-environment jsdom
// Chips de objetivo: conteos visibles, aria-pressed y selección exclusiva con "Todos".
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { RoutineObjectiveChips } from '@/components/routines/RoutineObjectiveChips'

const counts = { fuerza: 13, volumen: 15, definicion: 9, resistencia: 10, general: 21 }

afterEach(cleanup)

describe('RoutineObjectiveChips', () => {
  it('muestra Todos con el total y los cinco objetivos con su conteo', () => {
    render(<RoutineObjectiveChips objective={null} counts={counts} total={68} onChange={() => {}} lang="es" />)
    expect(screen.getByRole('button', { name: 'Todos 68' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fuerza 13' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'General 21' })).toBeTruthy()
  })

  it('marca solo el chip activo', () => {
    render(<RoutineObjectiveChips objective="fuerza" counts={counts} total={68} onChange={() => {}} lang="es" />)
    expect(screen.getByRole('button', { name: 'Fuerza 13' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Todos 68' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('emite el objetivo elegido y null desde Todos', () => {
    const onChange = vi.fn()
    render(<RoutineObjectiveChips objective="fuerza" counts={counts} total={68} onChange={onChange} lang="es" />)
    fireEvent.click(screen.getByRole('button', { name: 'Volumen 15' }))
    expect(onChange).toHaveBeenCalledWith('volumen')
    fireEvent.click(screen.getByRole('button', { name: 'Todos 68' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
