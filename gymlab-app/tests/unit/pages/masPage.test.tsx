// @vitest-environment jsdom
// /mas debe aplicar la misma puerta que /perfil: un avatar restaurado por backup
// no puede terminar como src remoto (beacon con IP/Referer).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'

const avatar = vi.hoisted(() => ({ current: '' }))

vi.mock('@/hooks/useAvatar', () => ({
  useAvatar: () => ({ avatarUri: avatar.current, setAvatar: vi.fn() }),
}))
vi.mock('@/hooks/useProfileName', () => ({
  useProfileName: () => ({ name: 'Yves', setName: vi.fn() }),
}))
vi.mock('@/hooks/useActiveProgram', () => ({
  useActiveProgram: () => ({ routine: null }),
}))
vi.mock('@/hooks/usePeriodization', () => ({
  usePeriodization: () => ({ activePlan: null }),
}))

import { MasPage } from '@/pages/MasPage'

const renderMas = () =>
  render(
    <MemoryRouter initialEntries={['/mas']}>
      <MasPage />
    </MemoryRouter>,
  )

describe('MasPage avatar', () => {
  beforeEach(() => {
    avatar.current = ''
  })

  afterEach(cleanup)

  it('no renderiza un avatar remoto restaurado', () => {
    avatar.current = 'https://collector.example/gymlab.png?src=mas'
    const { container } = renderMas()
    expect(container.querySelector('img[src^="https://collector.example"]')).toBeNull()
  })

  it('sí renderiza un preset local permitido', () => {
    avatar.current = '/avatars/avatar-01.jpg'
    const { container } = renderMas()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/avatars/avatar-01.jpg')
  })

  it('cae a la inicial cuando el avatar no es seguro', () => {
    avatar.current = 'javascript:alert(1)'
    renderMas()
    expect(document.querySelector('img')).toBeNull()
  })
})
