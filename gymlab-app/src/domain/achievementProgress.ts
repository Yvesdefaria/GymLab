// Progreso declarativo de logros (dominio puro): el mapa ACHIEVEMENT_PROGRESS es
// la fuente única de current/target/completed para las barras de /logros y para
// la evaluación de checkAchievements. Sin I/O, sin React y con `now` inyectado
// para que las medidas basadas en tiempo sean deterministas y testeables.
import type { ExerciseCategory, PRRecord, StreakResult, Workout, WorkoutSet } from './types'
import { diffLocalDays, localDateOf, weekStartKey } from './dates'
import { isCardioCategory } from './exerciseCategory'
import { countEverCompletedChallenges } from './challenges'

// Medida que cada logro consulta en el bag de stats para su barra de progreso.
export type MeasureKey =
  | 'workoutCount'
  | 'completedSetCount'
  | 'prCount'
  | 'longestStreak'
  | 'maxWeeklyVolume'
  | 'longestConsistentWeekRun'
  | 'cardioSetCount'
  | 'uniqueExerciseCount'
  | 'maxPrDeltaKg'
  | 'daysSinceFirstWorkout'
  | 'completedGuidesCount'
  | 'completedChallengeCount'

export interface AchievementTarget {
  measure: MeasureKey
  target: number
  // Target dinámico: guias-completas mide contra las guías disponibles, no un
  // número fijo; el repo (guía completada) no existe aún, así que current = 0.
  targetFrom?: 'guideCount'
}

// Ids del catálogo (ACHIEVEMENTS). Un target por logro, sin literales sueltos.
export const ACHIEVEMENT_PROGRESS: Readonly<Record<string, AchievementTarget>> = {
  'primer-paso': { measure: 'completedSetCount', target: 1 },
  inaugural: { measure: 'workoutCount', target: 1 },
  'racha-4': { measure: 'longestStreak', target: 4 },
  'racha-8': { measure: 'longestStreak', target: 8 },
  'racha-16': { measure: 'longestStreak', target: 16 },
  'primera-marca': { measure: 'prCount', target: 1 },
  'volumen-semanal': { measure: 'maxWeeklyVolume', target: 10_000 },
  'sesiones-50': { measure: 'workoutCount', target: 50 },
  'consistencia-4s': { measure: 'longestConsistentWeekRun', target: 4 },
  'primera-cardio': { measure: 'cardioSetCount', target: 1 },
  'ejercicios-100': { measure: 'uniqueExerciseCount', target: 100 },
  'pr-10kg': { measure: 'maxPrDeltaKg', target: 10 },
  'guias-completas': { measure: 'completedGuidesCount', target: 0, targetFrom: 'guideCount' },
  'sesiones-500': { measure: 'workoutCount', target: 500 },
  'primer-ano': { measure: 'daysSinceFirstWorkout', target: 365 },
  'primer-reto': { measure: 'completedChallengeCount', target: 1 },
}

export interface AchievementStats {
  workoutCount: number
  completedSetCount: number
  prCount: number
  longestStreak: number
  maxWeeklyVolume: number
  longestConsistentWeekRun: number
  cardioSetCount: number
  uniqueExerciseCount: number
  maxPrDeltaKg: number
  daysSinceFirstWorkout: number
  guideCount: number
  completedGuidesCount: number
  completedChallengeCount: number
}

