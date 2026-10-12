// @vitest-environment jsdom
// 84.unificacion-nota.followups-3(b) — R3-2 (lote 19): el panel de la nota no
// puede quedar mudo si la carga falla. failed=true → aviso accesible en lugar
// del copy «vacía» y sin lápiz; ready → nota/«vacía» + lápiz como siempre.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

// El componente solo usa `t`; identidad para asertar las claves i18n.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Estado controlable por caso: sin Dexie ni queries reales en jsdom.
const { noteState } = vi.hoisted(() => ({
  noteState: {
    note: undefined as string | undefined,
    ready: false,
    failed: false,
    save: vi.fn(async () => undefined),
  },
}))

vi.mock('@/hooks/useWorkoutNote', () => ({
  useWorkoutNote: () => ({ ...noteState }),
}))

import { WorkoutNotePanel } from '@/components/workout/WorkoutNotePanel'

beforeEach(() => {
  noteState.note = undefined
  noteState.ready = false
  noteState.failed = false
})

afterEach(() => {
  // El repo no usa `globals: true`: RTL no auto-limpia, hay que desmontar a mano.
  cleanup()
})

describe('WorkoutNotePanel — estados de carga (lote 19)', () => {
  it('failed: aviso accesible, sin lápiz y sin el copy «vacía»', () => {
    noteState.failed = true
    const view = render(<WorkoutNotePanel workoutId={1} />)

    expect(view.getByRole('group', { name: 'session.notaTitulo' })).toBeTruthy()
    expect(view.getByRole('alert').textContent).toBe('session.notaNoCargada')
    expect(view.queryByText('session.notaVacia')).toBeNull()
    expect(view.queryByRole('button', { name: 'session.notaAnadir' })).toBeNull()
    expect(view.queryByRole('button', { name: 'session.notaEditar' })).toBeNull()
  })

  it('ready con nota: la muestra y ofrece editar', () => {
    noteState.note = 'Press banca pesado'
    noteState.ready = true
    const view = render(<WorkoutNotePanel workoutId={1} />)

    expect(view.getByText('Press banca pesado')).toBeTruthy()
    expect(view.getByRole('button', { name: 'session.notaEditar' })).toBeTruthy()
    expect(view.queryByRole('alert')).toBeNull()
  })

  it('ready sin nota: copy «vacía» y acción de añadir', () => {
    noteState.note = ''
    noteState.ready = true
    const view = render(<WorkoutNotePanel workoutId={1} />)

    expect(view.getByText('session.notaVacia')).toBeTruthy()
    expect(view.getByRole('button', { name: 'session.notaAnadir' })).toBeTruthy()
  })
})
