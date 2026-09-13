// Haptics unificados (F96, D5): un único punto de política para plataforma,
// ajuste del usuario y accesibilidad. Nativo usa @capacitor/haptics; web usa
// navigator.vibrate; donde no hay API soportada es un no-op silencioso.
//
// El audio vive aparte (lib/feedback.ts): aquí sólo hay vibración.
import { Capacitor } from '@capacitor/core'
import { Haptics } from '@capacitor/haptics'

// Destino puro de una petición de vibración.
export type HapticsTarget = 'native' | 'web' | 'noop'

export interface HapticsDecisionInput {
  // Ajuste del usuario (p. ej. `restVibrate`, por defecto off).
  enabled: boolean
  // `true` en la app Capacitor (iOS/Android); `false` en web/PWA.
  platform: 'native' | 'web'
  // `navigator.vibrate` disponible (false en iOS WebKit).
  webVibrateAvailable: boolean
  // `prefers-reduced-motion: reduce` activo.
  reducedMotion: boolean
}

// Decide el destino sin tocar ningún API: pura y testeable en node.
export const decideHaptics = ({
  enabled,
  platform,
  webVibrateAvailable,
  reducedMotion,
}: HapticsDecisionInput): HapticsTarget => {
  if (!enabled || reducedMotion) return 'noop'
  if (platform === 'native') return 'native'
  return webVibrateAvailable ? 'web' : 'noop'
}

// Divide un patrón de vibración en pulsos. Los silencios se conservan como
// pasos propios (naive split); el ritmo no se promete exacto porque la API
// nativa no acepta patrones.
export const splitVibrationPattern = (pattern: number | number[]): number[] => {
  if (Array.isArray(pattern)) return pattern.filter((step) => Number.isFinite(step) && step > 0)
  return Number.isFinite(pattern) && pattern > 0 ? [pattern] : []
}

// Backend inyectable: en producción son los APIs reales; los tests lo sustituyen
// para observar el despacho sin DOM.
export interface HapticsBackend {
  native: (pattern: number | number[]) => void
  web: (pattern: number | number[]) => void
}

const executeNative = (pattern: number | number[]): void => {
  const vibrateMs = splitVibrationPattern(pattern)
  // Haptics no acepta un patrón: se emiten pulsos secuenciales (sin prometer ritmo).
  void Promise.all(vibrateMs.map((duration) => Haptics.vibrate({ duration })))
}

const executeWeb = (pattern: number | number[]): void => {
  navigator.vibrate?.(pattern)
}

const REAL_BACKEND: HapticsBackend = {
  native: executeNative,
  web: executeWeb,
}

let injectedBackend: HapticsBackend | null = null

// Inyecta un backend (solo tests). `null` restaura el real.
export const setHapticsBackend = (backend: HapticsBackend | null): void => {
  injectedBackend = backend
}

export interface HapticsOptions {
  // Ajuste del usuario; por defecto se permite la vibración.
  enabled?: boolean
  // Override de `prefers-reduced-motion` (tests o llamadores que ya lo resolvieron).
  reducedMotion?: boolean
}

// Vibra con el patrón solicitado si la plataforma y la política lo permiten.
// `pattern`: pulsos en ms (número suelto o patrón).
export const haptics = (
  pattern: number | number[],
  { enabled = true, reducedMotion }: HapticsOptions = {},
): void => {
  const backend = injectedBackend ?? REAL_BACKEND
  // Con backend inyectado se fuerza el despacho web: la decisión de la
  // plataforma no es fiable fuera del WebView de Capacitor.
  const platform = injectedBackend ? 'web' : Capacitor.isNativePlatform() ? 'native' : 'web'
  // Un backend inyectado implica disponibilidad (los tests corren sin navigator).
  const webVibrateAvailable =
    injectedBackend !== null ||
    (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function')

  let reduced = reducedMotion ?? false
  if (reducedMotion === undefined) {
    try {
      reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      reduced = false
    }
  }

  const target = decideHaptics({ enabled, platform, webVibrateAvailable, reducedMotion: reduced })
  if (target === 'noop') return

  try {
    if (target === 'native') backend.native(pattern)
    else backend.web(pattern)
  } catch {
    // Sin gesto de usuario / API bloqueada: no-op silencioso, nunca romper el timer.
  }
}
