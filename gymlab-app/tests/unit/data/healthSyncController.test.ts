// Controlador global del sync de salud (F108): es un singleton de módulo, así que cada
// test lo reimporta con `vi.resetModules()` para arrancar con estado/ listeners limpios.
// Mismo patrón de mocks que stepsSync.test.ts (bridge fake + spy del sync + metaRepo).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HealthBridge } from '@/data/healthBridge'

// El flag nativo es mutable: algunos tests simulan web sin reimportar el mock.
const nativeState = vi.hoisted(() => ({ value: true }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => nativeState.value },
}))

const getBridgeSpy = vi.fn()
vi.mock('@/data/healthBridge', () => ({
  getHealthBridge: (...args: unknown[]) => getBridgeSpy(...args),
}))

const syncSpy = vi.fn()
vi.mock('@/data/stepsSync', () => ({
  syncStepsFromHealth: (...args: unknown[]) => syncSpy(...args),
}))

const backgroundSpy = vi.fn()
vi.mock('@/data/healthBackgroundBridge', () => ({
  requestHealthBackgroundRead: (...args: unknown[]) => backgroundSpy(...args),
}))

const getJsonSpy = vi.fn()
const setJsonSpy = vi.fn()
vi.mock('@/data/repositories', () => ({
  metaRepo: {
    getJson: (...args: unknown[]) => getJsonSpy(...args),
    setJson: (...args: unknown[]) => setJsonSpy(...args),
  },
}))

const FLAG_KEY = 'healthPermissionAskedAt'

const makeBridge = (overrides: Partial<HealthBridge> = {}): HealthBridge => ({
  isAvailable: vi.fn(async () => true),
  checkPermission: vi.fn(async () => false),
  requestPermission: vi.fn(async () => 'denied' as const),
  fetchStepsByDay: vi.fn(async () => []),
  fetchStepsByHour: vi.fn(async () => []),
  ...overrides,
})

let ctrl: typeof import('@/data/healthSyncController')

beforeEach(async () => {
  vi.clearAllMocks()
  nativeState.value = true
  getBridgeSpy.mockReset()
  syncSpy.mockReset()
  getJsonSpy.mockReset().mockResolvedValue('')
  setJsonSpy.mockReset().mockResolvedValue(undefined)
  backgroundSpy.mockReset().mockResolvedValue({ granted: true, available: true })
  vi.resetModules()
  ctrl = await import('@/data/healthSyncController')
})

describe('startupAction', () => {
  it('permiso concedido → sync (auto, sin diálogo)', () => {
    expect(ctrl.startupAction(true, true, '')).toBe('sync')
  })

  it('sin permiso y sin pedido previo → ask (pedido único)', () => {
    expect(ctrl.startupAction(true, false, '')).toBe('ask')
  })

  it('sin permiso pero ya pedido antes → none (nunca automático dos veces)', () => {
    expect(ctrl.startupAction(true, false, '2026-09-27T10:00:00.000Z')).toBe('none')
  })

  it('sin ecosistema de salud → none', () => {
    expect(ctrl.startupAction(false, false, '')).toBe('none')
    expect(ctrl.startupAction(false, true, '')).toBe('none')
  })
})

