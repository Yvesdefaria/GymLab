import { beforeEach, describe, expect, it } from 'vitest'
import { usePlannerStore } from '@/store/plannerStore'
import { DEFAULT_SESSION_DURATION_MIN } from '@/domain/routineResolution'

beforeEach(() => {
  usePlannerStore.getState().reset()
})

describe('usePlannerStore', () => {
  it('arranca con los defaults y sin configurar', () => {
    const state = usePlannerStore.getState()
    expect(state.level).toBe('principiante')
    expect(state.objective).toBe('volumen')
    expect(state.daysPerWeek).toBe(4)
    expect(state.sessionDurationMin).toBe(DEFAULT_SESSION_DURATION_MIN)
    expect(state.configured).toBe(false)
  })

  it('setConfig marca la config como elegida por el usuario', () => {
    usePlannerStore.getState().setConfig({ level: 'avanzado', daysPerWeek: 5 })

    const state = usePlannerStore.getState()
    expect(state.level).toBe('avanzado')
    expect(state.daysPerWeek).toBe(5)
    expect(state.configured).toBe(true)
  })

  it('applyPrefill no marca la config como elegida (el onboarding no es una preferencia)', () => {
    usePlannerStore.getState().applyPrefill({ objective: 'fuerza', sessionDurationMin: 75 })

    const state = usePlannerStore.getState()
    expect(state.objective).toBe('fuerza')
    expect(state.sessionDurationMin).toBe(75)
    expect(state.configured).toBe(false)
  })

  it('reset vuelve a los defaults y desmarca configured', () => {
    usePlannerStore.getState().setConfig({ level: 'avanzado' })
    usePlannerStore.getState().reset()

    const state = usePlannerStore.getState()
    expect(state.level).toBe('principiante')
    expect(state.configured).toBe(false)
  })
})
