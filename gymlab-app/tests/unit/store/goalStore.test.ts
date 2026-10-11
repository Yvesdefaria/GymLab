// Store de objetivos de e1rm (R3-DEFAULT-DEPS-UNPROVED): cubre el comportamiento
// que usa el reset de fábrica (`reset()` dentro de defaultDeps.resetStores) y las
// mutaciones básicas. Entorno node de vitest: se sustituye localStorage por un
// mapa en memoria ANTES de importar el store, porque el persist hidrata al
// cargar el módulo (patrón factoryReset.test.ts / activeWorkoutStore.test.ts).
import { beforeEach, describe, expect, it, vi } from 'vitest'

const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value)
  },
  removeItem: (key: string) => {
    memory.delete(key)
  },
  clear: () => {
    memory.clear()
  },
})

const { useGoalStore } = await import('@/store/goalStore')

describe('useGoalStore', () => {
  beforeEach(() => {
    memory.clear()
    useGoalStore.setState({ goals: {} })
  })

  it('setGoal agrega un objetivo nuevo', () => {
    useGoalStore.getState().setGoal(7, 100)
    expect(useGoalStore.getState().goals).toEqual({ 7: 100 })
  })

  it('setGoal actualiza el objetivo existente sin tocar los demás', () => {
    useGoalStore.getState().setGoal(7, 100)
    useGoalStore.getState().setGoal(9, 80)
    useGoalStore.getState().setGoal(7, 105)
    expect(useGoalStore.getState().goals).toEqual({ 7: 105, 9: 80 })
  })

  it('removeGoal elimina solo el objetivo indicado', () => {
    useGoalStore.getState().setGoal(7, 100)
    useGoalStore.getState().setGoal(9, 80)
    useGoalStore.getState().removeGoal(7)
    expect(useGoalStore.getState().goals).toEqual({ 9: 80 })
  })

  it('reset deja el store vacío (lo usa el reset de fábrica)', () => {
    useGoalStore.getState().setGoal(7, 100)
    useGoalStore.getState().reset()
    expect(useGoalStore.getState().goals).toEqual({})
  })
})
