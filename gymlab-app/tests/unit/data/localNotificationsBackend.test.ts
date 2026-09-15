// Backend ÚNICO de notificaciones locales: acá se verifica la traducción al plugin real
// (permisos, alarmas exactas, agendado DIARIO vs puntual y cancelación) y el fallback
// seguro en web / plugin ausente. El plugin va mockeado, mismo patrón que
// tests/unit/data/healthBridge.test.ts.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NULL_BACKEND, getLocalNotificationsBackend } from '@/data/localNotificationsBackend'
import { NOTIFICATION_IDS } from '@/domain/notifications'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
}))

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    checkExactNotificationSetting: vi.fn(),
    schedule: vi.fn(),
    cancel: vi.fn(),
  },
}))

const { Capacitor } = await import('@capacitor/core')
const { LocalNotifications } = await import('@capacitor/local-notifications')

const isNative = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>
const getPlatform = Capacitor.getPlatform as unknown as ReturnType<typeof vi.fn>
const checkPermissions = LocalNotifications.checkPermissions as unknown as ReturnType<typeof vi.fn>
const requestPermissions = LocalNotifications.requestPermissions as unknown as ReturnType<typeof vi.fn>
const checkExact = LocalNotifications.checkExactNotificationSetting as unknown as ReturnType<typeof vi.fn>
const schedule = LocalNotifications.schedule as unknown as ReturnType<typeof vi.fn>
const cancel = LocalNotifications.cancel as unknown as ReturnType<typeof vi.fn>

const TRAINING_ID = NOTIFICATION_IDS.training_reminder

describe('localNotificationsBackend (nativo)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('android')
    checkPermissions.mockResolvedValue({ display: 'granted' })
    requestPermissions.mockResolvedValue({ display: 'granted' })
    checkExact.mockResolvedValue({ exact_alarm: 'granted' })
    schedule.mockResolvedValue(undefined)
    cancel.mockResolvedValue(undefined)
  })

  it('checkPermission y requestPermission devuelven el estado `display` del plugin', async () => {
    checkPermissions.mockResolvedValue({ display: 'granted' })
    requestPermissions.mockResolvedValue({ display: 'denied' })

    const backend = await getLocalNotificationsBackend()

    expect(await backend.checkPermission()).toBe('granted')
    expect(await backend.requestPermission()).toBe('denied')
    expect(checkPermissions).toHaveBeenCalledTimes(1)
    expect(requestPermissions).toHaveBeenCalledTimes(1)
  })

  it('checkExactAlarm en Android mapea granted/denied y cualquier otro valor a unknown', async () => {
    const backend = await getLocalNotificationsBackend()

    checkExact.mockResolvedValueOnce({ exact_alarm: 'granted' })
    expect(await backend.checkExactAlarm()).toBe('granted')
    checkExact.mockResolvedValueOnce({ exact_alarm: 'denied' })
    expect(await backend.checkExactAlarm()).toBe('denied')
    checkExact.mockResolvedValueOnce({ exact_alarm: 'prompt' })
    expect(await backend.checkExactAlarm()).toBe('unknown')
  })

  it('checkExactAlarm fuera de Android es unknown sin tocar el plugin', async () => {
    getPlatform.mockReturnValue('ios')
    const backend = await getLocalNotificationsBackend()

    expect(await backend.checkExactAlarm()).toBe('unknown')
    expect(checkExact).not.toHaveBeenCalled()
  })

  it('si el plugin falla al leer alarmas exactas, devuelve unknown (no propaga)', async () => {
    checkExact.mockRejectedValue(new Error('not supported'))
    const backend = await getLocalNotificationsBackend()

    await expect(backend.checkExactAlarm()).resolves.toBe('unknown')
  })

  it('schedule con `on` agenda repetición DIARIA en el SO (no un aviso inmediato)', async () => {
    const backend = await getLocalNotificationsBackend()

    await backend.schedule({
      id: TRAINING_ID,
      title: 'Hora de entrenar',
      body: 'Tu recordatorio diario',
      on: { hour: 7, minute: 30 },
      exact: true,
    })

    expect(schedule).toHaveBeenCalledTimes(1)
    const notification = schedule.mock.calls[0][0].notifications[0]
    expect(notification.id).toBe(TRAINING_ID)
    expect(notification.title).toBe('Hora de entrenar')
    // `on` es el agendado cron-like del plugin: debe quedar en el SO con allowWhileIdle,
    // y NUNCA como `at` (que sería un momento puntual/ya mismo).
    expect(notification.schedule).toEqual({ on: { hour: 7, minute: 30 }, allowWhileIdle: true })
    expect(notification.schedule).not.toHaveProperty('at')
    expect(notification.isExactNotification).toBe(true)
  })

  it('schedule con `at` agenda un momento puntual (alerta de descanso)', async () => {
    const backend = await getLocalNotificationsBackend()
    const at = 1_700_000_000_000

    await backend.schedule({ id: 9601, title: 'Descanso', body: 'Vuelve a la serie', at, exact: false })

    const notification = schedule.mock.calls[0][0].notifications[0]
    expect(notification.schedule.at).toEqual(new Date(at))
    expect(notification.schedule).not.toHaveProperty('on')
    expect(notification.isExactNotification).toBe(false)
  })

  it('cancel pide al SO cancelar por id', async () => {
    const backend = await getLocalNotificationsBackend()

    await backend.cancel(TRAINING_ID)

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledWith({ notifications: [{ id: TRAINING_ID }] })
  })
})

describe('localNotificationsBackend (web y plugin ausente)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('en web devuelve el backend nulo y NO toca el plugin', async () => {
    isNative.mockReturnValue(false)
    const backend = await getLocalNotificationsBackend()

    expect(backend).toBe(NULL_BACKEND)
    await expect(backend.checkPermission()).resolves.toBe('denied')
    await expect(backend.requestPermission()).resolves.toBe('denied')
    await expect(backend.checkExactAlarm()).resolves.toBe('unknown')
    await expect(backend.schedule({ id: TRAINING_ID, title: 'x', body: 'y', exact: true })).resolves.toBeUndefined()
    await expect(backend.cancel(TRAINING_ID)).resolves.toBeUndefined()
    expect(checkPermissions).not.toHaveBeenCalled()
    expect(schedule).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('si el plugin no se puede cargar, cae al backend nulo sin lanzar', async () => {
    vi.resetModules()
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' },
    }))
    vi.doMock('@capacitor/local-notifications', () => {
      throw new Error('plugin missing')
    })

    const mod = await import('@/data/localNotificationsBackend')
    const backend = await mod.getLocalNotificationsBackend()

    expect(backend).toBe(mod.NULL_BACKEND)
    await expect(backend.checkPermission()).resolves.toBe('denied')

    vi.doUnmock('@capacitor/local-notifications')
    vi.resetModules()
  })
})
