import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const { Capacitor } = await import('@capacitor/core')
const { Media } = await import('@capacitor-community/media')
const { savePhotosToGallery } = await import('@/lib/saveToGallery')

const isNative = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>
const getPlatform = Capacitor.getPlatform as unknown as ReturnType<typeof vi.fn>
const getAlbums = Media.getAlbums as unknown as ReturnType<typeof vi.fn>
const createAlbum = Media.createAlbum as unknown as ReturnType<typeof vi.fn>
const savePhoto = Media.savePhoto as unknown as ReturnType<typeof vi.fn>

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
