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

describe('activeWorkoutStore — modo de descanso Auto (F96, D2)', () => {
  beforeEach(() => {
    memory.clear()
    nowSpy.mockReturnValue(NOW)
    useActiveWorkoutStore.setState({
      isResting: false,
      restRemaining: 0,
      restEndsAt: null,
      restSeconds: 90,
      restMode: 'auto',
      routineRestSec: null,
      autoRestSeconds: 90,
    })
  })

  it('arranca en Auto por defecto', () => {
    expect(useActiveWorkoutStore.getState().restMode).toBe('auto')
  })

  it('Auto sin rutina usa la recomendación pasada al iniciar', () => {
    useActiveWorkoutStore.getState().startRest(240)
    expect(useActiveWorkoutStore.getState().restMode).toBe('auto')
    expect(useActiveWorkoutStore.getState().restSeconds).toBe(240)
    expect(useActiveWorkoutStore.getState().restEndsAt).toBe(NOW + 240_000)
  })

  it('un preset explícito gana a la recomendación', () => {
    useActiveWorkoutStore.getState().setRestMode(90)
    useActiveWorkoutStore.getState().startRest(240)
    expect(useActiveWorkoutStore.getState().restMode).toBe(90)
    expect(useActiveWorkoutStore.getState().restSeconds).toBe(90)
    expect(useActiveWorkoutStore.getState().restEndsAt).toBe(NOW + 90_000)
  })

  it('Auto con restSec de rutina usa la rutina por delante de la recomendación', () => {
    useActiveWorkoutStore.setState({ routineRestSec: 180 })
    useActiveWorkoutStore.getState().startRest(240)
    expect(useActiveWorkoutStore.getState().restSeconds).toBe(180)
    expect(useActiveWorkoutStore.getState().restEndsAt).toBe(NOW + 180_000)
  })

  it('elegir un preset desactiva Auto', () => {
    useActiveWorkoutStore.getState().setRestMode(120)
    expect(useActiveWorkoutStore.getState().restMode).toBe(120)
    expect(useActiveWorkoutStore.getState().restSeconds).toBe(120)
  })

  it('volver a Auto reactiva el modo y resuelve la recomendación', () => {
    useActiveWorkoutStore.getState().setRestMode(120)
    useActiveWorkoutStore.getState().setRestMode('auto')
    expect(useActiveWorkoutStore.getState().restMode).toBe('auto')
    expect(useActiveWorkoutStore.getState().restSeconds).toBe(90)
  })

  it('Auto es pegajoso: sobrevive a iniciar y parar el descanso', () => {
    useActiveWorkoutStore.getState().startRest(240)
    useActiveWorkoutStore.getState().stopRest()
    expect(useActiveWorkoutStore.getState().restMode).toBe('auto')
  })

  it('setAutoRestSeconds actualiza la recomendación y el preview en Auto', () => {
    useActiveWorkoutStore.getState().setAutoRestSeconds(176)
    expect(useActiveWorkoutStore.getState().autoRestSeconds).toBe(176)
    expect(useActiveWorkoutStore.getState().restSeconds).toBe(176)
  })

  it('partialize persiste el modo de descanso elegido', () => {
    useActiveWorkoutStore.getState().setRestMode(120)
    expect(partialize().restMode).toBe(120)
  })
})
