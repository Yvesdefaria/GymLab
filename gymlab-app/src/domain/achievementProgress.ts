// Progreso declarativo de logros (dominio puro): el mapa ACHIEVEMENT_PROGRESS es
// la fuente única de current/target/completed para las barras de /logros y para
// la evaluación de checkAchievements. Sin I/O, sin React y con `now` inyectado
// para que las medidas basadas en tiempo sean deterministas y testeables.
import type {
  BodyWeightEntry,
  DailyStepsEntry,
  ExerciseCategory,
  MealEntry,
  MuscleGroup,
  PRRecord,
  ProgressPhotoEntry,
  StreakResult,
  Workout,
  WorkoutSet,
} from './types'
import { diffLocalDays, localDateOf, weekStartKey } from './dates'
import { isCardioCategory } from './exerciseCategory'
import { countEverCompletedChallenges } from './challenges'
import { deriveMealStats } from './nutrition'
import { deriveStepStats } from './stepAchievements'
import { workoutDurationMin } from './workouts'

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
  // Medidas de pasos (F109.1): deriva el histórico diario vía deriveStepStats.
  | 'stepsTotal'
  | 'stepsMaxDay'
  | 'steps10kRun'
  | 'steps7dWindow'
  | 'stepsMonth'
  // Medidas de familias nuevas (F109.2): nutrición, cuerpo, entreno y cardio.
  | 'mealsRegisteredCount'
  | 'consecutiveMealDays'
  | 'maxDailyProteinG'
  | 'mealDaysDistinct'
  | 'bodyWeightCount'
  | 'progressPhotoCount'
  | 'longestDailyWorkoutRun'
  | 'longestSessionMin'
  | 'cardioTotalSeconds'
  | 'stepsDistanceKm'

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
  // Logros de pasos (F109.1): mismos umbrales que el sistema viejo de F84a,
  // ahora como medidas declarativas dentro del mapa unificado.
  'primeros-pasos': { measure: 'stepsTotal', target: 1 },
  'diez-mil-dia': { measure: 'stepsMaxDay', target: 10_000 },
  'racha-7-dias': { measure: 'steps10kRun', target: 7 },
  'racha-30-dias': { measure: 'steps10kRun', target: 30 },
  'cincuenta-mil-semana': { measure: 'steps7dWindow', target: 50_000 },
  'doscientos-mil-mes': { measure: 'stepsMonth', target: 200_000 },
  'millon-total': { measure: 'stepsTotal', target: 1_000_000 },
  maraton: { measure: 'stepsMaxDay', target: 42_000 },
  // Medallas de familias nuevas (F109.2), en orden de familia: nutrición,
  // cuerpo, entreno, cardio y pasos.
  'nutricion-primera': { measure: 'mealsRegisteredCount', target: 1 },
  'nutricion-semana': { measure: 'consecutiveMealDays', target: 7 },
  'nutricion-proteina': { measure: 'maxDailyProteinG', target: 150 },
  'nutricion-30-dias': { measure: 'mealDaysDistinct', target: 30 },
  'cuerpo-primer-peso': { measure: 'bodyWeightCount', target: 1 },
  'cuerpo-30-pesos': { measure: 'bodyWeightCount', target: 30 },
  'cuerpo-10-fotos': { measure: 'progressPhotoCount', target: 10 },
  'entreno-5-dias': { measure: 'longestDailyWorkoutRun', target: 5 },
  'entreno-90min': { measure: 'longestSessionMin', target: 90 },
  'entreno-12-semanas': { measure: 'longestConsistentWeekRun', target: 12 },
  'cardio-60min': { measure: 'cardioTotalSeconds', target: 3600 },
  'pasos-50km': { measure: 'stepsDistanceKm', target: 50 },
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
  stepsTotal: number
  stepsMaxDay: number
  steps10kRun: number
  steps7dWindow: number
  stepsMonth: number
  mealsRegisteredCount: number
  consecutiveMealDays: number
  maxDailyProteinG: number
  mealDaysDistinct: number
  bodyWeightCount: number
  progressPhotoCount: number
  longestDailyWorkoutRun: number
  longestSessionMin: number
  cardioTotalSeconds: number
  stepsDistanceKm: number
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

