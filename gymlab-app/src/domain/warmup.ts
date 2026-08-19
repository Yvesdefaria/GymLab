// Calentamiento guiado: secuencia de ejercicios dinámicos con temporizador.
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

// Estado del flujo de calentamiento.
export interface WarmupState {
  currentIndex: number
  secondsRemaining: number
  isRunning: boolean
  isFinished: boolean
  elapsed: number
}

export const initialWarmupState = (): WarmupState => ({
  currentIndex: 0,
  secondsRemaining: generalWarmup.exercises[0]?.durationSeconds ?? 0,
  isRunning: false,
  isFinished: false,
  elapsed: 0,
})

// Avanza al siguiente ejercicio o termina.
export const nextWarmupExercise = (state: WarmupState): WarmupState => {
  const nextIndex = state.currentIndex + 1
  if (nextIndex >= generalWarmup.exercises.length) {
    return { ...state, currentIndex: nextIndex, isRunning: false, isFinished: true, secondsRemaining: 0 }
  }
  return {
    ...state,
    currentIndex: nextIndex,
    secondsRemaining: generalWarmup.exercises[nextIndex].durationSeconds,
  }
}

// Tick del calentamiento.
export const tickWarmup = (state: WarmupState): WarmupState => {
  if (!state.isRunning || state.isFinished) return state
  const newSeconds = state.secondsRemaining - 1
  if (newSeconds < 0) return nextWarmupExercise(state)
  return { ...state, secondsRemaining: newSeconds, elapsed: (state.elapsed ?? 0) + 1 }
}
