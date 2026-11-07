// Allowlist de URLs que pueden venir de un backup restaurado. La app escribe
// siempre assets empaquetados o data URLs generadas por canvas; cualquier otro
// origen se descarta para que un archivo importado no pueda seleccionar un host
// de terceros (beacon con IP/Referer) ni un esquema ejecutable.
import type { ProgressPhotoEntry } from './types'

const IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/

// El parser de URL de WHATWG borra tab/CR/LF antes de resolver, así que
// `/\t/evil.example` se vuelve `//evil.example` (protocol-relative). Cualquier
// carácter de control descalifica el valor antes de mirar el resto.
// eslint-disable-next-line no-control-regex -- los caracteres de control son justamente lo que se rechaza.
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/

// Ruta absoluta del mismo origen. Rechaza `//host`, `..`, separadores Windows y
// caracteres de control; un valor que no es string cae al fallback, no lanza.
export const isSafeLocalAssetUrl = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('..') &&
  !value.includes('\\') &&
  !CONTROL_CHARS.test(value)

// Portada de rutina: el contrato del producto es /images/routines/<slug>.jpg.
export const isSafeRoutineCover = (value: unknown): value is string =>
  isSafeLocalAssetUrl(value) && value.startsWith('/images/routines/')

// Media de ejercicio: assets locales (hoy /exercises, pero el componente es
// genérico) o data URL de imagen. Nunca un host externo.
export const isSafeExerciseImage = (value: unknown): value is string =>
  typeof value === 'string' && (isSafeLocalAssetUrl(value) || IMAGE_DATA_URL.test(value))

// Foto de progreso: solo lo que produce la cámara/canvas.
export const isSafePhotoUri = (value: unknown): value is string =>
  typeof value === 'string' && IMAGE_DATA_URL.test(value)

export const normalizePhotoUri = (value: unknown): string | null =>
  isSafePhotoUri(value) ? value : null

// Copia de una fila restaurada con las URIs que no cumplen el contrato en null,
// para que las pantallas muestren su placeholder en vez de pedir un host ajeno.
export const sanitizeProgressPhotoEntry = (entry: ProgressPhotoEntry): ProgressPhotoEntry => ({
  ...entry,
  frontUri: normalizePhotoUri(entry.frontUri),
  sideUri: normalizePhotoUri(entry.sideUri),
  backUri: normalizePhotoUri(entry.backUri),
})
