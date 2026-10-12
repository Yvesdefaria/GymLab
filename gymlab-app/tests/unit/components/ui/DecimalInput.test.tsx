// @vitest-environment jsdom
// 102.followups(b) — R3-DECIMAL-INPUT-WIRING (lote 16): el filtro al pintar y el
// commit del DecimalInput solo se cubrían a nivel de `numberGuard` (puro). Este
// test monta el componente REAL con un harness controlado y observa qué texto
// queda pintado en el input y qué valor llega a `onChange`/`onEnter`.
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { DecimalInput } from '@/components/ui/DecimalInput'

// Harness controlado: dueño del valor (como lo sería el bloque padre) y espejo
// del valor actual para observar qué entregó `onChange`.
type HarnessProps = {
  initial?: number
  onChange: (value: number | undefined) => void
  onEnter?: () => void
  min?: number
  max?: number
  mode?: 'decimal' | 'integer'
}

const Harness = ({ initial, onChange, onEnter, min, max, mode }: HarnessProps) => {
  const [value, setValue] = useState<number | undefined>(initial)
  return (
    <>
      <DecimalInput
        value={value}
        onChange={(next) => {
          onChange(next)
          setValue(next)
        }}
        min={min}
        max={max}
        mode={mode}
        ariaLabel="campo"
        onEnter={onEnter}
      />
      <output data-testid="value">{String(value)}</output>
    </>
  )
}

const renderHarness = (
  props: { initial?: number; min?: number; max?: number; mode?: 'decimal' | 'integer' } = {}
) => {
  const onChange = vi.fn()
  const onEnter = vi.fn()
  const view = render(<Harness onChange={onChange} onEnter={onEnter} {...props} />)
  const input = view.getByLabelText('campo') as HTMLInputElement
  return { onChange, onEnter, view, input }
}

afterEach(() => {
  // El repo no usa `globals: true`: RTL no auto-limpia, hay que desmontar a mano.
  cleanup()
})

describe('DecimalInput — cableado real del filtro y el commit', () => {
  it('filtra al pintar y confirma el decimal limpio en el mismo change', () => {
    const { onChange, view, input } = renderHarness()

    fireEvent.change(input, { target: { value: '12,5abc' } })

    // El input nunca muestra la basura: el borrador se filtra ANTES de pintar.
    expect(input.value).toBe('12,5')
    expect(onChange).toHaveBeenLastCalledWith(12.5)
    expect(view.getByTestId('value').textContent).toBe('12.5')
  })

  it('basura que deja el borrador vacío no limpia; el blur restaura el valor guardado', () => {
    const { onChange, input } = renderHarness({ initial: 12.5 })

    fireEvent.change(input, { target: { value: 'abc' } })

    // El vacío nacido de basura se ignora (no debe borrar el 12.5 almacenado).
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.blur(input)
    expect(input.value).toBe('12.5')
  })

  it('vacío real limpia el valor (onChange undefined)', () => {
    const { onChange, input } = renderHarness({ initial: 12.5 })

    fireEvent.change(input, { target: { value: '' } })

    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  it('Enter confirma el borrador pendiente y dispara onEnter', () => {
    const { onChange, onEnter, input } = renderHarness()

    fireEvent.change(input, { target: { value: '7,5' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenLastCalledWith(7.5)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('en modo integer retiene el separador y confirma 12, nunca 125', () => {
    const { onChange, input } = renderHarness({ initial: 12, mode: 'integer' })

    fireEvent.change(input, { target: { value: '12,5' } })

    // El separador retenido bloquea la parte decimal: sin él terminaría en '125'.
    expect(input.value).toBe('12,')
    expect(onChange).toHaveBeenLastCalledWith(12)
  })

  it('recorta al rango min/max al confirmar', () => {
    const { onChange, input } = renderHarness({ min: 1, max: 10 })

    fireEvent.change(input, { target: { value: '99' } })

    expect(onChange).toHaveBeenLastCalledWith(10)
  })
})
