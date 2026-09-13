// Hook de progreso de logros para /logros: consultas live independientes de
// useAchievements (workouts, PRs, series completadas, catálogo y guías) que
// derivan el stats bag y el progreso de las 15 barras, siempre en vivo.
// La UI pinta barras con la misma fuente de verdad que la evaluación
// (ACHIEVEMENT_PROGRESS), sin duplicar condiciones.
import { useMemo } from 'react'
import { db } from '@/data/repositories/dexie/db'
import { exerciseRepo, guideRepo, prRepo, workoutRepo } from '@/data/repositories'
import {
  deriveAchievementStats,
  progressForAll,
  type AchievementProgress,
  type AchievementStats,
} from '@/domain/achievementProgress'
import type { ExerciseCategory } from '@/domain/types'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'
import { useLiveList } from './useLiveList'

export const useAchievementProgress = (): {
  progress: Record<string, AchievementProgress>
} => {
  const workouts = useLiveList(() => workoutRepo.getAll())
  const prs = useLiveList(() => prRepo.getAll())
  // completed no está indexado en Dexie; toCollection().filter() streamea las
  // filas sin materializar la tabla completa antes de filtrar.
  const completedSets = useLiveList(() =>
    db.workoutSets.toCollection().filter((s) => s.completed).toArray()
  )
  const guides = useLiveList(() => guideRepo.getAll())

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
      }),
    [workouts, prs, completedSets, exerciseCategories, guides.length, streak]
  )

  const progress = useMemo(() => progressForAll(stats), [stats])

  return { progress }
}