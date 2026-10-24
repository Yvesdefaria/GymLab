// @vitest-environment jsdom
// Regla del rediseño: un widget sin datos reales no se renderiza.
// Cubre los bloques que antes mostraban empty states o ceros decorativos.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import { HeroCard } from '@/components/home/HeroCard'
import { HomeProgress } from '@/components/home/HomeProgress'
import { HomeMiscLinks } from '@/components/home/HomeMiscLinks'
import { PastSelfView } from '@/components/home/PastSelfView'
import { PlateauAlerts } from '@/components/home/PlateauAlerts'
import type { ActiveProgram } from '@/domain/types'

// Retos: el catálogo real siempre devuelve alguno; acá se fuerza el vacío para
// verificar que la sección desaparece por completo.
vi.mock('@/domain/challenges', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/challenges')>()
  return { ...actual, getAvailableChallenges: () => [] }
})

import { DynamicChallenges } from '@/components/challenges/DynamicChallenges'

const PROGRAM: ActiveProgram = {
  id: 1,
  routineId: 1,
  startDate: '2026-01-01',
  weekdays: [1],
  createdAt: '2026-01-01T00:00:00.000Z',
}

const heroProps = {
  heroImage: '/images/home-hero.jpg',
  hasActiveWorkout: false,
  todayDone: false,
  todayDay: null,
  todayGroups: [],
  sessionPct: 0,
  programPct: 0,
  onStart: vi.fn(),
  onChangeDay: vi.fn(),
  onContinue: vi.fn(),
}

afterEach(cleanup)

describe('home sin datos — los bloques no se renderizan', () => {
  it('PlateauAlerts no deja rastro cuando no hay estancamientos', () => {
    const { container } = render(<PlateauAlerts sets={[]} exercises={[]} />)
    expect(container.innerHTML).toBe("")
  })

  it('PastSelfView no deja rastro cuando no hay comparación posible', () => {
    const { container } = render(
      <PastSelfView workouts={[]} sets={[]} entries={[]} />,
    )
    expect(container.innerHTML).toBe("")
  })

  it('HomeProgress no deja rastro sin historial', () => {
    const { container } = render(
      <HomeProgress workouts={[]} summary={null} units="kg" />,
    )
    expect(container.innerHTML).toBe("")
  })

  it('DynamicChallenges no deja rastro sin retos disponibles', () => {
    const { container } = render(
      <DynamicChallenges level="principiante" statsByDuration={{} as never} />,
    )
    expect(container.innerHTML).toBe("")
  })

  it('el héroe sin programa no muestra un anillo de progreso vacío', () => {
    render(
      <MemoryRouter>
        <HeroCard {...heroProps} program={null} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.getByText('Ver rutinas')).toBeTruthy()
  })

  it('el héroe con programa muestra el anillo y el CTA de inicio', () => {
    render(
      <MemoryRouter>
        <HeroCard {...heroProps} program={PROGRAM} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('progressbar')).toBeTruthy()
    expect(screen.getByRole('button', { name: /iniciar entrenamiento/i })).toBeTruthy()
  })
})

describe('HomeMiscLinks — ancla del tour', () => {
  it('sin week strip, el atajo de calendario conserva el ancla', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeMiscLinks calendarAnchor />
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-tour="home-calendar"]')).toBeTruthy()
    expect(container.querySelector('[data-tour="home-goals"]')).toBeTruthy()
  })

  it('con week strip visible, el atajo no duplica el ancla del calendario', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeMiscLinks />
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-tour="home-calendar"]')).toBeNull()
    expect(container.querySelector('[data-tour="home-goals"]')).toBeTruthy()
  })
})
