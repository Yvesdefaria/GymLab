// Timer de rondas: configuración y lógica para AMRAP, EMOM, Tabata, For Time, Custom.
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

// Estado del timer durante una sesión.
export type TimerPhase = 'work' | 'rest' | 'roundRest' | 'finished'

export interface TimerState {
  phase: TimerPhase
  currentRound: number
  totalRoundsCompleted: number
  secondsRemaining: number
  totalSeconds: number
  isRunning: boolean
  elapsed: number // tiempo total transcurrido
}

// Calcula el siguiente estado del timer.
export const tickTimer = (state: TimerState, config: RoundConfig): TimerState => {
  if (!state.isRunning || state.phase === 'finished') return state

  const newSeconds = state.secondsRemaining - 1

  // Fin de una fase.
  if (newSeconds < 0) {
    // Work → Rest (o siguiente ronda)
    if (state.phase === 'work') {
      const newRound = state.currentRound + 1
      const totalCompleted = state.totalRoundsCompleted + 1

      // Verificar si terminó el workout.
      if (config.totalRounds > 0 && totalCompleted >= config.totalRounds) {
        return { ...state, phase: 'finished', secondsRemaining: 0, totalRoundsCompleted: totalCompleted, isRunning: false }
      }

      // Verificar time cap.
      if (config.timeCap > 0 && state.elapsed >= config.timeCap) {
        return { ...state, phase: 'finished', secondsRemaining: 0, isRunning: false }
      }

      // Si hay descanso, ir a rest.
      if (config.restSeconds > 0) {
        return {
          ...state,
          phase: 'rest',
          currentRound: newRound,
          totalRoundsCompleted: totalCompleted,
          secondsRemaining: config.restSeconds,
          totalSeconds: config.restSeconds,
          elapsed: state.elapsed + 1,
        }
      }

      // Sin descanso: siguiente ronda de trabajo.
      const workSeconds = config.mode === 'emom' ? Math.max(0, 60 - (state.elapsed % 60)) : config.workSeconds
      return {
        ...state,
        phase: 'work',
        currentRound: newRound,
        totalRoundsCompleted: totalCompleted,
        secondsRemaining: workSeconds,
        totalSeconds: workSeconds,
        elapsed: state.elapsed + 1,
      }
    }

    // Rest → Work
    if (state.phase === 'rest') {
      const workSeconds = config.mode === 'emom' ? Math.max(0, 60 - ((state.elapsed + 1) % 60)) : config.workSeconds
      return {
        ...state,
        phase: 'work',
        secondsRemaining: workSeconds,
        totalSeconds: workSeconds,
        elapsed: state.elapsed + 1,
      }
    }
  }

  return { ...state, secondsRemaining: newSeconds, elapsed: state.elapsed + 1 }
}

// Estado inicial del timer.
export const initialTimerState = (config: RoundConfig): TimerState => ({
  phase: 'work',
  currentRound: 1,
  totalRoundsCompleted: 0,
  secondsRemaining: config.mode === 'emom' ? 60 : config.workSeconds,
  totalSeconds: config.mode === 'emom' ? 60 : config.workSeconds,
  isRunning: false,
  elapsed: 0,
})

// Formatea segundos a MM:SS.
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
