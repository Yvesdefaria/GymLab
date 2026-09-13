// Planificador puro de la alerta de descanso (F96, D3). Sin plugin ni React:
// decide si se puede programar la notificación y qué aviso no bloqueante mostrar,
// y resuelve el dedupe contra la notificación del SO al reanudar.
import { describe, expect, it } from 'vitest'
import {
  REST_NOTIFICATION_ID,
  planRestAlert,
  shouldSuppressInAppAlert,
} from '@/domain/restAlert'

describe('REST_NOTIFICATION_ID', () => {
  it('es un id fijo de 32 bits para que el plugin reemplace, nunca duplique', () => {
    expect(REST_NOTIFICATION_ID).toBe(9601)
    expect(Number.isInteger(REST_NOTIFICATION_ID)).toBe(true)
  })
})

describe('planRestAlert', () => {
  it('en web no programa nada y no promete aviso en segundo plano', () => {
    expect(planRestAlert({ isNative: false, permission: 'granted', exactAlarm: 'unknown' })).toEqual({
      shouldSchedule: false,
      exact: false,
      warning: null,
    })
  })

  it('nativo con permiso concedido y alarmas exactas programa exacto y sin aviso', () => {
    expect(planRestAlert({ isNative: true, permission: 'granted', exactAlarm: 'granted' })).toEqual({
      shouldSchedule: true,
      exact: true,
      warning: null,
    })
  })

  it('iOS/nativo sin ajuste de exactitud (unknown) programa exacto sin aviso', () => {
    expect(planRestAlert({ isNative: true, permission: 'granted', exactAlarm: 'unknown' })).toEqual({
      shouldSchedule: true,
      exact: true,
      warning: null,
    })
  })

  it('Android 12+ sin permiso de alarmas exactas cae a inexacto y avisa', () => {
    expect(planRestAlert({ isNative: true, permission: 'granted', exactAlarm: 'denied' })).toEqual({
      shouldSchedule: true,
      exact: false,
      warning: 'exact_alarm_denied',
    })
  })

  it('permiso de notificaciones denegado no programa y avisa', () => {
    expect(planRestAlert({ isNative: true, permission: 'denied', exactAlarm: 'granted' })).toEqual({
      shouldSchedule: false,
      exact: false,
      warning: 'permission_denied',
    })
  })

  it('permiso aún no resuelto (prompt) no programa hasta pedirlo', () => {
    expect(planRestAlert({ isNative: true, permission: 'prompt', exactAlarm: 'granted' })).toEqual({
      shouldSchedule: false,
      exact: false,
      warning: 'permission_denied',
    })
  })
})

describe('shouldSuppressInAppAlert', () => {
  const scheduled = { id: REST_NOTIFICATION_ID, endsAt: 1_000 }

  it('sin notificación programada no suprime la alerta in-app (web)', () => {
    expect(shouldSuppressInAppAlert(null, 2_000)).toBe(false)
  })

  it('con deadline ya vencido suprime la alerta in-app (nativo ya avisó)', () => {
    expect(shouldSuppressInAppAlert(scheduled, 1_500)).toBe(true)
    expect(shouldSuppressInAppAlert(scheduled, 1_000)).toBe(true)
  })

  it('con deadline futuro no suprime la alerta in-app', () => {
    expect(shouldSuppressInAppAlert(scheduled, 999)).toBe(false)
  })
})
