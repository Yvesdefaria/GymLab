// @vitest-environment jsdom
// Detalle del músculo seleccionado en /cuerpo: estado, último entreno y ejercicios.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import { CuerpoSelected } from '@/components/body/CuerpoSelected'
import type { Exercise } from '@/domain/types'

const exercises = [
  { id: 1, slug: 'press-banca', name: 'Press banca', muscleGroup: 'pecho' },
  { id: 2, slug: 'press-inclinado', name: 'Press inclinado', muscleGroup: 'pecho' },
] as unknown as Exercise[]

afterEach(cleanup)

describe('CuerpoSelected', () => {
  it('sin selección muestra el hint', () => {
    render(
      <MemoryRouter>
        <CuerpoSelected
          selected={null}
          fatigue={{}}
          lastDate={null}
          daysAgo={null}
          exercises={[]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Toca un músculo/)).toBeTruthy()
  })

  it('pinta el músculo, la fatiga, el último entreno y los ejercicios', () => {
    render(
      <MemoryRouter>
        <CuerpoSelected
          selected="pecho"
          fatigue={{ pecho: 'fatigued' }}
          lastDate="2026-10-23"
          daysAgo={1}
          exercises={exercises}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Pecho')).toBeTruthy()
    expect(screen.getByText(/Fatigado/)).toBeTruthy()
    expect(screen.getByText(/último entreno hace 1 d/)).toBeTruthy()
    expect(screen.getByText('Press banca')).toBeTruthy()
    expect(screen.getByText('Press banca').closest('a')?.getAttribute('href')).toBe(
      '/ejercicios/press-banca',
    )
    expect(screen.getByText('Ver biblioteca')).toBeTruthy()
  })

  it('sin datos de fatiga no inventa un estado recuperado', () => {
    render(
      <MemoryRouter>
        <CuerpoSelected
          selected="pecho"
          fatigue={{}}
          lastDate={null}
          daysAgo={null}
          exercises={[]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Sin datos/)).toBeTruthy()
    expect(screen.getByText(/sin entrenos registrados/)).toBeTruthy()
    expect(screen.getByText('Sin ejercicios en este grupo.')).toBeTruthy()
  })
})
