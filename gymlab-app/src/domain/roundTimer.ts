// Timer de rondas: configuración y lógica para AMRAP, EMOM, Tabata, For Time, Custom.
import {
  createCountdown,
  pauseCountdown,
  reconcile,
  remainingSeconds,
  resumeCountdown,
  startCountdown,
  type Countdown,
} from '@/domain/countdown'

export type TimerMode = 'tabata' | 'emom' | 'amrap' | 'fortime' | 'custom'

export interface RoundConfig {
  mode: TimerMode
  workSeconds: number
  restSeconds: number
  rounds: number // rondas por bloque (0 = infinito para AMRAP)
  totalRounds: number // rondas totales del workout (0 = sin límite)
  timeCap: number // límite de tiempo en segundos (0 = sin límite)
}

// Configuraciones predefinidas por modo.
export const timerPresets: Record<TimerMode, RoundConfig> = {
  tabata: {
    mode: 'tabata',
    workSeconds: 20,
    restSeconds: 10,
    rounds: 8,
    totalRounds: 8,
    timeCap: 0,
  },
  emom: {
    mode: 'emom',
    workSeconds: 60,
    restSeconds: 0,
    rounds: 0,
    totalRounds: 0,
    timeCap: 600, // 10 min por defecto
  },
  amrap: {
    mode: 'amrap',
    workSeconds: 0,
    restSeconds: 0,
    rounds: 0,
    totalRounds: 0,
    timeCap: 600, // 10 min por defecto
  },
  fortime: {
    mode: 'fortime',
    workSeconds: 0,
    restSeconds: 0,
    rounds: 0,
    totalRounds: 0,
    timeCap: 600, // 10 min por defecto
  },
  custom: {
    mode: 'custom',
    workSeconds: 30,
    restSeconds: 10,
    rounds: 10,
    totalRounds: 0,
    timeCap: 0,
  },
}

// Estado del timer durante una sesión. `secondsRemaining`/`elapsed` son espejos
// derivados de `phaseEndsAt` (F96, D6): el intervalo sólo repinta.
export type TimerPhase = 'work' | 'rest' | 'roundRest' | 'finished'

export interface TimerState {
  phase: TimerPhase
  currentRound: number
  totalRoundsCompleted: number
  secondsRemaining: number
  totalSeconds: number
  // Deadline absoluto (Date.now() ms) de la fase actual; null = pausada o detenida.
  phaseEndsAt: number | null
  // Restante congelado en ms mientras está pausada; null = no pausada.
  pausedRemainingMs: number | null
  isRunning: boolean
  elapsed: number // tiempo total transcurrido (derivado de phaseEndsAt)
  // Transcurrido acumulado al empezar la fase actual; base para `elapsed`.
  elapsedAtPhaseStart: number
}

// Reconstruye la primitiva compartida a partir del estado del timer.
const toCountdown = (state: TimerState): Countdown => ({
  endsAt: state.phaseEndsAt,
  pausedRemaining: state.pausedRemainingMs,
  totalSeconds: state.totalSeconds,
})

// Refresca los espejos derivados (restante y transcurrido) desde el deadline.
const mirror = (state: TimerState, countdown: Countdown, nowMs: number): TimerState => {
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

// Arranca una fase nueva anclando su deadline a `nowMs`.
const startPhase = (
  state: TimerState,
  phase: TimerPhase,
  totalSeconds: number,
  nowMs: number,
  extra: Partial<TimerState> = {}
): TimerState => {
  const started = startCountdown(createCountdown(totalSeconds), nowMs)
  return {
    ...state,
    ...extra,
    phase,
    totalSeconds,
    secondsRemaining: totalSeconds,
    phaseEndsAt: started.endsAt,
    pausedRemainingMs: null,
    elapsed: state.elapsedAtPhaseStart,
    elapsedAtPhaseStart: state.elapsedAtPhaseStart,
  }
}

const finished = (state: TimerState, totalRoundsCompleted: number): TimerState => ({
  ...state,
  phase: 'finished',
  secondsRemaining: 0,
  phaseEndsAt: null,
  pausedRemainingMs: null,
  isRunning: false,
  totalRoundsCompleted,
  elapsed: state.elapsedAtPhaseStart,
})

// Avanza a la fase siguiente acumulando el tiempo completo de la fase vencida.
const advancePhase = (state: TimerState, config: RoundConfig, nowMs: number): TimerState => {
  const base = { ...state, elapsedAtPhaseStart: state.elapsedAtPhaseStart + state.totalSeconds }

  if (state.phase === 'work') {
    const newRound = state.currentRound + 1
    const totalCompleted = state.totalRoundsCompleted + 1

    if (config.totalRounds > 0 && totalCompleted >= config.totalRounds) return finished(base, totalCompleted)
    if (config.timeCap > 0 && state.elapsed >= config.timeCap) return finished(base, state.totalRoundsCompleted)

    if (config.restSeconds > 0) {
      return startPhase(base, 'rest', config.restSeconds, nowMs, { currentRound: newRound, totalRoundsCompleted: totalCompleted })
    }

    const workSeconds = config.mode === 'emom' ? Math.max(0, 60 - (base.elapsedAtPhaseStart % 60)) : config.workSeconds
    return startPhase(base, 'work', workSeconds, nowMs, { currentRound: newRound, totalRoundsCompleted: totalCompleted })
  }

  if (state.phase === 'rest') {
    const workSeconds = config.mode === 'emom' ? Math.max(0, 60 - (base.elapsedAtPhaseStart % 60)) : config.workSeconds
    return startPhase(base, 'work', workSeconds, nowMs)
  }

  return state
}

// Arranca o reanuda el timer: ancla (o reancla) el deadline de la fase actual.
export const startTimer = (state: TimerState, nowMs: number = Date.now()): TimerState => {
  if (state.isRunning || state.phase === 'finished') return state
  const countdown = toCountdown(state)
  const started =
    countdown.pausedRemaining !== null
      ? resumeCountdown(countdown, nowMs)
      : countdown.endsAt === null
        ? startCountdown(countdown, nowMs)
        : countdown
  return { ...mirror(state, started, nowMs), isRunning: true }
}

// Pausa el timer congelando el restante y borrando el deadline.
export const pauseTimer = (state: TimerState, nowMs: number = Date.now()): TimerState => {
  if (!state.isRunning) return state
  const paused = pauseCountdown(toCountdown(state), nowMs)
  return { ...mirror(state, paused, nowMs), isRunning: false }
}

// Repinta desde el deadline y, si la fase venció, avanza exactamente una vez.
export const reconcileTimer = (state: TimerState, config: RoundConfig, nowMs: number = Date.now()): TimerState => {
  if (!state.isRunning || state.phase === 'finished') return state
  const { next, finishedNow } = reconcile(toCountdown(state), nowMs)
  const mirrored = mirror(state, next, nowMs)
  return finishedNow ? advancePhase(mirrored, config, nowMs) : mirrored
}

// Estado inicial del timer.
export const initialTimerState = (config: RoundConfig): TimerState => {
  const workSeconds = config.mode === 'emom' ? 60 : config.workSeconds
  return {
    phase: 'work',
    currentRound: 1,
    totalRoundsCompleted: 0,
    secondsRemaining: workSeconds,
    totalSeconds: workSeconds,
    phaseEndsAt: null,
    pausedRemainingMs: null,
    isRunning: false,
    elapsed: 0,
    elapsedAtPhaseStart: 0,
  }
}

// Formatea segundos a MM:SS.
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
