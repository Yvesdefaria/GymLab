// Retos dinámicos adaptativos: generan desafíos según historial y nivel del usuario.
// El progreso se calcula según la duración del reto y se resetea automáticamente al terminar el periodo.
import type { Level, Workout } from './types'
import { weekStartKey, twoWeekStartKey, monthStartKey, toLocalDateStr } from './dates'

export type ChallengeType = 'frecuencia' | 'volumen' | 'pr' | 'consistencia'
export type ChallengeDuration = '1semana' | '2semanas' | '1mes' | '2meses'

export interface Challenge {
  id: string
  titleKey: string
  descriptionKey: string
  type: ChallengeType
  duration: ChallengeDuration
  target: number
  unitKey: string
  minLevel: Level
}

export interface ChallengeProgress {
  challengeId: string
  current: number
  target: number
  completed: boolean
}

export interface ChallengeStats {
  sessionsCount: number
  volume: number
  prsCount: number
  consecutiveWeeks: number
}

// Deriva nivel del usuario a partir de su historial.
export const deriveLevel = (workouts: Workout[]): Level => {
  const count = workouts.length
  if (count >= 150) return 'avanzado'
  if (count >= 40) return 'intermedio'
  return 'principiante'
}

const workoutLocalDate = (w: Workout): string =>
  w.localDate.length === 10 ? w.localDate : toLocalDateStr(new Date(w.localDate))

// Filtra workouts dentro del periodo que corresponde a la duración del reto.
const workoutsInPeriod = (workouts: Workout[], duration: ChallengeDuration): Workout[] => {
  const now = toLocalDateStr()
  switch (duration) {
    case '1semana': {
      const weekKey = weekStartKey(now)
      return workouts.filter((w) => weekStartKey(workoutLocalDate(w)) === weekKey)
    }
    case '2semanas': {
      const start = twoWeekStartKey(now)
      return workouts.filter((w) => workoutLocalDate(w) >= start)
    }
    case '1mes': {
      const start = monthStartKey(now)
      return workouts.filter((w) => workoutLocalDate(w) >= start)
    }
    case '2meses': {
      const d = new Date(now + 'T12:00:00')
      d.setMonth(d.getMonth() - 2)
      d.setDate(1)
      return workouts.filter((w) => workoutLocalDate(w) >= toLocalDateStr(d))
    }
  }
}

// Calcula stats de retos para cada periodo de duración.
// PRs se filtran por periodo usando las fechas de los PRs.
export const computeChallengeStats = (
  workouts: Workout[],
  allPrDates: string[],
): { '1semana': ChallengeStats; '2semanas': ChallengeStats; '1mes': ChallengeStats; '2meses': ChallengeStats } => {
  const allDates = new Set(workouts.map((w) => workoutLocalDate(w)))
  const msPerDay = 86_400_000
  const now = toLocalDateStr()

  // Semanas consecutivas con al menos 1 sesión.
  let consecutiveWeeks = 0
  const todayMs = new Date(now).getTime()
  let cursorMs = todayMs
  while (true) {
    const wKey = weekStartKey(toLocalDateStr(new Date(cursorMs)))
    const hasSession = [...allDates].some((d) => weekStartKey(d) === wKey)
    if (!hasSession) break
    consecutiveWeeks++
    cursorMs -= 7 * msPerDay
  }

  // Cuenta PRs dentro del periodo de duración dado.
  const prsInPeriod = (duration: ChallengeDuration): number => {
    switch (duration) {
      case '1semana': {
        const wk = weekStartKey(now)
        return allPrDates.filter((d) => weekStartKey(d) === wk).length
      }
      case '2semanas': {
        const start = twoWeekStartKey(now)
        return allPrDates.filter((d) => d >= start).length
      }
      case '1mes': {
        const start = monthStartKey(now)
        return allPrDates.filter((d) => d >= start).length
      }
      case '2meses': {
        const d = new Date(now + 'T12:00:00')
        d.setMonth(d.getMonth() - 2)
        d.setDate(1)
        const start = toLocalDateStr(d)
        return allPrDates.filter((d) => d >= start).length
      }
    }
  }

  const build = (duration: ChallengeDuration): ChallengeStats => {
    const periodWorkouts = workoutsInPeriod(workouts, duration)
    return {
      sessionsCount: periodWorkouts.length,
      volume: periodWorkouts.reduce((sum, w) => sum + w.totalVolume, 0),
      prsCount: prsInPeriod(duration),
      consecutiveWeeks,
    }
  }

  return {
    '1semana': build('1semana'),
    '2semanas': build('2semanas'),
    '1mes': build('1mes'),
    '2meses': build('2meses'),
  }
}

