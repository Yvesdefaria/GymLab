// @vitest-environment jsdom
// Borrador de rutina persistido (F134/T2): el trabajo a medias sobrevive a salir de
// la pantalla, y el aviso de restauración aparece solo cuando hay algo que retomar.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { useRoutineDraft } from '@/hooks/useRoutineDraft'
import { useRoutineDraftStore } from '@/store/routineDraftStore'

// Sin Dexie en este test: el borrador en modo creación no toca la base, y el de
// edición solo necesita que el repo responda "no existe".
vi.mock('@/hooks/useRoutines', () => ({
  useRoutineSlugs: () => ({ slugs: [] }),
}))
vi.mock('@/data/repositories', () => ({
  routineRepo: {
    getBySlug: vi.fn(async () => undefined),
    getDays: vi.fn(async () => []),
    getItems: vi.fn(async () => []),
    updateRoutine: vi.fn(),
    createRoutine: vi.fn(),
  },
  exerciseRepo: { getByIds: vi.fn(async () => []) },
}))

const Probe = ({ slug }: { slug?: string }) => {
  const draft = useRoutineDraft(slug)
  return (
    <div>
      <input
        aria-label="titulo"
        value={draft.title}
        onChange={(event) => draft.setTitle(event.target.value)}
      />
      <span data-testid="dias">{draft.days.length}</span>
      <span data-testid="restaurado">{String(draft.restored)}</span>
      <button type="button" onClick={draft.addDay}>
        add
      </button>
      <button type="button" onClick={() => draft.removeDay(0)}>
        remove
      </button>
      <button type="button" onClick={draft.discard}>
        discard
      </button>
    </div>
  )
}

beforeEach(() => {
  useRoutineDraftStore.setState({ draft: null })
})

afterEach(() => {
  cleanup()
  useRoutineDraftStore.setState({ draft: null })
})

describe('useRoutineDraft — borrador persistido', () => {
  it('guarda lo escrito en el store con scope new y marca el borrador como sucio', () => {
    render(<Probe />)

    fireEvent.change(screen.getByLabelText('titulo'), { target: { value: 'Mi rutina' } })

    const draft = useRoutineDraftStore.getState().draft
    expect(draft?.scope).toBe('new')
    expect(draft?.title).toBe('Mi rutina')
    expect(draft?.dirty).toBe(true)
  })

  it('al volver a montar restaura el borrador y avisa', () => {
    const first = render(<Probe />)
    fireEvent.change(screen.getByLabelText('titulo'), { target: { value: 'Push Pull' } })
    fireEvent.click(screen.getByText('add'))
    first.unmount()

    render(<Probe />)

    expect((screen.getByLabelText('titulo') as HTMLInputElement).value).toBe('Push Pull')
    expect(screen.getByTestId('dias').textContent).toBe('2')
    expect(screen.getByTestId('restaurado').textContent).toBe('true')
  })

  it('un borrador limpio (cargado, sin cambios) no muestra el aviso', () => {
    useRoutineDraftStore.setState({
      draft: {
        scope: 'new',
        title: 'Cargada de Dexie',
        objective: 'volumen',
        level: 'principiante',
        description: '',
        days: [{ name: 'Día 1', items: [] }],
        routineId: null,
        dirty: false,
        updatedAt: Date.now(),
      },
    })

    render(<Probe />)

    expect(screen.getByTestId('restaurado').textContent).toBe('false')
  })

  it('descartar borra el borrador y vuelve a los valores por defecto', () => {
    render(<Probe />)
    fireEvent.change(screen.getByLabelText('titulo'), { target: { value: 'Temporal' } })

    fireEvent.click(screen.getByText('discard'))

    expect(useRoutineDraftStore.getState().draft).toBeNull()
    expect((screen.getByLabelText('titulo') as HTMLInputElement).value).toBe('')
    expect(screen.getByTestId('restaurado').textContent).toBe('false')
  })

  it('quitar el único día no crea ni ensucia el borrador', () => {
    render(<Probe />)

    fireEvent.click(screen.getByText('remove'))

    expect(useRoutineDraftStore.getState().draft).toBeNull()
    expect(screen.getByTestId('dias').textContent).toBe('1')
  })

  it('el borrador de una rutina no se aplica a otra', () => {
    // Borrador del modo creación.
    render(<Probe />)
    fireEvent.change(screen.getByLabelText('titulo'), { target: { value: 'Borrador nuevo' } })
    cleanup()

    // Otro scope (edición de otra rutina) no lo muestra.
    render(<Probe slug="otra-rutina" />)

    expect((screen.getByLabelText('titulo') as HTMLInputElement).value).toBe('')
  })
})
