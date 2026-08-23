// Tests de la lógica de notificaciones (triggers, formato y clasificación).
import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  formatReminderTime,
  isReminderDue,
  isStreakExpiring,
  isInactive,
  checkTriggers,
} from '@/domain/notifications'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import type { AppSettings } from '@/domain/settings'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatReminderTime', () => {
  it('formatea hora y minuto con ceros', () => {
    expect(formatReminderTime(9, 5)).toBe('09:05')
  })

  it('formatea medianoche', () => {
    expect(formatReminderTime(0, 0)).toBe('00:00')
  })

  it('formatea 23:59', () => {
    expect(formatReminderTime(23, 59)).toBe('23:59')
  })
})

describe('isReminderDue', () => {
  it('devuelve true si hora y minuto coinciden', () => {
    const now = new Date(2026, 0, 15, 18, 30)
    expect(isReminderDue(now, 18, 30)).toBe(true)
  })

  it('devuelve false si la hora no coincide', () => {
    const now = new Date(2026, 0, 15, 18, 30)
    expect(isReminderDue(now, 19, 30)).toBe(false)
  })

  it('devuelve false si el minuto no coincide', () => {
    const now = new Date(2026, 0, 15, 18, 30)
    expect(isReminderDue(now, 18, 31)).toBe(false)
  })
})

describe('isStreakExpiring', () => {
  it('true con racha > 0 y daysSince >= 1', () => {
    expect(isStreakExpiring(1, 5)).toBe(true)
    expect(isStreakExpiring(3, 1)).toBe(true)
  })

  it('false con racha 0', () => {
    expect(isStreakExpiring(1, 0)).toBe(false)
  })

  it('false con daysSince 0', () => {
    expect(isStreakExpiring(0, 5)).toBe(false)
  })

  it('false con daysSince null', () => {
    expect(isStreakExpiring(null, 5)).toBe(false)
  })
})

describe('isInactive', () => {
  it('true con daysSince >= 3', () => {
    expect(isInactive(3)).toBe(true)
    expect(isInactive(10)).toBe(true)
  })

  it('false con daysSince < 3', () => {
    expect(isInactive(0)).toBe(false)
    expect(isInactive(2)).toBe(false)
  })

  it('false con daysSince null', () => {
    expect(isInactive(null)).toBe(false)
  })
})

describe('checkTriggers', () => {
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    notificationsEnabled: true,
    trainingReminderHour: 18,
    trainingReminderMinute: 0,
    streakReminder: true,
    inactivityReminder: true,
  }

  it('devuelve vacío si notificaciones desactivadas', () => {
    const r = checkTriggers(
      { ...settings, notificationsEnabled: false },
      new Date(),
      5,
      null,
    )
    expect(r).toHaveLength(0)
  })

  it('devuelve vacío si ya se comprobó hoy', () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const r = checkTriggers(settings, new Date(), 5, today)
    expect(r).toHaveLength(0)
  })

  it('detecta racha en riesgo cuando streakReminder activo', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(18)
    vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)
    // Último entreno hace 2 días, racha activa
    const lastWorkout = new Date()
    lastWorkout.setDate(lastWorkout.getDate() - 2)
    const r = checkTriggers(settings, lastWorkout, 5, null)
    const streak = r.find((n) => n.trigger === 'streak_expiring')
    expect(streak).toBeDefined()
    expect(streak!.bodyParams?.days).toBe(2)
  })

  it('no detecta racha en riesgo si streakReminder desactivado', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(18)
    vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)
    const lastWorkout = new Date()
    lastWorkout.setDate(lastWorkout.getDate() - 2)
    const r = checkTriggers(
      { ...settings, streakReminder: false },
      lastWorkout,
      5,
      null,
    )
    expect(r.find((n) => n.trigger === 'streak_expiring')).toBeUndefined()
  })

  it('detecta inactividad cuando inactivityReminder activo', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(12)
    vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)
    const lastWorkout = new Date()
    lastWorkout.setDate(lastWorkout.getDate() - 5)
    const r = checkTriggers(settings, lastWorkout, 0, null)
    const inactive = r.find((n) => n.trigger === 'inactivity')
    expect(inactive).toBeDefined()
    expect(inactive!.bodyParams?.days).toBe(5)
  })

  it('no detecta inactividad si inactivityReminder desactivado', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(12)
    vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)
    const lastWorkout = new Date()
    lastWorkout.setDate(lastWorkout.getDate() - 5)
    const r = checkTriggers(
      { ...settings, inactivityReminder: false },
      lastWorkout,
      0,
      null,
    )
    expect(r.find((n) => n.trigger === 'inactivity')).toBeUndefined()
  })

  it('no dispara recordatorio de entrenamiento si no es la hora', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(10)
    vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30)
    const r = checkTriggers(settings, new Date(), 0, null)
    expect(r.find((n) => n.trigger === 'training_reminder')).toBeUndefined()
  })

  it('devuelve recordatorio de entrenamiento si es la hora', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(18)
    vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)
    const r = checkTriggers(settings, new Date(), 0, null)
    expect(r.find((n) => n.trigger === 'training_reminder')).toBeDefined()
  })
})
