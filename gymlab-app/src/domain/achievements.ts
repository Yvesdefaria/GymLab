// Logros del sistema: definición y evaluación de condiciones (dominio puro).
// Los IDs son constantes del código (no input de usuario) y se persisten
// en meta.unlockedAchievements; cada logro solo se muestra una vez.
import type { PRRecord, StreakResult, Workout, WorkoutSet } from './types'
import { localDateOf, parseLocalDate, weekStartKey } from './dates'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  condition: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'primer-paso',
    title: 'Primer paso',
    description: 'Completaste tu primera serie de entrenamiento.',
    icon: 'Footprints',
    condition: 'Completar al menos una serie',
  },
  {
    id: 'inaugural',
    title: 'Inaugural',
    description: 'Terminaste tu primera sesión de entrenamiento.',
    icon: 'Trophy',
    condition: 'Completar una sesión',
  },
  {
    id: 'racha-7',
    title: 'Racha de 7 días',
    description: 'Entrenaste 7 días seguidos.',
    icon: 'Flame',
    condition: 'Racha de 7 días',
  },
  {
    id: 'racha-30',
    title: 'Racha de 30 días',
    description: 'Entrenaste 30 días seguidos.',
    icon: 'Crown',
    condition: 'Racha de 30 días',
  },
  {
    id: 'primera-marca',
    title: 'Primera marca',
    description: 'Registraste tu primer récord personal.',
    icon: 'Target',
    condition: 'Registrar un PR',
  },
  {
    id: 'volumen-semanal',
    title: 'Volumen semanal superado',
    description: 'Pasaste de 10 000 kg de volumen en una misma semana.',
    icon: 'BarChart3',
    condition: 'Superar 10 000 kg de volumen en una semana',
  },
  {
    id: 'sesiones-50',
    title: 'Imparable',
    description: 'Completaste 50 sesiones de entrenamiento.',
    icon: 'CalendarCheck',
    condition: 'Completar 50 sesiones',
  },
  {
    id: 'consistencia-4s',
    title: 'Constancia',
    description: 'Entrenaste durante 4 semanas seguidas.',
    icon: 'Repeat',
    condition: 'Entrenar 4 semanas consecutivas',
  },
]

const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

export const getAchievement = (id: string): Achievement | undefined => byId.get(id)

// ¿Al menos 4 semanas consecutivas con entrenamiento (una semana = 7 días)?
const hasFourConsistentWeeks = (workoutDates: string[]): boolean => {
  const weeks = [...new Set(workoutDates.map(weekStartKey))].sort()
  let run = 1
  for (let i = 1; i < weeks.length; i++) {
    const gap = Math.round(
      (parseLocalDate(weeks[i]).getTime() - parseLocalDate(weeks[i - 1]).getTime()) / 86_400_000
    )
    run = gap === 7 ? run + 1 : 1
    if (run >= 4) return true
  }
  return run >= 4
}

export const WEEKLY_VOLUME_THRESHOLD = 10_000

// Devuelve los logros cuyo objetivo ya se cumple con los datos actuales.
export const checkAchievements = (
  workouts: Workout[],
  streak: StreakResult,
  prs: PRRecord[],
  sets: WorkoutSet[] = []
): Achievement[] => {
  const earned: string[] = []
  const done = (id: string): boolean => earned.includes(id)
  const earn = (id: string): void => {
    if (!done(id)) earned.push(id)
  }

  if (sets.some((s) => s.completed)) earn('primer-paso')
  if (workouts.length >= 1) earn('inaugural')
  if (streak.longestStreak >= 7) earn('racha-7')
  if (streak.longestStreak >= 30) earn('racha-30')
  if (prs.length >= 1) earn('primera-marca')

  // Volumen por semana a partir de la fecha local y el total precalculado.
  const weeklyVolume = new Map<string, number>()
  for (const w of workouts) {
    const date = localDateOf(w)
    const key = weekStartKey(date)
    weeklyVolume.set(key, (weeklyVolume.get(key) ?? 0) + (w.totalVolume || 0))
  }
  if ([...weeklyVolume.values()].some((vol) => vol >= WEEKLY_VOLUME_THRESHOLD)) {
    earn('volumen-semanal')
  }

  if (workouts.length >= 50) earn('sesiones-50')

  const workoutDates = workouts.map(localDateOf)
  if (hasFourConsistentWeeks(workoutDates)) earn('consistencia-4s')

  return earned.map((id) => getAchievement(id)!).filter(Boolean)
}
