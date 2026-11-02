// @vitest-environment jsdom
// El nombre del ejercicio en la sesión activa abre su ficha (/ejercicios/:slug).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// El mock conserva la clave y las variables de interpolación para asertar lo renderizado.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => `${key}|${JSON.stringify(opts ?? {})}`,
    i18n: { language: 'es' },
  }),
}))

import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { useActiveWorkoutStore, type ActiveSet } from '@/store/activeWorkoutStore'

const workSet: ActiveSet = {
  id: 's1',
  exerciseId: 1,
  exerciseName: 'Prensa',
  setNumber: 1,
  weightKg: 80,
  reps: 10,
  completed: false,
}

const renderBlock = (exerciseSlug?: string) =>
  render(
    <MemoryRouter>
      <ExerciseBlock
        exerciseId={1}
        prMap={new Map()}
        units="kg"
        showLoadSuggestion={false}
        exerciseSlug={exerciseSlug}
      />
    </MemoryRouter>
  )

beforeEach(() => {
  useActiveWorkoutStore.setState({
    exercises: [{ exerciseId: 1, exerciseName: 'Prensa', sets: [workSet] }],
  })
})

afterEach(() => cleanup())

describe('ExerciseBlock — nombre del ejercicio', () => {
  it('abre la ficha del ejercicio al tocar el nombre', () => {
    renderBlock('prensa-45')
    const link = screen.getByRole('link', { name: 'Prensa' })
    expect(link.getAttribute('href')).toBe('/ejercicios/prensa-45')
  })

  it('sin slug del catálogo el nombre sigue siendo texto plano', () => {
    renderBlock(undefined)
    expect(screen.queryByRole('link', { name: 'Prensa' })).toBeNull()
    expect(screen.getByText('Prensa')).toBeTruthy()
  })
})
