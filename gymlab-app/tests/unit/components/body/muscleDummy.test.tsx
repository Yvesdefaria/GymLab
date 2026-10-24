// @vitest-environment jsdom
// Mapa muscular: leyenda de cinco niveles, selección por click/teclado y modo no interactivo.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { MuscleDummy } from '@/components/body/MuscleDummy'

afterEach(cleanup)

describe('MuscleDummy', () => {
  it('muestra los cinco niveles de la leyenda, incluido sin datos', () => {
    render(<MuscleDummy fatigue={{}} />)
    expect(screen.getByText('Recuperado')).toBeTruthy()
    expect(screen.getByText('Activo')).toBeTruthy()
    expect(screen.getByText('Fatigado')).toBeTruthy()
    expect(screen.getByText('Muy reciente')).toBeTruthy()
    expect(screen.getByText('Sin datos')).toBeTruthy()
  })

  it('selecciona un músculo por click y por teclado', () => {
    const onSelect = vi.fn()
    render(<MuscleDummy fatigue={{ pecho: 'fatigued' }} onSelect={onSelect} />)

    const pecho = screen.getAllByRole('button', { name: 'Pecho' })
    expect(pecho.length).toBeGreaterThan(0)

    fireEvent.click(pecho[0])
    expect(onSelect).toHaveBeenCalledWith('pecho')

    fireEvent.keyDown(pecho[0], { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  it('no expone botones cuando no hay onSelect', () => {
    render(<MuscleDummy fatigue={{}} showLegend={false} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
