// Puente a los ajustes del sistema: Android invoca el plugin local; web no toca nada;
// un fallo del plugin no rompe la UI (devuelve false y loguea).
// F128: el mismo plugin persiste el flag de consentimiento para el SDK nativo.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { openMock, consentMock } = vi.hoisted(() => ({
  openMock: vi.fn(async () => {}),
  consentMock: vi.fn(async () => {}),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: vi.fn(() => 'android') },
  registerPlugin: vi.fn(() => ({
    openNotificationSettings: openMock,
    setTelemetryConsent: consentMock,
  })),
}))

const { Capacitor } = await import('@capacitor/core')
const { canOpenSystemSettings, openNotificationSettings, syncNativeTelemetryConsent } = await import(
  '@/data/appSettings'
)
const { logger } = await import('@/lib/logger')

const getPlatform = Capacitor.getPlatform as unknown as ReturnType<typeof vi.fn>

describe('appSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPlatform.mockReturnValue('android')
    openMock.mockResolvedValue(undefined)
    consentMock.mockResolvedValue(undefined)
  })

  it('en Android abre los ajustes de notificaciones del plugin', async () => {
    await expect(openNotificationSettings()).resolves.toBe(true)
    expect(openMock).toHaveBeenCalledTimes(1)
  })

  it('en web no hay ajustes del sistema que abrir', async () => {
    getPlatform.mockReturnValue('web')

    expect(canOpenSystemSettings()).toBe(false)
    await expect(openNotificationSettings()).resolves.toBe(false)
    expect(openMock).not.toHaveBeenCalled()
  })

  it('si el plugin falla devuelve false y loguea, sin propagar', async () => {
    openMock.mockRejectedValue(new Error('activity missing'))
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    await expect(openNotificationSettings()).resolves.toBe(false)
    expect(warn).toHaveBeenCalledWith('settings', expect.any(String), expect.anything())
    warn.mockRestore()
  })

  it('en Android sincroniza el consentimiento nativo con el flag recibido', async () => {
    await syncNativeTelemetryConsent(true)
    expect(consentMock).toHaveBeenCalledWith({ enabled: true })

    await syncNativeTelemetryConsent(false)
    expect(consentMock).toHaveBeenLastCalledWith({ enabled: false })
  })

  it('en web no escribe ningún flag nativo', async () => {
    getPlatform.mockReturnValue('web')

    await syncNativeTelemetryConsent(true)
    expect(consentMock).not.toHaveBeenCalled()
  })

  it('si el flag nativo falla, loguea y no propaga', async () => {
    consentMock.mockRejectedValue(new Error('plugin missing'))
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    await expect(syncNativeTelemetryConsent(true)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('settings', expect.any(String), expect.anything())
    warn.mockRestore()
  })
})
