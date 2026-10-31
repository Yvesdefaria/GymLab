// @vitest-environment jsdom
// Ajustes → Notificaciones: con el permiso denegado en Android aparece el botón que
// abre los ajustes del sistema; en web (sin ajustes del sistema) no se muestra.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { NotificationsSection } from '@/components/settings/NotificationsSection'

const { openSettingsMock, canOpenMock, permission } = vi.hoisted(() => ({
  openSettingsMock: vi.fn(async () => true),
  canOpenMock: vi.fn(() => true),
  permission: { value: 'denied' as 'denied' | 'granted' | 'prompt' },
}))

vi.mock('@/data/appSettings', () => ({
  canOpenSystemSettings: () => canOpenMock(),
  openNotificationSettings: openSettingsMock,
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    permission: permission.value,
    isSupported: true,
    requestPermission: vi.fn(async () => false),
    refreshPermission: vi.fn(async () => permission.value),
  }),
}))

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      notificationsEnabled: true,
      trainingReminderHour: 18,
      trainingReminderMinute: 0,
      streakReminder: false,
      inactivityReminder: false,
    },
    update: vi.fn(async () => {}),
  }),
}))

afterEach(cleanup)

describe('NotificationsSection — permiso denegado', () => {
  it('en Android muestra el aviso y el botón, y el botón abre los ajustes', () => {
    permission.value = 'denied'
    canOpenMock.mockReturnValue(true)
    render(<NotificationsSection />)

    expect(screen.getByText('Notificaciones bloqueadas. Actívalas en los ajustes del sistema.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ajustes del sistema' }))
    expect(openSettingsMock).toHaveBeenCalledTimes(1)
  })

  it('en web no muestra el botón (no hay ajustes del sistema)', () => {
    permission.value = 'denied'
    canOpenMock.mockReturnValue(false)
    render(<NotificationsSection />)

    expect(screen.queryByRole('button', { name: 'Abrir ajustes del sistema' })).toBeNull()
  })

  it('con el permiso concedido no muestra el aviso ni el botón', () => {
    permission.value = 'granted'
    canOpenMock.mockReturnValue(true)
    render(<NotificationsSection />)

    expect(screen.queryByText(/Notificaciones bloqueadas/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Abrir ajustes del sistema' })).toBeNull()
  })
})
