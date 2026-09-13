// Store de sesión activa: deadline de descanso persistido y reconciliado (F96, D4).
// Entorno node de vitest: se sustituye localStorage por un mapa en memoria antes
// de importar el store, porque la persistencia hidrata al cargar el módulo.
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

const { useActiveWorkoutStore } = await import('@/store/activeWorkoutStore')

const STORAGE_KEY = 'gymLab-activeWorkout'
const NOW = 1_700_000_000_000

const nowSpy = vi.spyOn(Date, 'now')
const serialize = (state: Record<string, unknown>) => JSON.stringify({ state, version: 0 })

const partialize = () => {
  const fn = useActiveWorkoutStore.persist.getOptions().partialize
  if (!fn) throw new Error('partialize missing')
  return fn(useActiveWorkoutStore.getState())
}

describe('activeWorkoutStore — deadline de descanso', () => {
  beforeEach(() => {
    memory.clear()
    nowSpy.mockReturnValue(NOW)
    useActiveWorkoutStore.setState({
      isResting: false,
      restRemaining: 0,
      restEndsAt: null,
      restSeconds: 90,
    })
  })

  it('startRest ancla el deadline al reloj de pared', () => {
    useActiveWorkoutStore.getState().startRest()
    expect(useActiveWorkoutStore.getState().restEndsAt).toBe(NOW + 90_000)
    expect(useActiveWorkoutStore.getState().restRemaining).toBe(90)
    expect(useActiveWorkoutStore.getState().isResting).toBe(true)
  })

  it('reconcileRest deriva el restante del deadline aunque se pierdan ticks', () => {
    useActiveWorkoutStore.getState().startRest()
    nowSpy.mockReturnValue(NOW + 30_000)
    expect(useActiveWorkoutStore.getState().reconcileRest()).toBe(true)
    expect(useActiveWorkoutStore.getState().restRemaining).toBe(60)
    expect(useActiveWorkoutStore.getState().isResting).toBe(true)
  })

  it('reconcileRest corta y asienta en cero al vencer el deadline', () => {
    useActiveWorkoutStore.getState().startRest()
    nowSpy.mockReturnValue(NOW + 90_000)
    expect(useActiveWorkoutStore.getState().reconcileRest()).toBe(false)
    expect(useActiveWorkoutStore.getState().isResting).toBe(false)
    expect(useActiveWorkoutStore.getState().restRemaining).toBe(0)
    expect(useActiveWorkoutStore.getState().restEndsAt).toBeNull()
  })

  it('reconcileRest sin descanso activo no hace nada', () => {
    expect(useActiveWorkoutStore.getState().reconcileRest()).toBe(false)
  })

  it('stopRest borra el deadline', () => {
    useActiveWorkoutStore.getState().startRest()
    useActiveWorkoutStore.getState().stopRest()
    expect(useActiveWorkoutStore.getState().restEndsAt).toBeNull()
    expect(useActiveWorkoutStore.getState().isResting).toBe(false)
  })

  it('partialize guarda el deadline sólo mientras hay descanso', () => {
    expect(partialize().restEndsAt).toBeNull()
    useActiveWorkoutStore.getState().startRest()
    expect(partialize().restEndsAt).toBe(NOW + 90_000)
  })

  it('rehidratar un descanso guardado recalcula el restante del deadline', async () => {
    memory.set(STORAGE_KEY, serialize({ restEndsAt: NOW + 42_000 }))
    await useActiveWorkoutStore.persist.rehydrate()
    expect(useActiveWorkoutStore.getState().isResting).toBe(true)
    expect(useActiveWorkoutStore.getState().restRemaining).toBe(42)
    expect(useActiveWorkoutStore.getState().restEndsAt).toBe(NOW + 42_000)
  })

  it('rehidratar un deadline vencido deja el descanso terminado', async () => {
    memory.set(STORAGE_KEY, serialize({ restEndsAt: NOW - 5_000 }))
    await useActiveWorkoutStore.persist.rehydrate()
    expect(useActiveWorkoutStore.getState().isResting).toBe(false)
    expect(useActiveWorkoutStore.getState().restRemaining).toBe(0)
    expect(useActiveWorkoutStore.getState().restEndsAt).toBeNull()
  })

  it('rehidratar un estado previo a F96 (sin restEndsAt) no deja descanso fantasma', async () => {
    memory.set(STORAGE_KEY, serialize({ workoutId: 7 }))
    await useActiveWorkoutStore.persist.rehydrate()
    expect(useActiveWorkoutStore.getState().isResting).toBe(false)
    expect(useActiveWorkoutStore.getState().restRemaining).toBe(0)
    expect(useActiveWorkoutStore.getState().workoutId).toBe(7)
  })
})