describe('runStartupHealthSync', () => {
  it('no nativo → unavailable sin tocar el bridge', async () => {
    nativeState.value = false
    await ctrl.runStartupHealthSync()
    expect(ctrl.getHealthSyncStatus()).toBe('unavailable')
    expect(getBridgeSpy).not.toHaveBeenCalled()
    expect(syncSpy).not.toHaveBeenCalled()
  })

  it('sin ecosistema de salud → unavailable sin pedir', async () => {
    const bridge = makeBridge({ isAvailable: async () => false })
    getBridgeSpy.mockResolvedValue(bridge)
    await ctrl.runStartupHealthSync()
    expect(ctrl.getHealthSyncStatus()).toBe('unavailable')
    expect(bridge.requestPermission).not.toHaveBeenCalled()
    expect(syncSpy).not.toHaveBeenCalled()
  })

  it('error consultando el bridge de arranque → status error sin explotar', async () => {
    getBridgeSpy.mockResolvedValue(
      makeBridge({
        isAvailable: async () => {
          throw new Error('health api down')
        },
      }),
    )
    await ctrl.runStartupHealthSync()
    expect(ctrl.getHealthSyncStatus()).toBe('error')
    expect(syncSpy).not.toHaveBeenCalled()
  })

  it('permiso ya concedido → sync en modo auto sin abrir diálogo', async () => {
    const bridge = makeBridge({ checkPermission: async () => true })
    getBridgeSpy.mockResolvedValue(bridge)
    syncSpy.mockResolvedValue({ status: 'synced', days: 3 })
    await ctrl.runStartupHealthSync()
    expect(syncSpy).toHaveBeenCalledWith(bridge, 'auto')
    expect(bridge.requestPermission).not.toHaveBeenCalled()
    expect(setJsonSpy).not.toHaveBeenCalled()
    expect(ctrl.getHealthSyncStatus()).toBe('granted')
  })

  it('sin permiso y sin flag → pide UNA vez (interactive) y persiste el flag', async () => {
    const bridge = makeBridge({ checkPermission: async () => false })
    getBridgeSpy.mockResolvedValue(bridge)
    syncSpy.mockResolvedValue({ status: 'denied' })
    await ctrl.runStartupHealthSync()
    expect(getJsonSpy).toHaveBeenCalledWith(FLAG_KEY, '')
    expect(syncSpy).toHaveBeenCalledTimes(1)
    expect(syncSpy).toHaveBeenCalledWith(bridge, 'interactive')
    expect(setJsonSpy).toHaveBeenCalledWith(FLAG_KEY, expect.any(String))
    expect(ctrl.getHealthSyncStatus()).toBe('denied')
  })

  it('con un refresh auto en vuelo, el pedido interactivo NO comparte la promesa (no se saltea el diálogo)', async () => {
    const bridge = makeBridge({ checkPermission: async () => false })
    getBridgeSpy.mockResolvedValue(bridge)
    getJsonSpy.mockResolvedValue('')

    // La primera sync (auto) queda deferred para simular un refresh en vuelo.
    let resolveAuto: (result: { status: 'denied' }) => void = () => {}
    let flagPersistedAtInteractiveCall = true
    let calls = 0
    syncSpy.mockImplementation(() => {
      calls++
      if (calls === 1) {
        return new Promise<{ status: 'denied' }>((resolve) => {
          resolveAuto = resolve
        })
      }
      flagPersistedAtInteractiveCall = setJsonSpy.mock.calls.length > 0
      return Promise.resolve({ status: 'denied' as const })
    })

    const auto = ctrl.refreshHealthSync()
    await vi.waitFor(() => expect(syncSpy).toHaveBeenCalledTimes(1))

    const startup = ctrl.runStartupHealthSync()
    // Deja que el arranque recorra bridge/check/meta y quede esperando la sync en vuelo.
    await vi.waitFor(() => expect(getJsonSpy).toHaveBeenCalledTimes(1))
    await Promise.resolve()
    await Promise.resolve()

    resolveAuto({ status: 'denied' })
    await auto
    await startup

    // El interactivo corrió de verdad (si compartiera la promesa auto, quedaría en 1 call).
    expect(syncSpy).toHaveBeenCalledTimes(2)
    expect(syncSpy.mock.calls[1]?.[1]).toBe('interactive')
    // Y el flag se persiste recién después del interactivo, no con el resultado auto.
    expect(flagPersistedAtInteractiveCall).toBe(false)
    expect(setJsonSpy).toHaveBeenCalledWith(FLAG_KEY, expect.any(String))
  })

  it('si el permiso se concedió durante la espera del sync en vuelo → sync auto, sin segundo diálogo (R3-001)', async () => {
    let checks = 0
    const bridge = makeBridge({
      checkPermission: async () => {
        checks++
        return checks > 1 // primer chequeo falso; tras la espera, ya concedido
      },
    })
    getBridgeSpy.mockResolvedValue(bridge)
    getJsonSpy.mockResolvedValue('')

    let resolveAuto: (result: { status: 'denied' }) => void = () => {}
    syncSpy.mockImplementationOnce(
      () => new Promise<{ status: 'denied' }>((resolve) => { resolveAuto = resolve }),
    )
    syncSpy.mockResolvedValue({ status: 'synced', days: 2 })

    const auto = ctrl.refreshHealthSync()
    await vi.waitFor(() => expect(syncSpy).toHaveBeenCalledTimes(1))
    const startup = ctrl.runStartupHealthSync()
    await vi.waitFor(() => expect(getJsonSpy).toHaveBeenCalledTimes(1))
    resolveAuto({ status: 'denied' })
    await auto
    await startup

    expect(bridge.requestPermission).not.toHaveBeenCalled()
    expect(syncSpy).toHaveBeenCalledTimes(2)
    expect(syncSpy.mock.calls[1]?.[1]).toBe('auto')
    expect(setJsonSpy).not.toHaveBeenCalled()
    expect(ctrl.getHealthSyncStatus()).toBe('granted')
  })

  it('si el flag ya quedó persistido durante la espera → denied sin segundo diálogo (R3-001)', async () => {
    const bridge = makeBridge({ checkPermission: async () => false })
    getBridgeSpy.mockResolvedValue(bridge)
    let jsonCalls = 0
    getJsonSpy.mockImplementation(async () => {
      jsonCalls++
      return jsonCalls > 1 ? '2026-09-29T10:00:00.000Z' : ''
    })

    let resolveAuto: (result: { status: 'denied' }) => void = () => {}
    syncSpy.mockImplementationOnce(
      () => new Promise<{ status: 'denied' }>((resolve) => { resolveAuto = resolve }),
    )

    const auto = ctrl.refreshHealthSync()
    await vi.waitFor(() => expect(syncSpy).toHaveBeenCalledTimes(1))
    const startup = ctrl.runStartupHealthSync()
    await vi.waitFor(() => expect(getJsonSpy).toHaveBeenCalledTimes(1))
    resolveAuto({ status: 'denied' })
    await auto
    await startup

    expect(syncSpy).toHaveBeenCalledTimes(1)
    expect(bridge.requestPermission).not.toHaveBeenCalled()
    expect(ctrl.getHealthSyncStatus()).toBe('denied')
  })

  it('sin permiso y con flag → denied sin diálogo ni sync', async () => {
    const bridge = makeBridge({ checkPermission: async () => false })
    getBridgeSpy.mockResolvedValue(bridge)
    getJsonSpy.mockResolvedValue('2026-09-27T10:00:00.000Z')
    await ctrl.runStartupHealthSync()
    expect(syncSpy).not.toHaveBeenCalled()
    expect(bridge.requestPermission).not.toHaveBeenCalled()
    expect(setJsonSpy).not.toHaveBeenCalled()
    expect(ctrl.getHealthSyncStatus()).toBe('denied')
  })

  it('error del pedido → status error y el flag NO se persiste (se reintenta al próximo arranque)', async () => {
    const bridge = makeBridge({ checkPermission: async () => false })
    getBridgeSpy.mockResolvedValue(bridge)
    syncSpy.mockResolvedValue({ status: 'error' })
    await ctrl.runStartupHealthSync()
    expect(ctrl.getHealthSyncStatus()).toBe('error')
    expect(setJsonSpy).not.toHaveBeenCalled()
  })
})