// Seed de retos predefinidos.
export const CHALLENGES: Challenge[] = [
  // Frecuencia
  { id: 'freq-3', titleKey: 'challenge.freq3.title', descriptionKey: 'challenge.freq3.desc', type: 'frecuencia', duration: '1semana', target: 3, unitKey: 'challenge.unit.sessions', minLevel: 'principiante' },
  { id: 'freq-5', titleKey: 'challenge.freq5.title', descriptionKey: 'challenge.freq5.desc', type: 'frecuencia', duration: '1semana', target: 5, unitKey: 'challenge.unit.sessions', minLevel: 'intermedio' },
  { id: 'freq-6', titleKey: 'challenge.freq6.title', descriptionKey: 'challenge.freq6.desc', type: 'frecuencia', duration: '1semana', target: 6, unitKey: 'challenge.unit.sessions', minLevel: 'avanzado' },

  // Volumen (kg totales)
  { id: 'vol-20', titleKey: 'challenge.vol20.title', descriptionKey: 'challenge.vol20.desc', type: 'volumen', duration: '1semana', target: 5000, unitKey: 'challenge.unit.kg', minLevel: 'principiante' },
  { id: 'vol-40', titleKey: 'challenge.vol40.title', descriptionKey: 'challenge.vol40.desc', type: 'volumen', duration: '2semanas', target: 15000, unitKey: 'challenge.unit.kg', minLevel: 'intermedio' },
  { id: 'vol-80', titleKey: 'challenge.vol80.title', descriptionKey: 'challenge.vol80.desc', type: 'volumen', duration: '1mes', target: 40000, unitKey: 'challenge.unit.kg', minLevel: 'avanzado' },

  // PRs
  { id: 'pr-1', titleKey: 'challenge.pr1.title', descriptionKey: 'challenge.pr1.desc', type: 'pr', duration: '1semana', target: 1, unitKey: 'challenge.unit.pr', minLevel: 'principiante' },
  { id: 'pr-3', titleKey: 'challenge.pr3.title', descriptionKey: 'challenge.pr3.desc', type: 'pr', duration: '2semanas', target: 3, unitKey: 'challenge.unit.prs', minLevel: 'intermedio' },

  // Consistencia
  { id: 'cons-4', titleKey: 'challenge.cons4.title', descriptionKey: 'challenge.cons4.desc', type: 'consistencia', duration: '1mes', target: 4, unitKey: 'challenge.unit.consecutiveWeeks', minLevel: 'principiante' },
  { id: 'cons-8', titleKey: 'challenge.cons8.title', descriptionKey: 'challenge.cons8.desc', type: 'consistencia', duration: '2meses', target: 8, unitKey: 'challenge.unit.consecutiveWeeks', minLevel: 'intermedio' },
]

// Filtra retos disponibles según nivel.
export const getAvailableChallenges = (level: Level): Challenge[] => {
  const levels: Level[] = ['principiante', 'intermedio', 'avanzado']
  const minIdx = levels.indexOf(level)
  return CHALLENGES.filter((c) => levels.indexOf(c.minLevel) <= minIdx)
}

// Calcula progreso de un reto.
export const calculateProgress = (challenge: Challenge, current: number): ChallengeProgress => ({
  challengeId: challenge.id,
  current: Math.min(current, challenge.target),
  target: challenge.target,
  completed: current >= challenge.target,
})
