// @vitest-environment jsdom
// Estado en la URL (F134/T3): defaults, validación de valores basura, escritura con
// replace y omisión de defaults para que la URL limpia no arrastre parámetros.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router-dom'
import {
  urlEnum,
  urlFlag,
  urlNumber,
  urlNumberFrom,
  urlPattern,
  urlText,
  useUrlState,
} from '@/hooks/useUrlState'

const SCHEMA = {
  q: urlText('q'),
  muscle: urlEnum('musculo', ['pecho', 'espalda'] as const, null),
  day: urlNumber('dia', 0),
  fav: urlFlag('fav'),
  month: urlPattern('mes', /^\d{4}-\d{2}$/, '2026-11'),
  range: urlNumberFrom('rango', [30, 90, 0] as const, 30),
}

const Probe = () => {
  const [state, update] = useUrlState(SCHEMA)
  const location = useLocation()
  const navigationType = useNavigationType()
  return (
    <div>
      <span data-testid="q">{state.q}</span>
      <span data-testid="muscle">{state.muscle ?? '-'}</span>
      <span data-testid="day">{state.day}</span>
      <span data-testid="fav">{String(state.fav)}</span>
      <span data-testid="month">{state.month}</span>
      <span data-testid="range">{state.range}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="navtype">{navigationType}</span>
      <button type="button" onClick={() => update({ q: 'sentadilla' })}>
        set-q
      </button>
      <button type="button" onClick={() => update({ muscle: 'pecho' })}>
        set-muscle
      </button>
      <button type="button" onClick={() => update({ fav: true })}>
        set-fav
      </button>
      <button type="button" onClick={() => update({ q: '' })}>
        clear-q
      </button>
      <button
        type="button"
        onClick={() => {
          // Dos escrituras en el mismo gesto: deben sobrevivir las dos.
          update({ q: 'remo' })
          update({ fav: true })
        }}
      >
        set-both
      </button>
    </div>
  )
}

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Probe />
    </MemoryRouter>
  )

afterEach(cleanup)

describe('useUrlState', () => {
  it('sin parámetros devuelve los defaults', () => {
    renderAt('/ejercicios')

    expect(screen.getByTestId('q').textContent).toBe('')
    expect(screen.getByTestId('muscle').textContent).toBe('-')
    expect(screen.getByTestId('day').textContent).toBe('0')
    expect(screen.getByTestId('fav').textContent).toBe('false')
    expect(screen.getByTestId('month').textContent).toBe('2026-11')
  })

  it('lee valores válidos de la URL', () => {
    renderAt('/ejercicios?q=sentadilla&musculo=pecho&dia=2&fav=1&mes=2026-03')

    expect(screen.getByTestId('q').textContent).toBe('sentadilla')
    expect(screen.getByTestId('muscle').textContent).toBe('pecho')
    expect(screen.getByTestId('day').textContent).toBe('2')
    expect(screen.getByTestId('fav').textContent).toBe('true')
    expect(screen.getByTestId('month').textContent).toBe('2026-03')
  })

  it('un valor inválido cae al default sin romper la pantalla', () => {
    renderAt('/ejercicios?musculo=xxx&dia=abc&mes=marzo')

    expect(screen.getByTestId('muscle').textContent).toBe('-')
    expect(screen.getByTestId('day').textContent).toBe('0')
    expect(screen.getByTestId('month').textContent).toBe('2026-11')
  })

  it('escribe el estado en la query y omite los defaults', () => {
    renderAt('/ejercicios')
    fireEvent.click(screen.getByText('set-q'))
    fireEvent.click(screen.getByText('set-fav'))

    expect(screen.getByTestId('search').textContent).toContain('q=sentadilla')
    expect(screen.getByTestId('search').textContent).toContain('fav=1')

    fireEvent.click(screen.getByText('clear-q'))

    expect(screen.getByTestId('search').textContent).not.toContain('q=')
    expect(screen.getByTestId('q').textContent).toBe('')
  })

  it('conserva los parámetros que no se tocan', () => {
    renderAt('/ejercicios?dia=3')

    fireEvent.click(screen.getByText('set-muscle'))

    expect(screen.getByTestId('search').textContent).toContain('dia=3')
    expect(screen.getByTestId('search').textContent).toContain('musculo=pecho')
    expect(screen.getByTestId('muscle').textContent).toBe('pecho')
  })

  it('dos escrituras en el mismo gesto no se pisan', () => {
    renderAt('/ejercicios')

    fireEvent.click(screen.getByText('set-both'))

    expect(screen.getByTestId('q').textContent).toBe('remo')
    expect(screen.getByTestId('fav').textContent).toBe('true')
  })

  it('escribe con replace para no crear una entrada de historial por tecla', () => {
    renderAt('/ejercicios')

    fireEvent.click(screen.getByText('set-q'))

    expect(screen.getByTestId('navtype').textContent).toBe('REPLACE')
  })

  it('un rango vacío cae al default y no al primer valor permitido', () => {
    // `0` es un rango válido: sin el guard de vacío, `?rango=` seleccionaría 0.
    renderAt('/estadisticas?rango=')

    expect(screen.getByTestId('range').textContent).toBe('30')
  })
})
