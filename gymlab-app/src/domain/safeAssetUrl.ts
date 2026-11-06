// Allowlist de URLs que pueden venir de un backup restaurado. La app escribe
// siempre assets empaquetados o data URLs generadas por canvas; cualquier otro
// origen se descarta para que un archivo importado no pueda seleccionar un host
// de terceros (beacon con IP/Referer) ni un esquema ejecutable.
import type { ProgressPhotoEntry } from './types'

const IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/

// Ruta absoluta del mismo origen. Rechaza `//host`, `..` y separadores Windows.
export const isSafeLocalAssetUrl = (value: string | null | undefined): value is string =>
  !!value &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('..') &&
  !value.includes('\\')

// Portada de rutina: el contrato del producto es /images/routines/<slug>.jpg.
export const isSafeRoutineCover = (value: string | null | undefined): value is string =>
  isSafeLocalAssetUrl(value) && value.startsWith('/images/routines/')

// Media de ejercicio: assets locales (hoy /exercises, pero el componente es
// genérico) o data URL de imagen. Nunca un host externo.
export const isSafeExerciseImage = (value: string | null | undefined): value is string =>
  !!value && (isSafeLocalAssetUrl(value) || IMAGE_DATA_URL.test(value))

// Foto de progreso: solo lo que produce la cámara/canvas.
export const isSafePhotoUri = (value: string | null | undefined): value is string =>
  !!value && IMAGE_DATA_URL.test(value)

export const safePhotoUri = (value: string | null | undefined): string | null =>
  isSafePhotoUri(value) ? value : null

// Copia de una fila restaurada con las URIs que no cumplen el contrato en null,
// para que las pantallas muestren su placeholder en vez de pedir un host ajeno.
export const sanitizeProgressPhotoEntry = (entry: ProgressPhotoEntry): ProgressPhotoEntry => ({
  ...entry,
  frontUri: safePhotoUri(entry.frontUri),
  sideUri: safePhotoUri(entry.sideUri),
  backUri: safePhotoUri(entry.backUri),
})
