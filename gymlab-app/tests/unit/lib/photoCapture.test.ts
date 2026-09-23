import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
}))

vi.mock('@capacitor/camera', () => ({
  Camera: {
    takePhoto: vi.fn(),
    chooseFromGallery: vi.fn(),
  },
}))

const { Capacitor } = await import('@capacitor/core')
const { Camera } = await import('@capacitor/camera')
const {
  capturePhoto,
  clearPendingPhotoAngle,
  getPendingPhotoAngle,
  isCaptureCancel,
  isNativePlatform,
  setPendingPhotoAngle,
} = await import('@/lib/photoCapture')

const isNative = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>
const takePhoto = Camera.takePhoto as unknown as ReturnType<typeof vi.fn>
const chooseFromGallery = Camera.chooseFromGallery as unknown as ReturnType<typeof vi.fn>

describe('isNativePlatform', () => {
  it('delega en Capacitor.isNativePlatform', () => {
    isNative.mockReturnValue(false)
    expect(isNativePlatform()).toBe(false)
    isNative.mockReturnValue(true)
    expect(isNativePlatform()).toBe(true)
  })
})

describe('isCaptureCancel', () => {
  it('reconoce los códigos de cancelación del plugin', () => {
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0006' })).toBe(true)
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0013' })).toBe(true)
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0020' })).toBe(true)
  })

  it('reconoce mensajes con "cancel" (case-insensitive)', () => {
    expect(isCaptureCancel(new Error('User cancelled photos app'))).toBe(true)
  })

  it('no confunde errores reales', () => {
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0003' })).toBe(false)
    expect(isCaptureCancel(null)).toBe(false)
    expect(isCaptureCancel('otra cosa')).toBe(false)
  })
})

describe('capturePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
  })

  it('cámara: usa takePhoto con quality 90 y devuelve webPath', async () => {
    takePhoto.mockResolvedValue({ webPath: 'capacitor://foto.jpg' })
    await expect(capturePhoto('camera')).resolves.toBe('capacitor://foto.jpg')
    expect(takePhoto).toHaveBeenCalledWith({ quality: 90 })
  })

  it('galería: usa chooseFromGallery y devuelve el primer webPath', async () => {
    chooseFromGallery.mockResolvedValue({ results: [{ webPath: 'capacitor://g1.jpg' }] })
    await expect(capturePhoto('gallery')).resolves.toBe('capacitor://g1.jpg')
    expect(chooseFromGallery).toHaveBeenCalledWith({ quality: 90 })
  })

  it('galería sin selección devuelve null', async () => {
    chooseFromGallery.mockResolvedValue({ results: [] })
    await expect(capturePhoto('gallery')).resolves.toBeNull()
  })

  it('cancelación devuelve null (no lanza)', async () => {
    takePhoto.mockRejectedValue({ code: 'OS-PLUG-CAMR-0006' })
    await expect(capturePhoto('camera')).resolves.toBeNull()
  })

  it('error real se propaga', async () => {
    takePhoto.mockRejectedValue({ code: 'OS-PLUG-CAMR-0003' })
    await expect(capturePhoto('camera')).rejects.toMatchObject({ code: 'OS-PLUG-CAMR-0003' })
  })
})

describe('ángulo pendiente (localStorage)', () => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
  })

  it('guarda, lee y limpia un ángulo válido', () => {
    setPendingPhotoAngle('sideUri')
    expect(getPendingPhotoAngle()).toBe('sideUri')
    clearPendingPhotoAngle()
    expect(getPendingPhotoAngle()).toBeNull()
  })

  it('ignora valores corruptos', () => {
    localStorage.setItem('gymlab-pending-photo-angle', 'hack')
    expect(getPendingPhotoAngle()).toBeNull()
  })
})
