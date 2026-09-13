// Primitiva pura de cuenta atrás anclada a un deadline absoluto de reloj de pared.
// Compartida por descanso, rondas y calentamiento (F96, D6): el consumidor sólo
// necesita repintar; el tiempo restante siempre se recalcula desde `endsAt`, así
// que los ticks perdidos o coalescidos no acumulan error.
export interface Countdown {
  // Deadline absoluto en ms (Date.now()). null = detenida o pausada.
  endsAt: number | null
  // Restante congelado en ms mientras está pausada. null = no pausada.
  pausedRemaining: number | null
  totalSeconds: number
}

export const createCountdown = (totalSeconds: number): Countdown => ({
  endsAt: null,
  pausedRemaining: null,
  totalSeconds,
})

export const startCountdown = (countdown: Countdown, nowMs: number = Date.now()): Countdown => ({
  ...countdown,
  endsAt: nowMs + countdown.totalSeconds * 1000,
  pausedRemaining: null,
})

// max(0, ceil((deadline - now) / 1000)) — la única fuente del valor mostrado.
export const remainingSeconds = (countdown: Countdown, nowMs: number = Date.now()): number => {
  if (countdown.pausedRemaining !== null) return Math.max(0, Math.ceil(countdown.pausedRemaining / 1000))
  if (countdown.endsAt === null) return 0
  return Math.max(0, Math.ceil((countdown.endsAt - nowMs) / 1000))
}

export const pauseCountdown = (countdown: Countdown, nowMs: number = Date.now()): Countdown => {
  if (countdown.endsAt === null) return countdown
  return { ...countdown, pausedRemaining: Math.max(0, countdown.endsAt - nowMs), endsAt: null }
}

export const resumeCountdown = (countdown: Countdown, nowMs: number = Date.now()): Countdown => {
  if (countdown.pausedRemaining === null) return countdown
  return { ...countdown, endsAt: nowMs + countdown.pausedRemaining, pausedRemaining: null }
}

// Reconcilia contra el deadline real. `finishedNow` es true exactamente una vez:
// la primera vez que se observa vencida una cuenta con deadline activo.
export const reconcile = (
  countdown: Countdown,
  nowMs: number = Date.now()
): { next: Countdown; finishedNow: boolean } => {
  const expired = countdown.endsAt !== null && nowMs >= countdown.endsAt
  if (!expired) return { next: countdown, finishedNow: false }
  return { next: { ...countdown, endsAt: null, pausedRemaining: 0 }, finishedNow: true }
}

// Modo de la fracción de progreso mostrada por el anillo.
export type ProgressMode = 'elapsed' | 'remaining'

// Fracción de progreso derivada del mismo par (restante, total) que el número,
// acotada a [0, 1] para que el anillo no pueda divergir del valor mostrado.
export const countdownFraction = (
  remaining: number,
  total: number,
  mode: ProgressMode = 'elapsed'
): number => {
  if (total <= 0) return 0
  const ratio = Math.min(1, Math.max(0, remaining / total))
  return mode === 'remaining' ? ratio : 1 - ratio
}
