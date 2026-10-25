// @vitest-environment jsdom
// F132.4: héroe de Objetivos. Pinnea la conversión a la unidad del usuario y
// los tres fallbacks (sin objetivos, sin proyección, todos alcanzados).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { GoalHero } from '@/components/goals/GoalHero'
import type { GoalProjection } from '@/domain/goalProjection'

const projection = (overrides: Partial<GoalProjection> = {}): GoalProjection => ({
  exerciseId: 1,
  exerciseName: 'Press de pecho con barra',
  currentE1rm: 112.5,
  targetE1rm: 150,
  weeklyImprovementRate: 0.5,
  weeksToTarget: 75,
  estimatedDate: '2028-02-14',
  reached: false,
  ...overrides,
})

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('GoalHero', () => {
  it('formatea el peso meta y el recorrido en la unidad del usuario', () => {
    render(
      <GoalHero
        goalsCount={1}
        featured={projection()}
        allReached={false}
        units="lb"
        onAdd={() => {}}
      />
    )
    expect(screen.getByTestId('goal-hero-target').textContent).toBe('330,7 lb e1RM')
    expect(screen.getByText(/→ 330,7 lb$/)).not.toBeNull()
  })

  it('sin objetivos muestra el estado vacío y la CTA', () => {
    render(
      <GoalHero goalsCount={0} featured={null} allReached={false} units="kg" onAdd={() => {}} />
    )
    expect(screen.getByText('Sin objetivos todavía')).not.toBeNull()
    expect(screen.getByRole('button', { name: /agregar objetivo/i })).not.toBeNull()
  })

  it('con objetivos sin proyección no inventa una fecha', () => {
    render(
      <GoalHero goalsCount={2} featured={null} allReached={false} units="kg" onAdd={() => {}} />
    )
    expect(screen.getByText('Sin proyección todavía')).not.toBeNull()
  })

  it('con todos alcanzados lo dice en verde', () => {
    render(<GoalHero goalsCount={2} featured={null} allReached units="kg" onAdd={() => {}} />)
    const text = screen.getByText('2 de 2 alcanzados')
    expect(text.className).toContain('text-success')
  })
})


