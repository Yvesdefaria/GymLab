// Recordatorios: el agendado real se prueba sobre `syncTrainingReminder`, la lógica
// exportada del hook (convención del repo: useExerciseCatalog → filterExercises,
// useRecentLoadHistory → aggregateRecentLoadAverages). El montaje en el árbol de la app
// se cubre en tests/unit/notificationsWiring.test.ts.
import { describe, expect, it, vi } from 'vitest'
import { syncTrainingReminder } from '@/hooks/useNotifications'
import { NOTIFICATION_IDS } from '@/domain/notifications'
import type { LocalNotificationsBackend } from '@/data/localNotificationsBackend'
import type { AlertPermission, ExactAlarmSetting } from '@/domain/restAlert'

const makeBackend = (overrides: Partial<LocalNotificationsBackend> = {}): LocalNotificationsBackend => ({
  checkPermission: vi.fn(async () => 'granted' as AlertPermission),
  requestPermission: vi.fn(async () => 'granted' as AlertPermission),
  checkExactAlarm: vi.fn(async () => 'unknown' as ExactAlarmSetting),
  schedule: vi.fn(async () => {}),
  cancel: vi.fn(async () => {}),
  ...overrides,
})

const input = {
  enabled: true,
  isNative: true,
  id: NOTIFICATION_IDS.training_reminder,
  title: 'Hora de entrenar',
  body: 'Tu recordatorio diario',
  hour: 7,
  minute: 30,
}

describe('syncTrainingReminder', () => {
  it('el id del recordatorio de entrenamiento es fijo (9602): reprogramar reemplaza, no acumula', () => {
    expect(NOTIFICATION_IDS.training_reminder).toBe(9602)
  })

  it('con permiso concedido PROGRAMA en el SO la repetición diaria a la hora configurada', async () => {
    const backend = makeBackend()

    await syncTrainingReminder(backend, input)

    expect(backend.schedule).toHaveBeenCalledTimes(1)
    expect(backend.schedule).toHaveBeenCalledWith({
      id: NOTIFICATION_IDS.training_reminder,
      title: 'Hora de entrenar',
      body: 'Tu recordatorio diario',
      on: { hour: 7, minute: 30 },
      exact: true,
    })
    // Es agendado en el SO (`on`), no un aviso inmediato.
    expect(vi.mocked(backend.schedule).mock.calls[0][0]).not.toHaveProperty('at')
    expect(backend.cancel).not.toHaveBeenCalled()
  })

  it('sin alarmas exactas programa en modo inexacto (no bloquea el recordatorio)', async () => {
    const backend = makeBackend({ checkExactAlarm: vi.fn(async () => 'denied' as ExactAlarmSetting) })

    await syncTrainingReminder(backend, input)

    expect(backend.schedule).toHaveBeenCalledWith(expect.objectContaining({ exact: false }))
  })

  it('con permiso denegado no programa, no lanza y no cancela nada', async () => {
    const backend = makeBackend({ checkPermission: vi.fn(async () => 'denied' as AlertPermission) })

    await expect(syncTrainingReminder(backend, input)).resolves.toBeUndefined()

    expect(backend.schedule).not.toHaveBeenCalled()
    expect(backend.cancel).not.toHaveBeenCalled()
  })

  it('en web (no nativo) no programa en el SO', async () => {
    const backend = makeBackend()

    await syncTrainingReminder(backend, { ...input, isNative: false })

    expect(backend.schedule).not.toHaveBeenCalled()
  })

  it('con las notificaciones desactivadas CANCELA el recordatorio y no toca permisos', async () => {
    const backend = makeBackend()

    await syncTrainingReminder(backend, { ...input, enabled: false })

    expect(backend.cancel).toHaveBeenCalledTimes(1)
    expect(backend.cancel).toHaveBeenCalledWith(NOTIFICATION_IDS.training_reminder)
    expect(backend.schedule).not.toHaveBeenCalled()
    expect(backend.checkPermission).not.toHaveBeenCalled()
    expect(backend.checkExactAlarm).not.toHaveBeenCalled()
  })

  it('reprogramar reutiliza el MISMO id (una sola pendiente en el SO)', async () => {
    const backend = makeBackend()

    await syncTrainingReminder(backend, input)
    await syncTrainingReminder(backend, { ...input, hour: 8, minute: 15 })

    const calls = vi.mocked(backend.schedule).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls.map(([arg]) => arg.id)).toEqual([
      NOTIFICATION_IDS.training_reminder,
      NOTIFICATION_IDS.training_reminder,
    ])
    expect(calls[1][0].on).toEqual({ hour: 8, minute: 15 })
  })
})
