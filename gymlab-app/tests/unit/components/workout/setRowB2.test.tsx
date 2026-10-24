// @vitest-environment jsdom
// F132.2/B2 — contrato de la tabla de series: columnas RPE/RIR on/off, CAL,
// PR y deload. La fila es una sola línea; el número de columnas lo decide la
// grilla compartida con el header del ExerciseBlock.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import { SetRow } from '@/components/workout/SetRow'
import { useActiveWorkoutStore, type ActiveSet } from '@/store/activeWorkoutStore'

const set = (overrides: Partial<ActiveSet> = {}): ActiveSet => ({
  id: 's1',
  exerciseId: 1,
  exerciseName: 'Press banca',
  setNumber: 1,
  weightKg: 60,
  reps: 8,
  completed: false,
  ...overrides,
})

const seed = (overrides: Partial<ActiveSet> = {}) => {
  useActiveWorkoutStore.setState({
    exercises: [{ exerciseId: 1, exerciseName: 'Press banca', sets: [set(overrides)] }],
  })
}

const renderRow = (props: Partial<React.ComponentProps<typeof SetRow>> = {}) =>
  render(
    <SetRow
      exerciseId={1}
      setId="s1"
      isPR={false}
      units="kg"
      onUpdate={vi.fn()}
      onRemove={vi.fn()}
      {...props}
    />
  )

beforeEach(() => {
  useActiveWorkoutStore.setState({ exercises: [] })
})

afterEach(() => cleanup())

describe('SetRow B2 — columnas', () => {
  it('con RPE y RIR muestra las dos columnas', () => {
    seed()
    const { container } = renderRow({ showRpe: true, showRir: true })
    expect(container.querySelector('[data-testid="set-row"]')?.getAttribute('data-columns')).toBe(
      'rpe-rir'
    )
  })

  it('sin RPE ni RIR no renderiza columnas de esfuerzo', () => {
    seed()
    const { container } = renderRow({ showRpe: false, showRir: false })
    expect(container.querySelector('[data-testid="set-row"]')?.getAttribute('data-columns')).toBe(
      'none'
    )
    expect(container.querySelector('input[aria-label="workout.rpeSerie"]')).toBeNull()
    expect(container.querySelector('input[aria-label="workout.rirSerie"]')).toBeNull()
  })
})

describe('SetRow B2 — estados de la serie', () => {
  it('una serie de calentamiento muestra CAL y RPE/RIR en —, sin inputs', () => {
    seed({ isWarmup: true })
    const { container } = renderRow({ showRpe: true, showRir: true })
    const row = container.querySelector('[data-testid="set-row"]')
    expect(row?.textContent).toContain('workout.cal')
    expect(container.querySelector('input[aria-label="workout.rpeSerie"]')).toBeNull()
    expect(container.querySelector('input[aria-label="workout.rirSerie"]')).toBeNull()
  })

  it('una serie PR muestra el badge PR', () => {
    seed({ completed: true })
    const { container } = renderRow({ isPR: true })
    expect(container.querySelector('[data-testid="set-row"]')?.textContent).toContain('PR')
  })

  it('en deload muestra el peso sugerido junto al actual', () => {
    seed({ weightKg: 60 })
    const { container } = renderRow({ deloadSuggestion: '54 kg' })
    expect(container.querySelector('[data-testid="set-row"]')?.textContent).toContain('54 kg')
  })
})
