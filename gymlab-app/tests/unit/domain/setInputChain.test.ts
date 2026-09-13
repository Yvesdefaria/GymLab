// Tests del orden puro de la cadena de foco (F98.4, numeric-input R1): orden por rol
// y por serie, nunca por DOM, para que el rediseño 98.5 no pueda romperlo.
import { describe, expect, it } from 'vitest'
import { buildSetInputOrder, nextSetInput, setInputKey } from '@/domain/setInputChain'
import type { SetInputRef } from '@/domain/setInputChain'

const sets = [{ id: 's1' }, { id: 's2' }]

describe('buildSetInputOrder', () => {
  it('sin modo fuerza encadena peso y reps por serie', () => {
    expect(buildSetInputOrder(sets, false)).toEqual([
      { setId: 's1', field: 'weight' },
      { setId: 's1', field: 'reps' },
      { setId: 's2', field: 'weight' },
      { setId: 's2', field: 'reps' },
    ])
  })

  it('con modo fuerza añade RPE y RIR tras reps', () => {
    expect(buildSetInputOrder([{ id: 's1' }], true)).toEqual([
      { setId: 's1', field: 'weight' },
      { setId: 's1', field: 'reps' },
      { setId: 's1', field: 'rpe' },
      { setId: 's1', field: 'rir' },
    ])
  })

  it('sin series devuelve una cadena vacía', () => {
    expect(buildSetInputOrder([], true)).toEqual([])
  })

  it('respeta el orden de las series recibido (no el DOM)', () => {
    expect(buildSetInputOrder([{ id: 'z' }, { id: 'a' }], false)).toEqual([
      { setId: 'z', field: 'weight' },
      { setId: 'z', field: 'reps' },
      { setId: 'a', field: 'weight' },
      { setId: 'a', field: 'reps' },
    ])
  })
})

describe('nextSetInput', () => {
  const forceOrder = buildSetInputOrder(sets, true)
  const plainOrder = buildSetInputOrder(sets, false)

  it('avanza dentro de la fila: peso → reps', () => {
    expect(nextSetInput(plainOrder, { setId: 's1', field: 'weight' })).toEqual({
      setId: 's1',
      field: 'reps',
    })
  })

  it('en modo fuerza sigue reps → RPE → RIR', () => {
    expect(nextSetInput(forceOrder, { setId: 's1', field: 'reps' })).toEqual({
      setId: 's1',
      field: 'rpe',
    })
    expect(nextSetInput(forceOrder, { setId: 's1', field: 'rpe' })).toEqual({
      setId: 's1',
      field: 'rir',
    })
  })

  it('el último campo de una serie salta al primer input de la siguiente', () => {
    expect(nextSetInput(plainOrder, { setId: 's1', field: 'reps' })).toEqual({
      setId: 's2',
      field: 'weight',
    })
    expect(nextSetInput(forceOrder, { setId: 's1', field: 'rir' })).toEqual({
      setId: 's2',
      field: 'weight',
    })
  })

  it('el último input de la última serie no tiene siguiente (blur)', () => {
    expect(nextSetInput(plainOrder, { setId: 's2', field: 'reps' })).toBeNull()
    expect(nextSetInput(forceOrder, { setId: 's2', field: 'rir' })).toBeNull()
  })

  it('salta campos no registrados si el predicado lo indica', () => {
    // Simula RPE no renderizada (showRpe off): reps → RIR.
    const isFocusable = (ref: SetInputRef) => ref.field !== 'rpe'
    expect(nextSetInput(forceOrder, { setId: 's1', field: 'reps' }, isFocusable)).toEqual({
      setId: 's1',
      field: 'rir',
    })
  })

  it('un input fuera de la cadena no tiene siguiente', () => {
    expect(nextSetInput(plainOrder, { setId: 'sX', field: 'weight' })).toBeNull()
  })
})

describe('setInputKey', () => {
  it('compone la clave del registro como setId:field', () => {
    expect(setInputKey('s1', 'weight')).toBe('s1:weight')
    expect(setInputKey('abc', 'rir')).toBe('abc:rir')
  })
})
