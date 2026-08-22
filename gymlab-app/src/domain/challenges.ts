// Retos dinámicos adaptativos: generan desafíos según historial y nivel del usuario.
import type { Level, Workout } from './types'
import { weekStartKey, toLocalDateStr } from './dates'

export type ChallengeType = 'frecuencia' | 'volumen' | 'pr' | 'consistencia'
export type ChallengeDuration = '1semana' | '2semanas' | '1mes'

export interface Challenge {
  id: string
  titleKey: string
  descriptionKey: string
  type: ChallengeType
  duration: ChallengeDuration
  target: number
  unit: string
  minLevel: Level
}

export interface ChallengeProgress {
  challengeId: string
  current: number
  target: number
  completed: boolean
}

export interface ChallengeStats {
  sessionsThisWeek: number
  volumeThisWeek: number
  prsThisWeek: number
  consecutiveWeeks: number
}

// Deriva nivel del usuario a partir de su historial.
export const deriveLevel = (workouts: Workout[]): Level => {
  const count = workouts.length
  if (count >= 150) return 'avanzado'
  if (count >= 40) return 'intermedio'
  return 'principiante'
}

const workoutWeekKey = (w: Workout): string => {
  const d = w.localDate.length === 10 ? w.localDate : toLocalDateStr(new Date(w.localDate))
  return weekStartKey(d)
}

// Calcula stats de retos a partir del historial.
export const computeChallengeStats = (workouts: Workout[], prsThisWeek: number): ChallengeStats => {
  const now = toLocalDateStr()
  const thisWeekKey = weekStartKey(now)

  const thisWeekWorkouts = workouts.filter((w) => workoutWeekKey(w) === thisWeekKey)

  const sessionsThisWeek = thisWeekWorkouts.length
  const volumeThisWeek = thisWeekWorkouts.reduce((sum, w) => sum + w.totalVolume, 0)

  // Semanas consecutivas con al menos 1 sesión.
  let consecutiveWeeks = 0
  const allDates = new Set(workouts.map((w) => w.localDate))
  const msPerDay = 86_400_000
  const todayMs = new Date(now).getTime()
  let cursorMs = todayMs
  while (true) {
    const wKey = weekStartKey(toLocalDateStr(new Date(cursorMs)))
    const hasSession = [...allDates].some((d) => weekStartKey(d) === wKey)
    if (!hasSession) break
    consecutiveWeeks++
    cursorMs -= 7 * msPerDay
  }

  return { sessionsThisWeek, volumeThisWeek, prsThisWeek, consecutiveWeeks }
}

// Seed de retos predefinidos.
export const CHALLENGES: Challenge[] = [
  // Frecuencia
  { id: 'freq-3', titleKey: 'challenge.freq3.title', descriptionKey: 'challenge.freq3.desc', type: 'frecuencia', duration: '1semana', target: 3, unit: 'sesiones', minLevel: 'principiante' },
  { id: 'freq-5', titleKey: 'challenge.freq5.title', descriptionKey: 'challenge.freq5.desc', type: 'frecuencia', duration: '1semana', target: 5, unit: 'sesiones', minLevel: 'intermedio' },
  { id: 'freq-6', titleKey: 'challenge.freq6.title', descriptionKey: 'challenge.freq6.desc', type: 'frecuencia', duration: '1semana', target: 6, unit: 'sesiones', minLevel: 'avanzado' },

  // Volumen (kg totales)
  { id: 'vol-20', titleKey: 'challenge.vol20.title', descriptionKey: 'challenge.vol20.desc', type: 'volumen', duration: '1semana', target: 5000, unit: 'kg', minLevel: 'principiante' },
  { id: 'vol-40', titleKey: 'challenge.vol40.title', descriptionKey: 'challenge.vol40.desc', type: 'volumen', duration: '2semanas', target: 15000, unit: 'kg', minLevel: 'intermedio' },
  { id: 'vol-80', titleKey: 'challenge.vol80.title', descriptionKey: 'challenge.vol80.desc', type: 'volumen', duration: '1mes', target: 40000, unit: 'kg', minLevel: 'avanzado' },

  // PRs
  { id: 'pr-1', titleKey: 'challenge.pr1.title', descriptionKey: 'challenge.pr1.desc', type: 'pr', duration: '1semana', target: 1, unit: 'PR', minLevel: 'principiante' },
  { id: 'pr-3', titleKey: 'challenge.pr3.title', descriptionKey: 'challenge.pr3.desc', type: 'pr', duration: '2semanas', target: 3, unit: 'PRs', minLevel: 'intermedio' },

  // Consistencia
  { id: 'cons-4', titleKey: 'challenge.cons4.title', descriptionKey: 'challenge.cons4.desc', type: 'consistencia', duration: '1semana', target: 4, unit: 'semanas seguidas', minLevel: 'principiante' },
  { id: 'cons-8', titleKey: 'challenge.cons8.title', descriptionKey: 'challenge.cons8.desc', type: 'consistencia', duration: '1mes', target: 8, unit: 'semanas seguidas', minLevel: 'intermedio' },
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
