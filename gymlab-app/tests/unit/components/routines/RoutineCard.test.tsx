// @vitest-environment jsdom
// Tarjeta editorial de rutina: meta con conteo, kicker de rutina propia y favorito accesible.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import { RoutineCard } from '@/components/routines/RoutineCard'
import type { Routine } from '@/domain/types'

const routine: Routine = {
  id: 5,
  slug: 'ppl-volumen',
  title: 'PPL Volumen',
  objective: 'volumen',
  level: 'intermedio',
  description: '',
  daysCount: 3,
  imageUrl: '/images/routines/ppl-volumen.jpg',
}

const renderCard = (props: Partial<Parameters<typeof RoutineCard>[0]> = {}) =>
  render(
    <MemoryRouter>
      <RoutineCard
        routine={routine}
        isFav={false}
        onToggleFav={() => {}}
        fallbackImages={[]}
        {...props}
      />
    </MemoryRouter>,
  )

afterEach(cleanup)

describe('RoutineCard', () => {
  it('muestra nivel, frecuencia y total de ejercicios en una sola línea', () => {
    renderCard({ exerciseCount: 18 })
    expect(screen.getByText('Intermedio · 3 días/semana · 18 ejercicios')).toBeTruthy()
  })

  it('omite el conteo cuando el dato no está disponible', () => {
    renderCard()
    expect(screen.getByText('Intermedio · 3 días/semana')).toBeTruthy()
    expect(screen.queryByText(/ejercicios/)).toBeNull()
  })

  it('una sesión suelta reemplaza la frecuencia por «Sesión suelta»', () => {
    renderCard({ routine: { ...routine, daysCount: 1 } })
    expect(screen.getByText('Intermedio · Sesión suelta')).toBeTruthy()
  })

  it('las rutinas propias muestran el badge recibido como kicker', () => {
    renderCard({ routine: { ...routine, isCustom: true }, badge: 'Basada en PPL Volumen' })
    expect(screen.getByText('Basada en PPL Volumen')).toBeTruthy()
  })

  it('el link apunta al detalle y toma el título como nombre accesible', () => {
    renderCard()
    const link = screen.getByRole('link', { name: 'PPL Volumen' })
    expect(link.getAttribute('href')).toBe('/rutinas/ppl-volumen')
  })

  it('el favorito expone aria-pressed y alterna al tocarlo', () => {
    const onToggleFav = vi.fn()
    renderCard({ onToggleFav })
    const button = screen.getByRole('button', { name: 'Añadir a favoritas: PPL Volumen' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(onToggleFav).toHaveBeenCalledTimes(1)
  })

  it('con la rutina marcada el botón pide quitarla y queda presionado', () => {
    renderCard({ isFav: true })
    const button = screen.getByRole('button', { name: 'Quitar de favoritas: PPL Volumen' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })
})