describe('refreshHealthSync / connectHealthSync', () => {
  it('refresh silencioso: NO emite syncing transitorio (banner sin parpadeo)', async () => {
    const seen: string[] = []
    ctrl.subscribeHealthSync((status) => seen.push(status))
    getBridgeSpy.mockResolvedValue(makeBridge())
    syncSpy.mockResolvedValue({ status: 'synced' })
    await ctrl.refreshHealthSync()
    expect(seen).toEqual(['granted'])
  })

  it('arranque e interactivo siguen visibles: emiten syncing', async () => {
    const seen: string[] = []
    ctrl.subscribeHealthSync((status) => seen.push(status))
    getBridgeSpy.mockResolvedValue(makeBridge({ checkPermission: async () => true }))
    syncSpy.mockResolvedValue({ status: 'synced' })

    await ctrl.runStartupHealthSync()
    expect(seen).toEqual(['syncing', 'granted'])

    seen.length = 0
    await ctrl.connectHealthSync()
    expect(seen).toEqual(['syncing', 'granted'])
  })

  it('refresh usa modo auto: NUNCA pide permiso (fix estructural del loop de foreground)', async () => {
    const bridge = makeBridge({ checkPermission: async () => false })
    getBridgeSpy.mockResolvedValue(bridge)
    syncSpy.mockResolvedValue({ status: 'denied' })
    await ctrl.refreshHealthSync()
    expect(syncSpy).toHaveBeenCalledWith(bridge, 'auto')
    expect(bridge.requestPermission).not.toHaveBeenCalled()
    expect(ctrl.getHealthSyncStatus()).toBe('denied')
  })

  it('connect usa modo interactive (el banner sí puede pedir)', async () => {
    const bridge = makeBridge()
    getBridgeSpy.mockResolvedValue(bridge)
    syncSpy.mockResolvedValue({ status: 'granted' })
    await ctrl.connectHealthSync()
    expect(syncSpy).toHaveBeenCalledWith(bridge, 'interactive')
  })

  it('connectHealthSync persiste el flag cuando el pedido concluye (R3-001)', async () => {
    const bridge = makeBridge()
    getBridgeSpy.mockResolvedValue(bridge)
    syncSpy.mockResolvedValue({ status: 'denied' })
    await ctrl.connectHealthSync()
    expect(setJsonSpy).toHaveBeenCalledWith(FLAG_KEY, expect.any(String))
  })

  it('connectHealthSync NO persiste el flag cuando el pedido falla', async () => {
    const bridge = makeBridge()
    getBridgeSpy.mockResolvedValue(bridge)
    syncSpy.mockResolvedValue({ status: 'error' })
    await ctrl.connectHealthSync()
    expect(setJsonSpy).not.toHaveBeenCalled()
  })

  it('dedupe inFlight: dos refresh simultáneos comparten una sola sync', async () => {
    getBridgeSpy.mockResolvedValue(makeBridge())
    let resolveSync: (result: { status: 'synced' }) => void = () => {}
    syncSpy.mockImplementation(
      () => new Promise<{ status: 'synced' }>((resolve) => { resolveSync = resolve }),
    )
    const first = ctrl.refreshHealthSync()
    const second = ctrl.refreshHealthSync()
    expect(first).toBe(second)
    await vi.waitFor(() => expect(syncSpy).toHaveBeenCalledTimes(1))
    resolveSync({ status: 'synced' })
    await Promise.all([first, second])
    expect(syncSpy).toHaveBeenCalledTimes(1)
    expect(ctrl.getHealthSyncStatus()).toBe('granted')
  })

  it('un tap del banner durante un refresh auto espera y re-ejecuta interactive (R3-001)', async () => {
    const bridge = makeBridge()
    getBridgeSpy.mockResolvedValue(bridge)
    // La auto queda deferred: el tap del banner llega con la sync en vuelo.
    let resolveAuto: (result: { status: 'denied' }) => void = () => {}
    let calls = 0
    syncSpy.mockImplementation(() => {
      calls++
      if (calls === 1) {
        return new Promise<{ status: 'denied' }>((resolve) => {
          resolveAuto = resolve
        })
      }
      return Promise.resolve({ status: 'denied' as const })
    })

    const auto = ctrl.refreshHealthSync()
    await vi.waitFor(() => expect(syncSpy).toHaveBeenCalledTimes(1))

    const connect = ctrl.connectHealthSync()
    // El interactivo todavía no arrancó: espera a que asiente la auto en vuelo.
    expect(syncSpy).toHaveBeenCalledTimes(1)
    // La auto en vuelo todavía no persistió nada: el flag se escribe recién con el
    // resultado interactivo.
    expect(setJsonSpy).not.toHaveBeenCalled()

    resolveAuto({ status: 'denied' })
    await auto
    await connect

    // El interactivo corrió de verdad (antes el dedupe lo tragaba).
    expect(syncSpy).toHaveBeenCalledTimes(2)
    expect(syncSpy.mock.calls[1]?.[1]).toBe('interactive')
    // Y el flag del arranque se persiste UNA sola vez, con el resultado interactivo.
    expect(setJsonSpy).toHaveBeenCalledTimes(1)
    expect(setJsonSpy).toHaveBeenCalledWith(FLAG_KEY, expect.any(String))
  })

  it('si la sync auto en vuelo rechaza, el tap del banner igual espera y re-ejecuta interactive (R3-001 residual)', async () => {
    const bridge = makeBridge()
    getBridgeSpy.mockResolvedValue(bridge)
    // Listener que lanza solo las DOS notificaciones del auto (granted → error):
    // fuerza el rechazo del controlador sin romper el camino interactivo posterior.
    let throwsLeft = 2
    const unsubscribe = ctrl.subscribeHealthSync(() => {
      if (throwsLeft > 0) {
        throwsLeft--
        throw new Error('listener roto')
      }
    })
    try {
      let resolveAuto: (result: { status: 'synced' }) => void = () => {}
      let calls = 0
      syncSpy.mockImplementation(() => {
        calls++
        if (calls === 1) {
          return new Promise<{ status: 'synced' }>((resolve) => {
            resolveAuto = resolve
          })
        }
        return Promise.resolve({ status: 'denied' as const })
      })

      const auto = ctrl.refreshHealthSync()
      await vi.waitFor(() => expect(syncSpy).toHaveBeenCalledTimes(1))

      const connect = ctrl.connectHealthSync()
      expect(syncSpy).toHaveBeenCalledTimes(1)

      resolveAuto({ status: 'synced' })
      // Endurecimiento del test (108.followups-3): la auto rechazó DE VERDAD. Sin
      // esta aserción un auto que resuelve también re-ejecutaría el interactive y
      // el test pasaría sin ejercitar el camino rechazado.
      await expect(auto).rejects.toThrow('listener roto')
      await connect

      expect(syncSpy).toHaveBeenCalledTimes(2)
      expect(syncSpy.mock.calls[1]?.[1]).toBe('interactive')
      expect(setJsonSpy).toHaveBeenCalledWith(FLAG_KEY, expect.any(String))
    } finally {
      unsubscribe()
    }
  })
})

