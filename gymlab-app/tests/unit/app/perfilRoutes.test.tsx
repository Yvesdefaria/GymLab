// @vitest-environment jsdom
// La ruta /perfil/historial se prueba renderizando el router real: matcher,
// orden de rutas y lazy import. Los stubs evitan Dexie y el shell completo.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

vi.mock('@/components/layout/AppShell', async () => {
  const { Outlet } = await import('react-router-dom')
  return { AppShell: () => <Outlet /> }
})

vi.mock('@/pages/PerfilPage', () => ({
  PerfilPage: () => <div>perfil-stub</div>,
}))

vi.mock('@/pages/PerfilHistorialPage', () => ({
  PerfilHistorialPage: () => <div>historial-stub</div>,
}))

import { AppRouter } from '@/app/router'

afterEach(() => {
  cleanup()
  window.history.pushState({}, '', '/')
})

const renderAt = (path: string) => {
  window.history.pushState({}, '', path)
  render(<AppRouter />)
}

describe('router — rutas de perfil', () => {
  it('renderiza la subpágina en /perfil/historial', async () => {
    renderAt('/perfil/historial')
    expect(await screen.findByText('historial-stub')).toBeTruthy()
    expect(screen.queryByText('perfil-stub')).toBeNull()
  })

  it('renderiza el perfil en /perfil sin caer en la subpágina', async () => {
    renderAt('/perfil')
    expect(await screen.findByText('perfil-stub')).toBeTruthy()
    expect(screen.queryByText('historial-stub')).toBeNull()
  })
})
