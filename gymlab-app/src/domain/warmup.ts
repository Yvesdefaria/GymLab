// Calentamiento guiado: secuencia de ejercicios dinámicos con temporizador.
import {
  createCountdown,
  pauseCountdown,
  reconcile,
  remainingSeconds,
  resumeCountdown,
  startCountdown,
  type Countdown,
} from '@/domain/countdown'

export interface WarmupExercise {
  id: string
  nameKey: string // i18n key
  durationSeconds: number
  descriptionKey: string // i18n key
}

export interface WarmupRoutine {
  id: string
  nameKey: string
  exercises: WarmupExercise[]
  totalSeconds: number
}

// Plantilla de calentamiento general (~5 min).
export const generalWarmup: WarmupRoutine = {
  id: 'general',
  nameKey: 'warmup.routines.general',
  exercises: [
    {
      id: 'jumping-jacks',
      nameKey: 'warmup.exercises.jumpingJacks',
      durationSeconds: 45,
      descriptionKey: 'warmup.exercises.jumpingJacksDesc',
    },
    {
      id: 'high-knees',
      nameKey: 'warmup.exercises.highKnees',
      durationSeconds: 45,
      descriptionKey: 'warmup.exercises.highKneesDesc',
    },
    {
      id: 'arm-circles',
      nameKey: 'warmup.exercises.armCircles',
      durationSeconds: 30,
      descriptionKey: 'warmup.exercises.armCirclesDesc',
    },
    {
      id: 'bodyweight-squats',
      nameKey: 'warmup.exercises.bodyweightSquats',
      durationSeconds: 45,
      descriptionKey: 'warmup.exercises.bodyweightSquatsDesc',
    },
    {
      id: 'lunges',
      nameKey: 'warmup.exercises.lunges',
      durationSeconds: 45,
      descriptionKey: 'warmup.exercises.lungesDesc',
    },
    {
      id: 'hip-circles',
      nameKey: 'warmup.exercises.hipCircles',
      durationSeconds: 30,
      descriptionKey: 'warmup.exercises.hipCirclesDesc',
    },
    {
      id: 'torso-twists',
      nameKey: 'warmup.exercises.torsoTwists',
      durationSeconds: 30,
      descriptionKey: 'warmup.exercises.torsoTwistsDesc',
    },
    {
      id: 'shoulder-rolls',
      nameKey: 'warmup.exercises.shoulderRolls',
      durationSeconds: 30,
      descriptionKey: 'warmup.exercises.shoulderRollsDesc',
    },
  ],
  totalSeconds: 300, // 5 min
}

// Estado del flujo de calentamiento. `secondsRemaining`/`elapsed` son espejos
// derivados de `phaseEndsAt` (F96, D6): el intervalo sólo repinta.
export interface WarmupState {
  currentIndex: number
  secondsRemaining: number
  totalSeconds: number
  // Deadline absoluto (Date.now() ms) del ejercicio actual; null = pausado/detenido.
  phaseEndsAt: number | null
  // Restante congelado en ms mientras está pausado; null = no pausado.
  pausedRemainingMs: number | null
  isRunning: boolean
  isFinished: boolean
  elapsed: number
  // Transcurrido acumulado al empezar el ejercicio actual; base para `elapsed`.
  elapsedAtPhaseStart: number
}

const toCountdown = (state: WarmupState): Countdown => ({
  endsAt: state.phaseEndsAt,
  pausedRemaining: state.pausedRemainingMs,
  totalSeconds: state.totalSeconds,
})

const mirror = (state: WarmupState, countdown: Countdown, nowMs: number): WarmupState => {
  const remaining = remainingSeconds(countdown, nowMs)
  const consumed = Math.max(0, state.totalSeconds - remaining)
  return {
    ...state,
    phaseEndsAt: countdown.endsAt,
    pausedRemainingMs: countdown.pausedRemaining,
    secondsRemaining: remaining,
    elapsed: state.elapsedAtPhaseStart + consumed,
  }
}

export const initialWarmupState = (): WarmupState => {
  const total = generalWarmup.exercises[0]?.durationSeconds ?? 0
  return {
    currentIndex: 0,
    secondsRemaining: total,
    totalSeconds: total,
    phaseEndsAt: null,
    pausedRemainingMs: null,
    isRunning: false,
    isFinished: false,
    elapsed: 0,
    elapsedAtPhaseStart: 0,
  }
}

// Arranca o reanuda el flujo anclando el deadline del ejercicio actual.
export const startWarmup = (state: WarmupState, nowMs: number = Date.now()): WarmupState => {
  if (state.isRunning || state.isFinished) return state
  const countdown = toCountdown(state)
  const started =
    countdown.pausedRemaining !== null
      ? resumeCountdown(countdown, nowMs)
      : countdown.endsAt === null
        ? startCountdown(countdown, nowMs)
        : countdown
  return { ...mirror(state, started, nowMs), isRunning: true }
}

// Pausa el flujo congelando el restante y borrando el deadline.
export const pauseWarmup = (state: WarmupState, nowMs: number = Date.now()): WarmupState => {
  if (!state.isRunning) return state
  const paused = pauseCountdown(toCountdown(state), nowMs)
  return { ...mirror(state, paused, nowMs), isRunning: false }
}

// Avanza al siguiente ejercicio o termina. Conserva el transcurrido consumido.
export const nextWarmupExercise = (state: WarmupState, nowMs: number = Date.now()): WarmupState => {
  // Si está corriendo, primero sincroniza el espejo para no perder el tiempo consumido.
  const current = state.isRunning ? mirror(state, toCountdown(state), nowMs) : state
  const nextIndex = current.currentIndex + 1
  if (nextIndex >= generalWarmup.exercises.length) {
    return {
      ...current,
      currentIndex: nextIndex,
      isRunning: false,
      isFinished: true,
      secondsRemaining: 0,
      phaseEndsAt: null,
      pausedRemainingMs: null,
      elapsed: current.elapsed,
    }
  }
  const total = generalWarmup.exercises[nextIndex].durationSeconds
  const started = startCountdown(createCountdown(total), nowMs)
  return {
    ...current,
    currentIndex: nextIndex,
    totalSeconds: total,
    secondsRemaining: total,
    phaseEndsAt: started.endsAt,
    pausedRemainingMs: null,
    elapsedAtPhaseStart: current.elapsed,
    elapsed: current.elapsed,
  }
}

// Repinta desde el deadline y, si el ejercicio venció, avanza exactamente una vez.
export const reconcileWarmup = (state: WarmupState, nowMs: number = Date.now()): WarmupState => {
  if (!state.isRunning || state.isFinished) return state
  const { next, finishedNow } = reconcile(toCountdown(state), nowMs)
  const mirrored = mirror(state, next, nowMs)
  return finishedNow ? nextWarmupExercise(mirrored, nowMs) : mirrored
}
