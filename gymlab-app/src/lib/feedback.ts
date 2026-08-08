// Síntesis de sonidos y vibración con WebAudio (sin archivos de audio externos).
// Usado para los avisos de descanso y el gong de inicio de sesión.

let audioCtx: AudioContext | null = null

// Devuelve un AudioContext compartido y lo reanuda si el navegador lo suspendió.
const getCtx = (): AudioContext | null => {
  try {
    if (!audioCtx) {
      // Fallback a webkitAudioContext para Safari.
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

// Genera un tono senoidal con fade in/out exponencial para evitar clics.
const beep = (freq: number, durSec: number, delaySec = 0, vol = 0.18) => {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delaySec
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + durSec + 0.05)
  } catch {
    /* ignore */
  }
}

// Melodía de fin de descanso: tres tonos ascendentes.
export const playRestEndSound = () => {
  beep(880, 0.15)
  beep(880, 0.15, 0.22)
  beep(1174, 0.35, 0.44)
}

// Aviso de que el descanso está a punto de terminar.
export const playRestWarningSound = () => {
  beep(880, 0.22, 0, 0.4)
}

// Golpe de campana sintetizado: dos parciales simultáneos para el timbre metálico.
const bellHit = (delaySec = 0) => {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const t = ctx.currentTime + delaySec
    const dur = 0.6
    const partials: [number, number][] = [
      [1180, 0.22],
      [2970, 0.07],
    ]
    for (const [freq, vol] of partials) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    }
  } catch {
    /* ignore */
  }
}

// Campana doble estilo 'boxing bell', usada al iniciar la sesión.
export const playBoxingBellSound = () => {
  bellHit(0)
  bellHit(0.42)
}

// Vibración háptica opcional; no disponible en todos los navegadores.
export const vibrate = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignore */
  }
}
