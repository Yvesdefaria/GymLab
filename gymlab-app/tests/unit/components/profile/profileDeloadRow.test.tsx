// @vitest-environment jsdom
// Fila de deload: switch accesible, persistencia y rechazo del repo sin
// promesa sin manejar (el hallazgo R3-5 del review).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@/i18n'
import { toLocalDateStr } from '@/domain/dates'
import type { Workout } from '@/domain/types'

const spies = vi.hoisted(() => ({
  setDeload: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('@/hooks/useActiveProgram', () => ({
  useActiveProgram: () => ({
    program: { id: 1, routineId: 1, deloadActive: false, deloadUntil: null },
  }),
}))
vi.mock('@/hooks/useLiveList', () => ({ useLiveList: () => [] }))
vi.mock('@/data/repositories', () => ({
  activeProgramRepo: { setDeload: spies.setDeload },
  workoutSetRepo: { getByWorkoutIds: vi.fn(async () => []) },
}))
vi.mock('@/domain/deload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/deload')>()
  return {
    ...actual,
    calcDeloadScore: () => ({ overall: 42, signals: {} }),
    isDeloadActive: () => false,
    deloadUntilDate: () => '2026-10-30',
  }
})
vi.mock('@/lib/logger', () => ({ logger: { warn: spies.warn } }))

import { ProfileDeloadRow } from '@/components/profile/ProfileDeloadRow'

const today = toLocalDateStr()
const workout: Workout = {
  id: 1,
  startedAt: `${today}T10:00:00`,
  finishedAt: `${today}T11:00:00`,
  routineId: null,
  routineDayId: null,
  localDate: today,
  notes: '',
  totalVolume: 12000,
}

beforeEach(() => {
  spies.setDeload.mockReset()
  spies.setDeload.mockResolvedValue(undefined)
  spies.warn.mockReset()
})

afterEach(cleanup)

describe('ProfileDeloadRow', () => {
  it('muestra el score y persiste el switch con el switch accesible', async () => {
    render(<ProfileDeloadRow workouts={[workout]} />)
    expect(screen.getByText(/Señal 42\/100/)).toBeTruthy()

    const toggle = screen.getByRole('switch')
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(toggle)

    await waitFor(() => expect(spies.setDeload).toHaveBeenCalledWith(true, '2026-10-30'))
    await waitFor(() => expect(toggle.hasAttribute('disabled')).toBe(false))
  })

  it('un rechazo del repo se registra y no deja la promesa sin manejar', async () => {
    spies.setDeload.mockRejectedValueOnce(new Error('boom'))
    render(<ProfileDeloadRow workouts={[workout]} />)

    fireEvent.click(screen.getByRole('switch'))

    await waitFor(() => expect(spies.warn).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.getByRole('switch').hasAttribute('disabled')).toBe(false),
    )
  })

  it('no renderiza nada sin entrenos', () => {
    const { container } = render(<ProfileDeloadRow workouts={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
