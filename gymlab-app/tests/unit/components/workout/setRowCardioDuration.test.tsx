// @vitest-environment jsdom
// 102.followups(a) — R3-002 (lote 21): round-trip del campo duración cardio.
// El input muestra el valor guardado en el MISMO modelo del saneador del borrador
// ('mm:ss', minutos acumulados: 7200 s → '120:00') y al enfocar selecciona todo el
// texto: editar = reteclear dígitos, sin corrupción por append ni reemplazos
// silenciosos del valor guardado (el formato 'clock' mostraba '2:00:00' y un solo
// keystroke lo reformateaba a '200:00' = 12000 s).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'

// El componente solo usa `t`; identidad para asertar las claves i18n.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { SetRow } from '@/components/workout/SetRow'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { sanitizeDecimalDraft } from '@/domain/numberGuard'

// La fila lee su serie del store: se siembra una serie cardio con la duración dada.
const seedCardioSet = (durationSeconds?: number) => {
  useActiveWorkoutStore.setState({
    exercises: [
      {
        exerciseId: 10,
        exerciseName: 'Cinta',
        sets: [
          {
            id: 'set-1',
            exerciseId: 10,
            exerciseName: 'Cinta',
            setNumber: 1,
            weightKg: 0,
            reps: 0,
            completed: false,
            durationSeconds,
          },
        ],
      },
    ],
  })
}

const renderRow = () => {
  const onUpdate = vi.fn()
  const view = render(
    <SetRow
      exerciseId={10}
      setId="set-1"
      isPR={false}
      units="kg"
      isCardio
      onUpdate={onUpdate}
      onRemove={vi.fn()}
    />
  )
  const input = view.getByLabelText('workout.duracionSerie') as HTMLInputElement
  return { input, onUpdate }
}

afterEach(() => {
  // El repo no usa `globals: true`: RTL no auto-limpia, hay que desmontar a mano.
  cleanup()
})

describe('SetRow cardio — round-trip del campo duración (lote 21)', () => {
  it('con ≥ 1 h muestra los minutos acumulados (120:00), no el formato clock (2:00:00)', () => {
    seedCardioSet(7200)
    const { input } = renderRow()

    expect(input.value).toBe('120:00')
  })

  it('al enfocar selecciona todo el texto para reteclear dígitos', () => {
    seedCardioSet(7200)
    const { input } = renderRow()

    fireEvent.focus(input)

    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('el display coincide con el modelo del saneador (reforma idéntica)', () => {
    seedCardioSet(7200)
    const { input } = renderRow()

    // Contrato del round-trip: lo que se muestra es punto fijo del saneador del
    // borrador, así cualquier edición parte de un texto que él mismo conserva.
    expect(input.value).toBe(sanitizeDecimalDraft(input.value, 'duration'))
  })

  it('teclear tras el foco produce el saneado m:ss sin valores ×10', () => {
    seedCardioSet(7200)
    const { input, onUpdate } = renderRow()

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '205' } })

    expect(input.value).toBe('2:05')
    expect(onUpdate).toHaveBeenLastCalledWith('set-1', { durationSeconds: 125 })
  })
})
