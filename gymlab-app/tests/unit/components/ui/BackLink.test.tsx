// @vitest-environment jsdom
// BackLink (F134/T3): vuelve al historial interno cuando existe y usa `to` como
// fallback en un deep link (primera entrada de la sesión).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import '@/i18n'
import { BackLink } from '@/components/ui/BackLink'

const Target = ({ name }: { name: string }) => {
  const location = useLocation()
  return (
    <div>
      <span data-testid="target">{name}</span>
      <span data-testid="search">{location.search}</span>
    </div>
  )
}

const Detail = ({ to }: { to: string }) => (
  <div>
    <BackLink to={to} />
    <span data-testid="detail">detalle</span>
  </div>
)

afterEach(cleanup)

describe('BackLink', () => {
  it('en un deep link sin historial navega a `to`', () => {
    render(
      <MemoryRouter initialEntries={['/ejercicios/curl']}>
        <Routes>
          <Route path="/ejercicios/:slug" element={<Detail to="/ejercicios" />} />
          <Route path="/ejercicios" element={<Target name="lista" />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('link'))

    expect(screen.getByTestId('target').textContent).toBe('lista')
  })

  it('con historial interno vuelve a la pantalla anterior', () => {
    render(
      <MemoryRouter initialEntries={['/ejercicios?q=curl', '/ejercicios/curl']} initialIndex={1}>
        <Routes>
          <Route path="/rutinas" element={<Target name="rutinas" />} />
          <Route path="/ejercicios" element={<Target name="lista" />} />
          <Route path="/ejercicios/:slug" element={<Detail to="/rutinas" />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('link'))

    // Vuelve al catálogo (con su query), no al `to` del componente.
    expect(screen.getByTestId('target').textContent).toBe('lista')
    expect(screen.getByTestId('search').textContent).toBe('?q=curl')
  })
})
