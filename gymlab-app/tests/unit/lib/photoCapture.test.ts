// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
    convertFileSrc: vi.fn((path: string) => `converted:${path}`),
  },
}))

vi.mock('@capacitor/camera', () => ({
  Camera: {
    takePhoto: vi.fn(),
    chooseFromGallery: vi.fn(),
  },
}))

const { Capacitor } = await import('@capacitor/core')
const convertFileSrc = Capacitor.convertFileSrc as unknown as ReturnType<typeof vi.fn>
const { Camera } = await import('@capacitor/camera')
const {
  capturePhoto,
  clearPendingPhotoAngle,
  getPendingPhotoAngle,
  isCaptureCancel,
  isNativePlatform,
  resizeImageToDataUrl,
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

describe('capturePhoto — path sin webPath (OEM)', () => {
  it('convierte path a URL servible cuando el plugin no devuelve webPath', async () => {
    takePhoto.mockResolvedValue({ path: '/data/user/0/cache/foto.jpg' })
    await expect(capturePhoto('camera')).resolves.toBe('converted:/data/user/0/cache/foto.jpg')
    expect(convertFileSrc).toHaveBeenCalledWith('/data/user/0/cache/foto.jpg')
  })

  it('sin webPath ni path devuelve null', async () => {
    takePhoto.mockResolvedValue({})
    await expect(capturePhoto('camera')).resolves.toBeNull()
  })
})

describe('resizeImageToDataUrl', () => {
  const originalImage = globalThis.Image
  const stubImage = (onSrc: (img: { onerror: (() => void) | null }) => void) => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      width = 100
      height = 100
      set src(_value: string) {
        onSrc(this)
      }
    }
    globalThis.Image = FakeImage as unknown as typeof Image
  }

  afterEach(() => {
    globalThis.Image = originalImage
  })

  it('rechaza si la imagen nunca carga (antes quedaba colgada para siempre)', async () => {
    stubImage(() => {})
    await expect(resizeImageToDataUrl('bad://url', 100, 20)).rejects.toThrow('photo-timeout')
  })

  it('rechaza cuando el navegador dispara onerror', async () => {
    stubImage((img) => queueMicrotask(() => img.onerror?.()))
    await expect(resizeImageToDataUrl('bad://url', 100, 1000)).rejects.toThrow(
      'photo-load-failed',
    )
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
