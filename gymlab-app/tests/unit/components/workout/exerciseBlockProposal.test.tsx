// @vitest-environment jsdom
// F122: superficie del bloque — propuesta de escalada (aplicable con un toque), aviso de
// consolidación discreto, aviso del récord re-originado en la propuesta y botón de
// calentamiento a pedido (45 % del primer peso pendiente).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'

// El mock conserva la clave y las variables de interpolación para asertar lo renderizado.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => `${key}|${JSON.stringify(opts ?? {})}`,
    i18n: { language: 'es' },
  }),
}))

import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { useActiveWorkoutStore, type ActiveSet } from '@/store/activeWorkoutStore'
import type { DayProposal } from '@/domain/workingProgression'

const set = (id: string, weightKg: number, overrides: Partial<ActiveSet> = {}): ActiveSet => ({
  id,
  exerciseId: 1,
  exerciseName: 'Prensa',
  setNumber: Number(id.replace(/\D/g, '')) || 1,
  weightKg,
  reps: 10,
  completed: false,
  ...overrides,
})

const seed = (sets: ActiveSet[]) => {
  useActiveWorkoutStore.setState({
    exercises: [{ exerciseId: 1, exerciseName: 'Prensa', sets }],
  })
}

const baseProps = {
  exerciseId: 1,
  prMap: new Map(),
  units: 'kg' as const,
  showLoadSuggestion: true,
}

beforeEach(() => {
  useActiveWorkoutStore.setState({ exercises: [] })
})
afterEach(() => cleanup())

describe('ExerciseBlock — propuesta de escalada (F122)', () => {
  it('muestra la escalada y el tap aplica la lista completa de pesos', () => {
    seed([set('s1', 80), set('s2', 80), set('s3', 80)])
    const onApplyEscalada = vi.fn()
    const proposal: DayProposal = { kind: 'escalada', weightsKg: [80, 85, 90], capped: false }
    const { container, getByText } = render(
      <ExerciseBlock {...baseProps} dayProposal={proposal} onApplyEscalada={onApplyEscalada} />
    )
    expect(container.textContent).toContain('workout.escaladaRango')
    fireEvent.click(getByText(/workout\.escaladaRango/))
    expect(onApplyEscalada).toHaveBeenCalledWith(1, [80, 85, 90])
  })

  it('se oculta cuando las pendientes ya son la escalada (aplicada o igualada)', () => {
    seed([set('s1', 80), set('s2', 85), set('s3', 90)])
    const proposal: DayProposal = { kind: 'escalada', weightsKg: [80, 85, 90], capped: false }
    const { container } = render(<ExerciseBlock {...baseProps} dayProposal={proposal} />)
    expect(container.textContent).not.toContain('workout.escaladaRango')
  })

  it('consolidando: aviso discreto sin botón', () => {
    seed([set('s1', 80)])
    const { container } = render(
      <ExerciseBlock {...baseProps} dayProposal={{ kind: 'consolidate' }} />
    )
    expect(container.textContent).toContain('workout.consolidando')
    expect(container.textContent).not.toContain('workout.escaladaRango')
  })

  it('el aviso del récord sale del capped de la propuesta', () => {
    seed([set('s1', 80)])
    const proposal: DayProposal = { kind: 'escalada', weightsKg: [80, 82], capped: true }
    const { container } = render(<ExerciseBlock {...baseProps} dayProposal={proposal} />)
    expect(container.textContent).toContain('workout.cappedByPr')
  })

  it('con el toggle apagado no hay superficies de peso', () => {
    seed([set('s1', 80)])
    const proposal: DayProposal = { kind: 'escalada', weightsKg: [80, 90], capped: true }
    const { container } = render(
      <ExerciseBlock {...baseProps} showLoadSuggestion={false} dayProposal={proposal} />
    )
    expect(container.textContent).not.toContain('workout.escaladaRango')
    expect(container.textContent).not.toContain('workout.cappedByPr')
  })

  it('con deload activo tampoco se propone peso', () => {
    seed([set('s1', 80)])
    const proposal: DayProposal = { kind: 'escalada', weightsKg: [80, 90], capped: false }
    const { container } = render(
      <ExerciseBlock {...baseProps} deloadActive dayProposal={proposal} />
    )
    expect(container.textContent).not.toContain('workout.escaladaRango')
  })
})

describe('ExerciseBlock — botón de calentamiento a pedido (F122)', () => {
  it('agrega una serie al 45% del primer peso pendiente', () => {
    seed([set('s1', 80), set('s2', 80)])
    const onSuggestionWarmup = vi.fn()
    const { getByLabelText } = render(
      <ExerciseBlock {...baseProps} onSuggestionWarmup={onSuggestionWarmup} />
    )
    fireEvent.click(getByLabelText(/agregarCalentamientoAria/))
    expect(onSuggestionWarmup).toHaveBeenCalledWith(1, 36)
  })

  it('sin pesos pendientes usa la base reciente como referencia', () => {
    seed([set('s1', 0)])
    const onSuggestionWarmup = vi.fn()
    const { getByLabelText } = render(
      <ExerciseBlock {...baseProps} recentTopSetAvgKg={80} onSuggestionWarmup={onSuggestionWarmup} />
    )
    fireEvent.click(getByLabelText(/agregarCalentamientoAria/))
    expect(onSuggestionWarmup).toHaveBeenCalledWith(1, 36)
  })
})
