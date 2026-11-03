// Captura de fotos: plugin Camera en nativo (cámara/galería) y fallback a input file en web.
import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'

export type PhotoSource = 'camera' | 'gallery'
export type PhotoAngle = 'frontUri' | 'sideUri' | 'backUri'

// Códigos de cancelación del plugin Camera (el usuario cerró cámara/galería/editor).
const CANCEL_CODES = ['OS-PLUG-CAMR-0006', 'OS-PLUG-CAMR-0013', 'OS-PLUG-CAMR-0020']
const PENDING_KEY = 'gymlab-pending-photo-angle'

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform()

// Cancelación = código conocido o mensaje con "cancel" (case-insensitive).
export const isCaptureCancel = (err: unknown): boolean => {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { code?: unknown; message?: unknown }
  if (typeof e.code === 'string' && CANCEL_CODES.includes(e.code)) return true
  return typeof e.message === 'string' && /cancel/i.test(e.message)
}

// webPath es opcional en las typings del plugin (8.x) y algunos OEM devuelven solo
// `path`: el WebView necesita una URL servible, así que se convierte con convertFileSrc.
const pickPhotoSrc = (photo: { webPath?: string; path?: string } | undefined): string | null => {
  if (!photo) return null
  if (photo.webPath) return photo.webPath
  return photo.path ? Capacitor.convertFileSrc(photo.path) : null
}

// Abre cámara o galería nativas y devuelve el webPath de la foto.
// null = el usuario canceló; lanza si el error es real.
export const capturePhoto = async (source: PhotoSource): Promise<string | null> => {
  try {
    if (source === 'camera') {
      return pickPhotoSrc(await Camera.takePhoto({ quality: 90 }))
    }
    const { results } = await Camera.chooseFromGallery({ quality: 90 })
    return pickPhotoSrc(results[0])
  } catch (err) {
    if (isCaptureCancel(err)) return null
    throw err
  }
}

// Lee un File del input web como data URL.
export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })

// Redimensiona (máx. maxPx) y devuelve JPEG base64. Acepta data URL o webPath nativo.
// Rechaza si la imagen no carga o si tarda más que `timeoutMs`: antes solo resolvía en
// `onload`, así que una URL no servible dejaba la promesa colgada para siempre y el
// flujo de la foto terminaba en silencio (Fase 136.4).
export const resizeImageToDataUrl = (
  src: string,
  maxPx: number,
  timeoutMs = 8000,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const timer = window.setTimeout(() => reject(new Error('photo-timeout')), timeoutMs)
    const fail = () => {
      window.clearTimeout(timer)
      reject(new Error('photo-load-failed'))
    }
    img.onload = () => {
      window.clearTimeout(timer)
      try {
        const canvas = document.createElement('canvas')
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = fail
    img.src = src
  })

// Ángulo pendiente: sobrevive si Android mata la app con la cámara abierta (appRestoredResult).
export const setPendingPhotoAngle = (angle: PhotoAngle) =>
  localStorage.setItem(PENDING_KEY, angle)

export const getPendingPhotoAngle = (): PhotoAngle | null => {
  const v = localStorage.getItem(PENDING_KEY)
  return v === 'frontUri' || v === 'sideUri' || v === 'backUri' ? v : null
}

export const clearPendingPhotoAngle = () => localStorage.removeItem(PENDING_KEY)
