// Logros del sistema: definición y evaluación de condiciones (dominio puro).
// Los IDs son constantes del código (no input de usuario) y se persisten
// en meta.unlockedAchievements; cada logro solo se muestra una vez.
import type { PRRecord, StreakResult, Workout, WorkoutSet } from './types'
import { localDateOf, parseLocalDate, weekStartKey } from './dates'

// Rareza de cada logro → metal de la chapa (bronce < plata < oro < platino),
// estilo medalla ingame de BO2. Orden visual creciente por dificultad.
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Achievement {
  id: string
  titleKey: string
  descriptionKey: string
  icon: string
  conditionKey: string
}

// Mapa id → metal de la chapa medalla. Escala por dificultad del objetivo:
// hitos fáciles en bronce, acumulación media en plata, logros largos en oro
// y los más extremos (500 sesiones, 1 año) en platino.
export const ACHIEVEMENT_TIERS: Record<string, AchievementTier> = {
  'primer-paso': 'bronze',
  inaugural: 'bronze',
  'racha-4': 'bronze',
  'primera-marca': 'bronze',
  'primera-cardio': 'bronze',
  'volumen-semanal': 'silver',
  'sesiones-50': 'silver',
  'consistencia-4s': 'silver',
  'pr-10kg': 'silver',
  'ejercicios-100': 'gold',
  'racha-8': 'gold',
  'racha-16': 'gold',
  'guias-completas': 'gold',
  'sesiones-500': 'platinum',
  'primer-ano': 'platinum',
}

export interface AchievementCountsState {
  counts: Record<string, number>
  snapshot: string[]
}