describe('permiso de lectura en background', () => {
  it('arranque con permiso concedido → pide el permiso de background', async () => {
    getBridgeSpy.mockResolvedValue(makeBridge({ checkPermission: async () => true }))
    syncSpy.mockResolvedValue({ status: 'synced' })
    await ctrl.runStartupHealthSync()
    expect(backgroundSpy).toHaveBeenCalledTimes(1)
  })

  it('sin permiso de salud → no pide background', async () => {
    getBridgeSpy.mockResolvedValue(makeBridge({ checkPermission: async () => false }))
    getJsonSpy.mockResolvedValue('2026-09-27T10:00:00.000Z')
    await ctrl.runStartupHealthSync()
    expect(backgroundSpy).not.toHaveBeenCalled()
  })

  it('connect interactivo concedido → pide background', async () => {
    getBridgeSpy.mockResolvedValue(makeBridge())
    syncSpy.mockResolvedValue({ status: 'granted' })
    await ctrl.connectHealthSync()
    expect(backgroundSpy).toHaveBeenCalledTimes(1)
  })

  it('un fallo del puente de background no rompe el sync', async () => {
    getBridgeSpy.mockResolvedValue(makeBridge())
    syncSpy.mockResolvedValue({ status: 'granted' })
    backgroundSpy.mockRejectedValue(new Error('no bridge'))
    await ctrl.connectHealthSync()
    expect(ctrl.getHealthSyncStatus()).toBe('granted')
  })
})

describe('subscribeHealthSync', () => {
  it('notifica cada cambio de estado y el unsubscribe corta la suscripción', async () => {
    const seen: string[] = []
    const unsubscribe = ctrl.subscribeHealthSync((status) => seen.push(status))
    getBridgeSpy.mockResolvedValue(makeBridge())
    syncSpy.mockResolvedValue({ status: 'synced' })
    // Vía visible (interactiva): el refresh automático es silencioso por diseño.
    await ctrl.connectHealthSync()
    expect(seen).toEqual(['syncing', 'granted'])
    unsubscribe()
    syncSpy.mockResolvedValue({ status: 'error' })
    await ctrl.connectHealthSync()
    expect(seen).toEqual(['syncing', 'granted'])
  })
})
