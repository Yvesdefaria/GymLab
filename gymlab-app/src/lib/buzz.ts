// Beep corto para timers y flujos de descanso/calentamiento.
// Sólo audio: la vibración vive en `lib/haptics.ts` (política única, F96 D5).
export interface BuzzOptions {
  frequency?: number
  gain?: number
}

export const buzz = ({
  frequency = 880,
  gain = 0.3,
}: BuzzOptions = {}): void => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.frequency.value = frequency
    gainNode.gain.value = gain
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch { /* silent */ }
}