// Contador «veces conseguido» de las chapas: incrementa +1 cada logro que
// pasa de no estando en el snapshot previo a estarlo en la evaluación actual
// (transición no-cumplido → cumplido). El snapshot se actualiza a earnedIds
// para no inflar el contador en evaluaciones repetidas del mismo estado.
export const nextAchievementCounts = (
  prev: AchievementCountsState,
  earnedIds: string[]
): AchievementCountsState => {
  const counts = { ...prev.counts }
  for (const id of earnedIds) {
    if (!prev.snapshot.includes(id)) {
      counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return { counts, snapshot: [...earnedIds] }
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'primer-paso',
    titleKey: 'achievements.items.primerPaso.title',
    descriptionKey: 'achievements.items.primerPaso.desc',
    icon: 'Footprints',
    conditionKey: 'achievements.items.primerPaso.condition',
  },
  {
    id: 'inaugural',
    titleKey: 'achievements.items.inaugural.title',
    descriptionKey: 'achievements.items.inaugural.desc',
    icon: 'Trophy',
    conditionKey: 'achievements.items.inaugural.condition',
  },
  {
    id: 'racha-4',
    titleKey: 'achievements.items.racha4.title',
    descriptionKey: 'achievements.items.racha4.desc',
    icon: 'Flame',
    conditionKey: 'achievements.items.racha4.condition',
  },
  {
    id: 'racha-8',
    titleKey: 'achievements.items.racha8.title',
    descriptionKey: 'achievements.items.racha8.desc',
    icon: 'Crown',
    conditionKey: 'achievements.items.racha8.condition',
  },
  {
    id: 'primera-marca',
    titleKey: 'achievements.items.primeraMarca.title',
    descriptionKey: 'achievements.items.primeraMarca.desc',
    icon: 'Target',
    conditionKey: 'achievements.items.primeraMarca.condition',
  },
  {
    id: 'volumen-semanal',
    titleKey: 'achievements.items.volumenSemanal.title',
    descriptionKey: 'achievements.items.volumenSemanal.desc',
    icon: 'BarChart3',
    conditionKey: 'achievements.items.volumenSemanal.condition',
  },
  {
    id: 'sesiones-50',
    titleKey: 'achievements.items.sesiones50.title',
    descriptionKey: 'achievements.items.sesiones50.desc',
    icon: 'CalendarCheck',
    conditionKey: 'achievements.items.sesiones50.condition',
  },
  {
    id: 'consistencia-4s',
    titleKey: 'achievements.items.constancia4s.title',
    descriptionKey: 'achievements.items.constancia4s.desc',
    icon: 'Repeat',
    conditionKey: 'achievements.items.constancia4s.condition',
  },
  {
    id: 'primera-cardio',
    titleKey: 'achievements.items.primeraCardio.title',
    descriptionKey: 'achievements.items.primeraCardio.desc',
    icon: 'Heart',
    conditionKey: 'achievements.items.primeraCardio.condition',
  },
  {
    id: 'ejercicios-100',
    titleKey: 'achievements.items.ejercicios100.title',
    descriptionKey: 'achievements.items.ejercicios100.desc',
    icon: 'Shuffle',
    conditionKey: 'achievements.items.ejercicios100.condition',
  },
  {
    id: 'racha-16',
    titleKey: 'achievements.items.racha16.title',
    descriptionKey: 'achievements.items.racha16.desc',
    icon: 'Crown',
    conditionKey: 'achievements.items.racha16.condition',
  },
  {
    id: 'pr-10kg',
    titleKey: 'achievements.items.pr10kg.title',
    descriptionKey: 'achievements.items.pr10kg.desc',
    icon: 'TrendingUp',
    conditionKey: 'achievements.items.pr10kg.condition',
  },
  {
    id: 'guias-completas',
    titleKey: 'achievements.items.guiasCompletas.title',
    descriptionKey: 'achievements.items.guiasCompletas.desc',
    icon: 'BookOpen',
    conditionKey: 'achievements.items.guiasCompletas.condition',
  },
  {
    id: 'sesiones-500',
    titleKey: 'achievements.items.sesiones500.title',
    descriptionKey: 'achievements.items.sesiones500.desc',
    icon: 'Medal',
    conditionKey: 'achievements.items.sesiones500.condition',
  },
  {
    id: 'primer-ano',
    titleKey: 'achievements.items.primerAno.title',
    descriptionKey: 'achievements.items.primerAno.desc',
    icon: 'Calendar',
    conditionKey: 'achievements.items.primerAno.condition',
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
  // Racha por semanas cumplidas (F93 #6): hitos de 4, 8 y 16 semanas consecutivas.
  if (streak.longestStreak >= 4) earn('racha-4')
  if (streak.longestStreak >= 8) earn('racha-8')
  if (streak.longestStreak >= 16) earn('racha-16')
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

  // Nuevos logros extendidos.
  // Primera sesión de cardio: buscar categorías "cardio" en las series.
  if (sets.some((s) => s.completed)) earn('primera-cardio')

  // 100 ejercicios diferentes.
  const uniqueExercises = new Set(sets.map((s) => s.exerciseId))
  if (uniqueExercises.size >= 100) earn('ejercicios-100')

  // Racha 16 semanas (≈4 meses).
  if (streak.longestStreak >= 16) earn('racha-16')

  // PR +10kg: comparar primer y último PR por ejercicio.
  if (prs.length >= 2) {
    const byExercise = new Map<number, PRRecord[]>()
    for (const pr of prs) {
      const list = byExercise.get(pr.exerciseId) ?? []
      list.push(pr)
      byExercise.set(pr.exerciseId, list)
    }
    for (const exercisePrs of byExercise.values()) {
      if (exercisePrs.length >= 2) {
        const sorted = exercisePrs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        const delta = (sorted[sorted.length - 1]?.weightKg ?? 0) - (sorted[0]?.weightKg ?? 0)
        if (delta >= 10) { earn('pr-10kg'); break }
      }
    }
  }

  // 500 sesiones.
  if (workouts.length >= 500) earn('sesiones-500')

  // 1 año de uso.
  if (workouts.length > 0) {
    const first = workouts.reduce((min, w) => w.startedAt < min ? w.startedAt : min, workouts[0]!.startedAt)
    const daysSinceFirst = (Date.now() - new Date(first).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceFirst >= 365) earn('primer-ano')
  }

  return earned.map((id) => getAchievement(id)!).filter(Boolean)
}
