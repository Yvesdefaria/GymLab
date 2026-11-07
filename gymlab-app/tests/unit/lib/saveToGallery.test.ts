import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
}))

vi.mock('@capacitor-community/media', () => ({
  Media: {
    getAlbums: vi.fn(),
    createAlbum: vi.fn(),
    savePhoto: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }))

const { Capacitor } = await import('@capacitor/core')
const { Media } = await import('@capacitor-community/media')
const { savePhotosToGallery } = await import('@/lib/saveToGallery')
const { logger } = await import('@/lib/logger')

const isNative = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>
const getPlatform = Capacitor.getPlatform as unknown as ReturnType<typeof vi.fn>
const getAlbums = Media.getAlbums as unknown as ReturnType<typeof vi.fn>
const createAlbum = Media.createAlbum as unknown as ReturnType<typeof vi.fn>
const savePhoto = Media.savePhoto as unknown as ReturnType<typeof vi.fn>
const loggedWarn = logger.warn as unknown as ReturnType<typeof vi.fn>

const PHOTO = { dataUrl: 'data:image/jpeg;base64,AAA', fileName: 'gymlab-2026-09-23-front' }

describe('savePhotosToGallery (nativo Android)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('android')
    getAlbums.mockResolvedValue({ albums: [{ identifier: 'gymlab-id', name: 'GymLab', type: 'user' }] })
    savePhoto.mockResolvedValue({})
  })

  it('usa el álbum existente y guarda con fileName', async () => {
    await expect(savePhotosToGallery([PHOTO])).resolves.toEqual({ saved: 1, failed: 0 })
    expect(savePhoto).toHaveBeenCalledWith({
      path: PHOTO.dataUrl,
      albumIdentifier: 'gymlab-id',
      fileName: PHOTO.fileName,
    })
    expect(createAlbum).not.toHaveBeenCalled()
  })

  it('crea el álbum "GymLab" si no existe', async () => {
    getAlbums
      .mockResolvedValueOnce({ albums: [] })
      .mockResolvedValueOnce({ albums: [{ identifier: 'nuevo-id', name: 'GymLab', type: 'user' }] })
    await savePhotosToGallery([PHOTO])
    expect(createAlbum).toHaveBeenCalledWith({ name: 'GymLab' })
    expect(savePhoto).toHaveBeenCalledWith(expect.objectContaining({ albumIdentifier: 'nuevo-id' }))
  })

  it('cuenta los fallos por foto sin cortar el resto', async () => {
    savePhoto.mockRejectedValueOnce({ code: 'accessDenied' }).mockResolvedValueOnce({})
    const r = await savePhotosToGallery([PHOTO, { ...PHOTO, fileName: 'dos' }])
    expect(r).toEqual({ saved: 1, failed: 1 })
    expect(loggedWarn).toHaveBeenCalledWith(
      'gallery',
      'no se pudo guardar la foto',
      { error: expect.objectContaining({ code: 'accessDenied' }) },
    )
  })
})

describe('savePhotosToGallery (iOS)', () => {
  it('no pide álbum (permiso add-only)', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('ios')
    savePhoto.mockResolvedValue({})
    await savePhotosToGallery([PHOTO])
    expect(getAlbums).not.toHaveBeenCalled()
    expect(savePhoto).toHaveBeenCalledWith({
      path: PHOTO.dataUrl,
      albumIdentifier: undefined,
      fileName: PHOTO.fileName,
    })
  })
})

describe('savePhotosToGallery (web)', () => {
  it('descarga cada foto y no toca el plugin', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(false)
    const click = vi.fn()
    const anchor = { href: '', download: '', click }
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor) })
    await expect(savePhotosToGallery([PHOTO, { ...PHOTO, fileName: 'dos' }])).resolves.toEqual({
      saved: 2,
      failed: 0,
    })
    expect(click).toHaveBeenCalledTimes(2)
    expect(savePhoto).not.toHaveBeenCalled()
    expect(anchor.download).toBe('dos.jpg')
  })
})

// Un backup restaurado puede poner cualquier string en frontUri/sideUri/backUri.
// El sink solo acepta lo que producen las cámaras: data:image/<permitido>;base64.
describe('savePhotosToGallery (origen no confiable)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('no manda al plugin una ruta local restaurada', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('android')
    getAlbums.mockResolvedValue({ albums: [{ identifier: 'gymlab-id', name: 'GymLab', type: 'user' }] })
    const r = await savePhotosToGallery([
      { dataUrl: 'file:///data/user/0/com.gymlab.app/cache/gymlab-backup.json', fileName: 'x' },
    ])
    expect(r).toEqual({ saved: 0, failed: 1 })
    expect(savePhoto).not.toHaveBeenCalled()
  })

  it('en web no asigna un javascript: al href', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(false)
    const click = vi.fn()
    const anchor = { href: '', download: '', click }
    const createElement = vi.fn(() => anchor)
    vi.stubGlobal('document', { createElement })
    const r = await savePhotosToGallery([{ dataUrl: 'javascript:alert(1)', fileName: 'x' }])
    expect(r).toEqual({ saved: 0, failed: 1 })
    expect(createElement).not.toHaveBeenCalled()
    expect(click).not.toHaveBeenCalled()
  })

  it('rechaza una URL ofuscada con tab', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('android')
    getAlbums.mockResolvedValue({ albums: [{ identifier: 'gymlab-id', name: 'GymLab', type: 'user' }] })
    const r = await savePhotosToGallery([{ dataUrl: '/\t/evil.example/x.png', fileName: 'tab' }])
    expect(r).toEqual({ saved: 0, failed: 1 })
    expect(savePhoto).not.toHaveBeenCalled()
  })

  it('mezcla válidas e inválidas sin cortar las válidas', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('android')
    getAlbums.mockResolvedValue({ albums: [{ identifier: 'gymlab-id', name: 'GymLab', type: 'user' }] })
    savePhoto.mockResolvedValue({})
    const r = await savePhotosToGallery([
      { dataUrl: 'https://collector.example/x.png', fileName: 'remota' },
      PHOTO,
    ])
    expect(r).toEqual({ saved: 1, failed: 1 })
    expect(savePhoto).toHaveBeenCalledTimes(1)
    expect(savePhoto).toHaveBeenCalledWith(expect.objectContaining({ path: PHOTO.dataUrl }))
  })
})