// Días consecutivos con al menos una sesión (misma regla gap === 1), devolviendo
// la racha MÁS larga para que la barra de entreno-5-dias nunca retroceda.
const longestDailyWorkoutRun = (workoutDates: string[]): number => {
  const days = [...new Set(workoutDates)].sort()
  if (days.length === 0) return 0
  let run = 1
  let best = 1
  for (let i = 1; i < days.length; i++) {
    run = diffLocalDays(days[i - 1]!, days[i]!) === 1 ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

// Una serie cuenta como cardio con la misma regla que cardioSetCount: con
// categoría conocida manda el catálogo (una serie de fuerza contaminada con
// duración no es cardio); la duración solo decide cuando falta la categoría.
const isCardioSet = (
  set: WorkoutSet,
  exerciseCategories: ReadonlyMap<number, ExerciseCategory>
): boolean => {
  const category = exerciseCategories.get(set.exerciseId)
  return isCardioCategory(category) || (category === undefined && (set.durationSeconds ?? 0) > 0)
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
  // Histórico diario de pasos (F109.1); sin él las medidas de pasos quedan en 0.
  stepDays?: DailyStepsEntry[]
  // Mapa ejercicio→grupo muscular (F109.2) para el volumen por grupo de los retos.
  exerciseMuscles?: ReadonlyMap<number, MuscleGroup>
  // Familias nuevas (F109.2): comidas, peso corporal y fotos de progreso.
  meals?: MealEntry[]
  bodyWeights?: BodyWeightEntry[]
  photos?: ProgressPhotoEntry[]
}): AchievementStats => {
  const { workouts, prs, completedSets, exerciseCategories, guideCount, streak, now } = input

  const stepStats = input.stepDays && input.stepDays.length > 0 ? deriveStepStats(input.stepDays) : null
  const mealStats = deriveMealStats(input.meals ?? [])

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

  // F109.1: delta de PR desde el historial real de series. Por ejercicio:
  // primera serie registrada (base) vs. mejor peso posterior; warmups y peso 0
  // (lastre/peso corporal) quedan fuera. La tabla `prs` pisa una fila por
  // ejercicio, por eso no sirve como historial.
  let maxPrDeltaKg = 0
  const workingSets = completedSets.filter((s) => !s.isWarmup && (s.weightKg ?? 0) > 0)
  if (workingSets.length >= 2) {
    const setsByExercise = new Map<number, WorkoutSet[]>()
    for (const s of workingSets) {
      const list = setsByExercise.get(s.exerciseId) ?? []
      list.push(s)
      setsByExercise.set(s.exerciseId, list)
    }
    for (const sets of setsByExercise.values()) {
      if (sets.length < 2) continue
      // Compara por instante real (tolera offsets horarios distintos entre
      // createdAt); el setNumber desempata series del mismo instante.
      const sorted = [...sets].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
          a.setNumber - b.setNumber
      )
      const first = sorted[0]!.weightKg ?? 0
      const peak = sorted.reduce((max, s) => Math.max(max, s.weightKg ?? 0), 0)
      const delta = peak - first
      if (delta > maxPrDeltaKg) maxPrDeltaKg = delta
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

  // Sesión finalizada más larga (minutos); las sesiones en curso no cuentan.
  let longestSessionMin = 0
  for (const w of workouts) {
    const min = workoutDurationMin(w)
    if (min !== null && min > longestSessionMin) longestSessionMin = min
  }

  return {
    workoutCount: workouts.length,
    completedSetCount: completedSets.length,
    prCount: prs.length,
    longestStreak: streak.longestStreak,
    maxWeeklyVolume,
    longestConsistentWeekRun: longestConsistentWeekRun(workouts.map(localDateOf)),
    cardioSetCount: completedSets.filter((s) => isCardioSet(s, exerciseCategories)).length,
    cardioTotalSeconds: completedSets.reduce(
      (sum, s) => (isCardioSet(s, exerciseCategories) ? sum + (s.durationSeconds ?? 0) : sum),
      0
    ),
    uniqueExerciseCount: new Set(completedSets.map((s) => s.exerciseId)).size,
    maxPrDeltaKg,
    daysSinceFirstWorkout,
    guideCount,
    completedGuidesCount: 0, // sin señal de guía completada todavía
    completedChallengeCount: countEverCompletedChallenges(
      workouts,
      prs.map((pr) => pr.date),
      completedSets,
      {
        stepDays: input.stepDays,
        exerciseMuscles: input.exerciseMuscles,
        exerciseCategories,
      },
    ),
    stepsTotal: stepStats?.stepsTotal ?? 0,
    stepsMaxDay: stepStats?.stepsMaxDay ?? 0,
    steps10kRun: stepStats?.steps10kRun ?? 0,
    steps7dWindow: stepStats?.steps7dWindow ?? 0,
    stepsMonth: stepStats?.stepsMonth ?? 0,
    mealsRegisteredCount: mealStats.mealsRegisteredCount,
    consecutiveMealDays: mealStats.consecutiveMealDays,
    maxDailyProteinG: mealStats.maxDailyProteinG,
    mealDaysDistinct: mealStats.mealDaysDistinct,
    bodyWeightCount: input.bodyWeights?.length ?? 0,
    progressPhotoCount: input.photos?.length ?? 0,
    longestDailyWorkoutRun: longestDailyWorkoutRun(workouts.map(localDateOf)),
    longestSessionMin,
    stepsDistanceKm: stepStats?.distanceKm ?? 0,
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
  stepsTotal: (s) => s.stepsTotal,
  stepsMaxDay: (s) => s.stepsMaxDay,
  steps10kRun: (s) => s.steps10kRun,
  steps7dWindow: (s) => s.steps7dWindow,
  stepsMonth: (s) => s.stepsMonth,
  mealsRegisteredCount: (s) => s.mealsRegisteredCount,
  consecutiveMealDays: (s) => s.consecutiveMealDays,
  maxDailyProteinG: (s) => s.maxDailyProteinG,
  mealDaysDistinct: (s) => s.mealDaysDistinct,
  bodyWeightCount: (s) => s.bodyWeightCount,
  progressPhotoCount: (s) => s.progressPhotoCount,
  longestDailyWorkoutRun: (s) => s.longestDailyWorkoutRun,
  longestSessionMin: (s) => s.longestSessionMin,
  cardioTotalSeconds: (s) => s.cardioTotalSeconds,
  stepsDistanceKm: (s) => s.stepsDistanceKm,
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