// Hook de progreso de logros para /logros: consultas live independientes de
// useAchievements (workouts, PRs, series completadas, catálogo, guías y pasos)
// que derivan el stats bag y el progreso de las 24 barras, siempre en vivo.
// La UI pinta barras con la misma fuente de verdad que la evaluación
// (ACHIEVEMENT_PROGRESS), sin duplicar condiciones.
import { useMemo } from 'react'
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
import type { ExerciseCategory } from '@/domain/types'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'
import { useLiveList } from './useLiveList'
import { COLLECTIBLES_KEY } from './useAchievements'

export const useAchievementProgress = (): {
  progress: Record<string, AchievementProgress>
  /** Variantes de chapa concedidas (F95.1), en orden de concesión. */
  collectibles: Collectible[]
} => {
  const workouts = useLiveList(() => workoutRepo.getAll())
  const prs = useLiveList(() => prRepo.getAll())
  // completed no está indexado en Dexie; toCollection().filter() streamea las
  // filas sin materializar la tabla completa antes de filtrar.
  const completedSets = useLiveList(() =>
    db.workoutSets.toCollection().filter((s) => s.completed).toArray()
  )
  const guides = useLiveList(() => guideRepo.getAll())
  // Histórico de pasos (F109.1): medidas de los logros unificados de pasos.
  const stepDays = useLiveList(() => stepRepo.getAll())
  // Familias nuevas (F109.2): comidas, peso corporal y fotos de progreso.
  const meals = useLiveList(() => mealRepo.getAll())
  const bodyWeights = useLiveList(() => bodyWeightRepo.getAll())
  const photos = useLiveList(() => progressPhotoRepo.getAll())

  // Categorías del catálogo para los ejercicios usados en series completadas;
  // los ids sin catálogo caen a 'strength' (fallback del dominio).
  const exerciseIds = useMemo(
    () => [...new Set(completedSets.map((s) => s.exerciseId))],
    [completedSets]
  )
  const exercises = useLiveList(() => exerciseRepo.getByIds(exerciseIds), [exerciseIds])
  const exerciseCategories = useMemo(() => {
    const map = new Map<number, ExerciseCategory>()
    for (const exercise of exercises) {
      if (exercise.category) map.set(exercise.id, exercise.category)
    }
    return map
  }, [exercises])

  const streak = useMemo(() => calcStreak(workouts.map(localDateOf)), [workouts])

  // El bag se recalcula solo cuando cambia algún dato en Dexie; el reloj solo
  // aporta «días desde la primera sesión» (primer-ano).
  const stats = useMemo<AchievementStats>(
    () =>
      deriveAchievementStats({
        workouts,
        prs,
        completedSets,
        exerciseCategories,
        guideCount: guides.length,
        streak,
        now: new Date(),
        stepDays,
        meals,
        bodyWeights,
        photos,
      }),
    [workouts, prs, completedSets, exerciseCategories, guides.length, streak, stepDays, meals, bodyWeights, photos]
  )

  const progress = useMemo(() => progressForAll(stats), [stats])

  // Variantes de chapa concedidas (F95.1), live como el resto del progreso.
  const collectibles = useLiveQuery(
    () => metaRepo.getJson<Collectible[]>(COLLECTIBLES_KEY, []),
    []
  ) ?? []

  return { progress, collectibles }
}