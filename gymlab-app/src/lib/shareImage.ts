// Compartir la tarjeta de sesión (PNG) en web y nativo.
// El WebView de Android no expone navigator.share, así que en nativo el PNG se escribe
// al cache (ya expuesto por el FileProvider de la app) y se abre el chooser del sistema.
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export type ShareTarget = 'native' | 'web' | 'download'

interface ShareTargetInput {
  native: boolean
  canShare: boolean
}

// Nativo gana siempre: el chooser del sistema es más fiable que el share del WebView.
export const pickShareTarget = ({ native, canShare }: ShareTargetInput): ShareTarget => {
  if (native) return 'native'
  return canShare ? 'web' : 'download'
}

// navigator.canShare puede no existir (WebView viejo) o rechazar el payload con una excepción.
export const canShareFiles = (file: File): boolean => {
  if (!navigator.canShare) return false
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

// Cancelar no es un error real: el usuario cerró el chooser.
export const isAbortError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError'

// Nativo: base64 al cache y a compartir el file:// URI resultante.
// Capacitor v8: omitir `encoding` ES el camino binario documentado — el plugin
// decodifica el base64 y escribe los bytes del PNG (el enum JS no expone Base64).
export const shareCanvasNative = async (
  canvas: HTMLCanvasElement,
  filename: string,
  dialogTitle: string
): Promise<void> => {
  const base64 = canvas.toDataURL('image/png').split(',')[1]
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })
  await Share.share({ files: [uri], dialogTitle, title: dialogTitle })
}

// Web: Web Share API con archivos. `false` = sin soporte, el caller decide (descarga).
// No se tragan errores acá: AbortError (cancelación) sube para que el caller lo distinga.
export const shareCanvasWeb = async (canvas: HTMLCanvasElement, filename: string): Promise<boolean> => {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return false
  const file = new File([blob], filename, { type: 'image/png' })
  if (!canShareFiles(file) || typeof navigator.share !== 'function') return false
  await navigator.share({ files: [file] })
  return true
}
