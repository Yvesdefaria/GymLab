let audioCtx: AudioContext | null = null

const getCtx = (): AudioContext | null => {
  try {
    if (!audioCtx) {
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

const beep = (freq: number, durSec: number, delaySec = 0) => {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delaySec
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + durSec + 0.05)
  } catch {
    /* ignore */
  }
}

export const playRestEndSound = () => {
  beep(880, 0.15)
  beep(880, 0.15, 0.22)
  beep(1174, 0.35, 0.44)
}

export const playRestWarningSound = () => {
  beep(523, 0.18)
}

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

export const playBoxingBellSound = () => {
  bellHit(0)
  bellHit(0.42)
}

export const playSetCompleteSound = () => {
  beep(660, 0.12)
}

export const vibrate = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignore */
  }
}
