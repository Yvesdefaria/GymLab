// Puente de notificación local (F96, D3): programa/cancela/reprograma con un
// backend inyectado, así la suite node verifica la lógica de permisos y
// exact-alarm sin dispositivo real. El plugin va detrás del backend.
import { describe, expect, it, vi } from 'vitest'
import {
  REST_NOTIFICATION_ID,
  type AlertPermission,
  type ExactAlarmSetting,
} from '@/domain/restAlert'
import {
  createRestAlertBridge,
  type RestAlertBackend,
} from '@/data/restAlertBridge'

const makeBackend = (overrides: Partial<RestAlertBackend> = {}): RestAlertBackend => ({
  checkPermission: vi.fn(async () => 'granted' as AlertPermission),
  requestPermission: vi.fn(async () => 'granted' as AlertPermission),
  checkExactAlarm: vi.fn(async () => 'granted' as ExactAlarmSetting),
  schedule: vi.fn(async () => {}),
  cancel: vi.fn(async () => {}),
  ...overrides,
})

const input = { endsAt: 1_700_000_000_000, title: 'Descanso terminado', body: 'Vuelve a la serie' }

describe('scheduleRestAlert', () => {
  it('nativo con permiso concedido programa una notificación con el id fijo', async () => {
    const backend = makeBackend()
    const bridge = createRestAlertBridge(backend, true)

    const result = await bridge.scheduleRestAlert(input)

    expect(result).toEqual({ scheduled: true, warning: null })
    expect(backend.schedule).toHaveBeenCalledTimes(1)
    expect(backend.schedule).toHaveBeenCalledWith({
      id: REST_NOTIFICATION_ID,
      title: 'Descanso terminado',
      body: 'Vuelve a la serie',
      at: input.endsAt,
      exact: true,
    })
  })

  it('reprogramar reutiliza el mismo id (nunca deja dos pendientes)', async () => {
    const backend = makeBackend()
    const bridge = createRestAlertBridge(backend, true)

    await bridge.scheduleRestAlert(input)
    await bridge.scheduleRestAlert({ ...input, endsAt: input.endsAt + 30_000 })

    expect(backend.schedule).toHaveBeenCalledTimes(2)
    const ids = vi.mocked(backend.schedule).mock.calls.map(([arg]) => arg.id)
    expect(ids).toEqual([REST_NOTIFICATION_ID, REST_NOTIFICATION_ID])
    const ats = vi.mocked(backend.schedule).mock.calls.map(([arg]) => arg.at)
    expect(ats).toEqual([input.endsAt, input.endsAt + 30_000])
  })

  it('con permiso denegado no programa, no pide permiso dos veces y avisa', async () => {
    const backend = makeBackend({ checkPermission: vi.fn(async () => 'denied' as AlertPermission) })
    const bridge = createRestAlertBridge(backend, true)

    const result = await bridge.scheduleRestAlert(input)

    expect(result).toEqual({ scheduled: false, warning: 'permission_denied' })
    expect(backend.schedule).not.toHaveBeenCalled()
    expect(backend.requestPermission).not.toHaveBeenCalled()
  })

  it('con permiso pendiente lo solicita y programa si se concede', async () => {
    const backend = makeBackend({
      checkPermission: vi.fn(async () => 'prompt' as AlertPermission),
      requestPermission: vi.fn(async () => 'granted' as AlertPermission),
    })
    const bridge = createRestAlertBridge(backend, true)

    const result = await bridge.scheduleRestAlert(input)

    expect(backend.requestPermission).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ scheduled: true, warning: null })
    expect(backend.schedule).toHaveBeenCalledTimes(1)
  })

  it('Android sin alarmas exactas programa inexacto y avisa', async () => {
    const backend = makeBackend({ checkExactAlarm: vi.fn(async () => 'denied' as ExactAlarmSetting) })
    const bridge = createRestAlertBridge(backend, true)

    const result = await bridge.scheduleRestAlert(input)

    expect(result).toEqual({ scheduled: true, warning: 'exact_alarm_denied' })
    expect(backend.schedule).toHaveBeenCalledWith(expect.objectContaining({ exact: false }))
  })

  it('en web es un no-op seguro: no toca el backend ni promete alerta', async () => {
    const backend = makeBackend()
    const bridge = createRestAlertBridge(backend, false)

    const result = await bridge.scheduleRestAlert(input)

    expect(result).toEqual({ scheduled: false, warning: null })
    expect(backend.checkPermission).not.toHaveBeenCalled()
    expect(backend.requestPermission).not.toHaveBeenCalled()
    expect(backend.schedule).not.toHaveBeenCalled()
  })

  it('si el plugin falla al programar, no lanza y el descanso sigue (fail-safe)', async () => {
    const backend = makeBackend({
      schedule: vi.fn(async () => {
        throw new Error('scheduling unavailable')
      }),
    })
    const bridge = createRestAlertBridge(backend, true)

    const result = await bridge.scheduleRestAlert(input)

    expect(result).toEqual({ scheduled: false, warning: null })
  })

  it('si la comprobación de permisos falla, no lanza y no programa (fail-safe)', async () => {
    const backend = makeBackend({
      checkPermission: vi.fn(async () => {
        throw new Error('permission check failed')
      }),
    })
    const bridge = createRestAlertBridge(backend, true)

    const result = await bridge.scheduleRestAlert(input)

    expect(result).toEqual({ scheduled: false, warning: null })
    expect(backend.schedule).not.toHaveBeenCalled()
  })
})

describe('cancelRestAlert', () => {
  it('cancela por el id fijo', async () => {
    const backend = makeBackend()
    const bridge = createRestAlertBridge(backend, true)

    await bridge.cancelRestAlert()

    expect(backend.cancel).toHaveBeenCalledTimes(1)
    expect(backend.cancel).toHaveBeenCalledWith(REST_NOTIFICATION_ID)
  })

  it('un fallo al cancelar no se propaga (fail-safe)', async () => {
    const backend = makeBackend({
      cancel: vi.fn(async () => {
        throw new Error('cancel failed')
      }),
    })
    const bridge = createRestAlertBridge(backend, true)

    await expect(bridge.cancelRestAlert()).resolves.toBeUndefined()
  })
})
