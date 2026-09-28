// Tests del módulo de compartir imagen (F105): elección de destino, guard de Web Share y
// el contrato de escritura nativa (en Capacitor v8, base64 sin `encoding` = bytes binarios).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { canShareFiles, isAbortError, pickShareTarget, shareCanvasNative } from '@/lib/shareImage'

// Mocks de los plugins nativos: pinnean la forma exacta de la escritura del PNG al cache.
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: vi.fn() },
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}))
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('pickShareTarget', () => {
  it('con nativo disponible gana native aunque canShare también esté', () => {
    expect(pickShareTarget({ native: true, canShare: true })).toBe('native')
  })

  it('con nativo disponible gana native aunque canShare no esté', () => {
    expect(pickShareTarget({ native: true, canShare: false })).toBe('native')
  })

  it('sin nativo, con canShare va a web', () => {
    expect(pickShareTarget({ native: false, canShare: true })).toBe('web')
  })

  it('sin nativo ni canShare cae a download', () => {
    expect(pickShareTarget({ native: false, canShare: false })).toBe('download')
  })
})

describe('canShareFiles', () => {
  const file = new File(['png'], 'gymlab-2026-09-27.png', { type: 'image/png' })

  it('true si navigator.canShare existe y acepta el archivo', () => {
    const canShare = vi.fn(() => true)
    vi.stubGlobal('navigator', { canShare })
    expect(canShareFiles(file)).toBe(true)
    expect(canShare).toHaveBeenCalledWith({ files: [file] })
  })

  it('false si navigator.canShare existe y rechaza el archivo', () => {
    vi.stubGlobal('navigator', { canShare: vi.fn(() => false) })
    expect(canShareFiles(file)).toBe(false)
  })

  it('false si navigator.canShare no existe', () => {
    vi.stubGlobal('navigator', {})
    expect(canShareFiles(file)).toBe(false)
  })

  it('false si navigator.canShare lanza (payload rechazado por el navegador)', () => {
    vi.stubGlobal('navigator', {
      canShare: vi.fn(() => {
        throw new TypeError('bad payload')
      }),
    })
    expect(canShareFiles(file)).toBe(false)
  })
})

describe('isAbortError', () => {
  it('true para un AbortError (DOMException)', () => {
    expect(isAbortError(new DOMException('cancelled', 'AbortError'))).toBe(true)
  })

  it('true para un error con name AbortError', () => {
    expect(isAbortError(Object.assign(new Error('cancel'), { name: 'AbortError' }))).toBe(true)
  })

  it('false para otro error', () => {
    expect(isAbortError(new Error('boom'))).toBe(false)
  })

  it('false para valores no-error', () => {
    expect(isAbortError(null)).toBe(false)
    expect(isAbortError('AbortError')).toBe(false)
  })
})

describe('shareCanvasNative', () => {
  const canvas = { toDataURL: () => 'data:image/png;base64,QUJD' } as unknown as HTMLCanvasElement

  it('escribe el PNG al cache en binario (base64 y SIN encoding, contrato v8)', async () => {
    vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file:///cache/gymlab-2026-09-27.png' })
    vi.mocked(Share.share).mockResolvedValue({})

    await shareCanvasNative(canvas, 'gymlab-2026-09-27.png', 'Compartir')

    // Omitir `encoding` es el camino binario de v8: el plugin decodifica el base64 (no lo escribe como texto).
    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: 'gymlab-2026-09-27.png',
      data: 'QUJD',
      directory: 'CACHE',
    })
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///cache/gymlab-2026-09-27.png'], dialogTitle: 'Compartir' })
    )
  })
})