// Semanas consecutivas con al menos una sesión (misma regla gap === 7 de la
// antigua hasFourConsistentWeeks), devolviendo la racha MÁS larga para que la
// barra de consistencia-4s nunca retroceda.
const longestConsistentWeekRun = (workoutDates: string[]): number => {
  const weeks = [...new Set(workoutDates.map(weekStartKey))].sort()
  if (weeks.length === 0) return 0
  let run = 1
  let best = 1
  for (let i = 1; i < weeks.length; i++) {
    run = diffLocalDays(weeks[i - 1]!, weeks[i]!) === 7 ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

// Derivación pura del bag de stats que alimenta el mapa de progreso. El hook
// inyecta categorías resueltas (fallback 'strength'), guías, racha y el momento
// de evaluación; aquí no hay repositorios ni reloj.
export const deriveAchievementStats = (input: {
  workouts: Workout[]
  prs: PRRecord[]
  completedSets: WorkoutSet[]
  exerciseCategories: ReadonlyMap<number, ExerciseCategory>
  guideCount: number
  streak: StreakResult
  now: Date
}): AchievementStats => {
  const { workouts, prs, completedSets, exerciseCategories, guideCount, streak, now } = input

  // Volumen máximo en una semana calendario (misma semántica que la antigua
  // checkAchievements: agrupar por weekStartKey y sumar totalVolume).
  let maxWeeklyVolume = 0
  const weeklyVolume = new Map<string, number>()
  for (const w of workouts) {
    const key = weekStartKey(localDateOf(w))
    const next = (weeklyVolume.get(key) ?? 0) + (w.totalVolume || 0)
    weeklyVolume.set(key, next)
    if (next > maxWeeklyVolume) maxWeeklyVolume = next
  }

  // Máximo delta PR por ejercicio: último − primero (por fecha). Sin historial
  // previo (menos de 2 marcas), el delta es 0.
  let maxPrDeltaKg = 0
  if (prs.length >= 2) {
    const byExercise = new Map<number, PRRecord[]>()
    for (const pr of prs) {
      const list = byExercise.get(pr.exerciseId) ?? []
      list.push(pr)
      byExercise.set(pr.exerciseId, list)
    }
    for (const exercisePrs of byExercise.values()) {
      if (exercisePrs.length >= 2) {
        const sorted = [...exercisePrs].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        const delta = sorted[sorted.length - 1]!.weightKg - sorted[0]!.weightKg
        if (delta > maxPrDeltaKg) maxPrDeltaKg = delta
      }
    }
  }

  // Días transcurridos desde la primera sesión (piso), capados a 365: la barra
  // de primer-ano se llena al año y no puede superar su target (máximo ARIA).
  let daysSinceFirstWorkout = 0
  if (workouts.length > 0) {
    const first = workouts.reduce(
      (min, w) => (w.startedAt < min ? w.startedAt : min),
      workouts[0]!.startedAt
    )
    const elapsed = Math.floor((now.getTime() - new Date(first).getTime()) / 86_400_000)
    daysSinceFirstWorkout = Math.max(0, Math.min(365, elapsed))
  }

  return {
    workoutCount: workouts.length,
    completedSetCount: completedSets.length,
    prCount: prs.length,
    longestStreak: streak.longestStreak,
    maxWeeklyVolume,
    longestConsistentWeekRun: longestConsistentWeekRun(workouts.map(localDateOf)),
    cardioSetCount: completedSets.filter((s) => {
      const category = exerciseCategories.get(s.exerciseId)
      // Con categoría conocida manda el catálogo: una serie de fuerza contaminada con
      // duración no es cardio. La duración solo decide cuando falta la categoría.
      return isCardioCategory(category) || (category === undefined && (s.durationSeconds ?? 0) > 0)
    }).length,
    uniqueExerciseCount: new Set(completedSets.map((s) => s.exerciseId)).size,
    maxPrDeltaKg,
    daysSinceFirstWorkout,
    guideCount,
    completedGuidesCount: 0, // sin señal de guía completada todavía
    completedChallengeCount: countEverCompletedChallenges(
      workouts,
      prs.map((pr) => pr.date),
      completedSets,
    ),
  }
}

export interface AchievementProgress {
  id: string
  // Clamp a [0, target]: las medidas no-monótonas (racha, volumen, delta PR)
  // nunca retroceden la barra ni exceden el máximo válido de aria-valuemax.
  current: number
  // guideCount cuando targetFrom === 'guideCount' (guias-completas).
  target: number
  completed: boolean
}

const MEASURE_READER: Record<MeasureKey, (stats: AchievementStats) => number> = {
  workoutCount: (s) => s.workoutCount,
  completedSetCount: (s) => s.completedSetCount,
  prCount: (s) => s.prCount,
  longestStreak: (s) => s.longestStreak,
  maxWeeklyVolume: (s) => s.maxWeeklyVolume,
  longestConsistentWeekRun: (s) => s.longestConsistentWeekRun,
  cardioSetCount: (s) => s.cardioSetCount,
  uniqueExerciseCount: (s) => s.uniqueExerciseCount,
  maxPrDeltaKg: (s) => s.maxPrDeltaKg,
  daysSinceFirstWorkout: (s) => s.daysSinceFirstWorkout,
  completedGuidesCount: (s) => s.completedGuidesCount,
  completedChallengeCount: (s) => s.completedChallengeCount,
}

export const achievementProgress = (
  id: string,
  stats: AchievementStats
): AchievementProgress => {
  const def = ACHIEVEMENT_PROGRESS[id]
  if (!def) return { id, current: 0, target: 0, completed: false }
  const target = def.targetFrom === 'guideCount' ? stats.guideCount : def.target
  const raw = MEASURE_READER[def.measure](stats)
  const current = Math.max(0, Math.min(raw, target))
  // Un target 0 (guías-completas sin guías disponibles) no es un hito: la barra
  // existe en el mapa pero el logro nunca se concede sin una señal de completado.
  return { id, current, target, completed: target > 0 && current >= target }
}

export const progressForAll = (stats: AchievementStats): Record<string, AchievementProgress> => {
  const progress: Record<string, AchievementProgress> = {}
  for (const id of Object.keys(ACHIEVEMENT_PROGRESS)) {
    progress[id] = achievementProgress(id, stats)
  }
  return progress
}