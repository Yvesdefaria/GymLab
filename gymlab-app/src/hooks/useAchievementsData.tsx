// Capa única de datos de logros (F103/T6): ejecuta UNA sola vez el fan-out de
// liveQueries —incluido el scan en streaming de series completadas (F91)— y
// deriva stats/progreso compartidos. La monta AppShell para que el host global
// y /logros (y perfil/pasos) lean la misma fuente sin repetir el scan.
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/data/repositories/dexie/db'
import {
  bodyWeightRepo,
  exerciseRepo,
  guideRepo,
  mealRepo,
  metaRepo,
  prRepo,
  progressPhotoRepo,
  stepRepo,
  workoutRepo,
} from '@/data/repositories'
import {
  deriveAchievementStats,
  progressForAll,
  type AchievementProgress,
  type AchievementStats,
} from '@/domain/achievementProgress'
import { type Collectible } from '@/domain/achievements'
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
} from '@/domain/types'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'
import { useLiveListState } from './useLiveList'

export const UNLOCKED_ACHIEVEMENTS_KEY = 'unlockedAchievements'
export const ACHIEVEMENT_COUNTS_KEY = 'achievementCounts'
export const ACHIEVEMENT_SNAPSHOT_KEY = 'achievementSnapshot'
export const COLLECTIBLES_KEY = 'collectibles'

const EMPTY_LIST: never[] = []
const EMPTY_COUNTS: Record<string, number> = {}

export interface AchievementsData {
  // true cuando todas las consultas base resolvieron; el host no evalúa antes.
  ready: boolean
  workouts: Workout[]
  prs: PRRecord[]
  completedSets: WorkoutSet[]
  savedIds: string[]
  counts: Record<string, number>
  snapshot: string[]
  collectibles: Collectible[]
  stepDays: DailyStepsEntry[]
  meals: MealEntry[]
  bodyWeights: BodyWeightEntry[]
  photos: ProgressPhotoEntry[]
  exerciseCategories: ReadonlyMap<number, ExerciseCategory>
  exerciseMuscles: ReadonlyMap<number, MuscleGroup>
  guideCount: number
  streak: StreakResult
  stats: AchievementStats
  progress: Record<string, AchievementProgress>
}

const AchievementsDataContext = createContext<AchievementsData | null>(null)

export const AchievementsDataProvider = ({ children }: { children: ReactNode }) => {
  const [workouts, workoutsReady] = useLiveListState(() => workoutRepo.getAll())
  const [prs, prsReady] = useLiveListState(() => prRepo.getAll())
  // Optimización F91: completed no está indexado en Dexie, pero toCollection()
  // .filter() streamea las filas sin materializar la tabla completa antes de filtrar.
  const [completedSets, setsReady] = useLiveListState(() =>
    db.workoutSets.toCollection().filter((s) => s.completed).toArray()
  )
  const savedIdsRaw = useLiveQuery(
    () => metaRepo.getJson<string[]>(UNLOCKED_ACHIEVEMENTS_KEY, []),
    []
  )
  const countsRaw = useLiveQuery(
    () => metaRepo.getJson<Record<string, number>>(ACHIEVEMENT_COUNTS_KEY, {}),
    []
  )
  const snapshotRaw = useLiveQuery(
    () => metaRepo.getJson<string[]>(ACHIEVEMENT_SNAPSHOT_KEY, []),
    []
  )
  const collectiblesRaw = useLiveQuery(
    () => metaRepo.getJson<Collectible[]>(COLLECTIBLES_KEY, []),
    []
  )
  const [stepDays, stepDaysReady] = useLiveListState(() => stepRepo.getAll())
  const [meals, mealsReady] = useLiveListState(() => mealRepo.getAll())
  const [bodyWeights, weightsReady] = useLiveListState(() => bodyWeightRepo.getAll())
  const [photos, photosReady] = useLiveListState(() => progressPhotoRepo.getAll())

  const savedIds = savedIdsRaw ?? (EMPTY_LIST as string[])
  const counts = countsRaw ?? EMPTY_COUNTS
  const snapshot = snapshotRaw ?? (EMPTY_LIST as string[])
  const collectibles = collectiblesRaw ?? (EMPTY_LIST as Collectible[])

  // Catálogo de los ejercicios usados en series completadas (categorías para
  // cardio) y guías disponibles (target dinámico de guias-completas).
  const uniqueExerciseIds = useMemo(
    () => [...new Set(completedSets.map((s) => s.exerciseId))],
    [completedSets]
  )
  const [exercises] = useLiveListState(() => exerciseRepo.getByIds(uniqueExerciseIds), [
    uniqueExerciseIds,
  ])
  const [guides] = useLiveListState(() => guideRepo.getAll())

  const exerciseCategories = useMemo(() => {
    const map = new Map<number, ExerciseCategory>()
    for (const exercise of exercises) {
      if (exercise.category) map.set(exercise.id, exercise.category)
    }
    return map
  }, [exercises])
  const exerciseMuscles = useMemo(() => {
    const map = new Map<number, MuscleGroup>()
    for (const exercise of exercises) {
      map.set(exercise.id, exercise.muscleGroup)
    }
    return map
  }, [exercises])
  const guideCount = guides.length

  // Racha histórica más larga, necesaria para los logros de racha.
  const streak = useMemo(() => calcStreak(workouts.map(localDateOf)), [workouts])

  // Mismo gate que el host original: sin workouts/PRs/series/meta cargados no se
  // considera listo (evita evaluar y reconciliar con datos a medias).
  const ready =
    workoutsReady && prsReady && setsReady && savedIdsRaw !== undefined &&
    countsRaw !== undefined && snapshotRaw !== undefined && collectiblesRaw !== undefined &&
    stepDaysReady && mealsReady && weightsReady && photosReady

  // Bag y progreso derivados una sola vez para todos los consumidores; el reloj
  // solo aporta «días desde la primera sesión» (primer-ano).
  const stats = useMemo<AchievementStats>(
    () =>
      deriveAchievementStats({
        workouts,
        prs,
        completedSets,
        exerciseCategories,
        guideCount,
        streak,
        now: new Date(),
        stepDays,
        exerciseMuscles,
        meals,
        bodyWeights,
        photos,
      }),
    [workouts, prs, completedSets, exerciseCategories, exerciseMuscles, guideCount, streak, stepDays, meals, bodyWeights, photos]
  )
  const progress = useMemo(() => progressForAll(stats), [stats])

  const value = useMemo<AchievementsData>(
    () => ({
      ready,
      workouts,
      prs,
      completedSets,
      savedIds,
      counts,
      snapshot,
      collectibles,
      stepDays,
      meals,
      bodyWeights,
      photos,
      exerciseCategories,
      exerciseMuscles,
      guideCount,
      streak,
      stats,
      progress,
    }),
    [ready, workouts, prs, completedSets, savedIds, counts, snapshot, collectibles, stepDays, meals, bodyWeights, photos, exerciseCategories, exerciseMuscles, guideCount, streak, stats, progress]
  )

  return (
    <AchievementsDataContext.Provider value={value}>{children}</AchievementsDataContext.Provider>
  )
}

export const useAchievementsData = (): AchievementsData => {
  const value = useContext(AchievementsDataContext)
  if (!value) throw new Error('useAchievementsData requiere <AchievementsDataProvider>')
  return value
}
