// Hook reactivo de logros: vigila workouts/PRs/series en Dexie y, cuando se
// desbloquea un logro nuevo (sesión completada, PR, racha...), lo persiste en
// meta.unlockedAchievements y lo devuelve para mostrarlo en el modal una vez.
// También mantiene el contador «veces conseguido» (meta.achievementCounts) que
// alimenta las chapas-medalla del perfil/página de logros.
import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/data/repositories/dexie/db'
import { exerciseRepo, guideRepo, metaRepo, prRepo, workoutRepo } from '@/data/repositories'
import {
  checkAchievements,
  getAchievement,
  nextAchievementCounts,
  type Achievement,
} from '@/domain/achievements'
import { deriveAchievementStats } from '@/domain/achievementProgress'
import type { ExerciseCategory } from '@/domain/types'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'

export const UNLOCKED_ACHIEVEMENTS_KEY = 'unlockedAchievements'
export const ACHIEVEMENT_COUNTS_KEY = 'achievementCounts'
export const ACHIEVEMENT_SNAPSHOT_KEY = 'achievementSnapshot'

// Guardar una sesión escribe workouts, series y PRs en una ráfaga de
// mutaciones Dexie; evaluamos tras un debounce para no mostrar el modal con
// una lista parcial ni escribir meta en cada escritura intermedia.
const EVALUATION_DEBOUNCE_MS = 600

export const useAchievements = () => {
  const [unlocked, setUnlocked] = useState<Achievement[]>([])

  // useLiveQuery devuelve undefined hasta la primera lectura; no evaluamos
  // logros hasta que TODAS las consultas (incluida meta) han cargado, para no
  // mostrar el modal antes de conocer los IDs ya desbloqueados.
  const workoutsRaw = useLiveQuery(() => workoutRepo.getAll(), [])
  const prsRaw = useLiveQuery(() => prRepo.getAll(), [])
  // Optimización: completed no está indexado en Dexie, pero toCollection().filter()
  // streamea las filas sin materializar la tabla completa antes de filtrar.
  const completedSetsRaw = useLiveQuery(
    () => db.workoutSets.toCollection().filter((s) => s.completed).toArray(),
    []
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

  const ready =
    workoutsRaw !== undefined && prsRaw !== undefined && completedSetsRaw !== undefined &&
    savedIdsRaw !== undefined && countsRaw !== undefined && snapshotRaw !== undefined

  const workouts = workoutsRaw ?? []
  const prs = prsRaw ?? []
  const completedSets = completedSetsRaw ?? []
  const savedIds = savedIdsRaw ?? []
  const counts = countsRaw ?? {}
  const snapshot = snapshotRaw ?? []

  // Catálogo de los ejercicios usados en series completadas (categorías para
  // cardio) y guías disponibles (target dinámico de guias-completas). Ambas
  // consultas condicionan el ready para no evaluar con categorías a medias.
  const uniqueExerciseIds = useMemo(
    () => [...new Set(completedSets.map((s) => s.exerciseId))],
    [completedSets]
  )
  const exercisesRaw = useLiveQuery(
    () => exerciseRepo.getByIds(uniqueExerciseIds),
    [uniqueExerciseIds]
  )
  const guidesRaw = useLiveQuery(() => guideRepo.getAll(), [])

  const categories = useMemo(() => {
    const map = new Map<number, ExerciseCategory>()
    for (const exercise of exercisesRaw ?? []) {
      if (exercise.category) map.set(exercise.id, exercise.category)
    }
    return map
  }, [exercisesRaw])
  const guideCount = guidesRaw?.length ?? 0

  // Racha histórica más larga, necesaria para los logros de racha.
  const streak = useMemo(() => calcStreak(workouts.map(localDateOf)), [workouts])

  // Firma con primitivas (no objetos): el efecto solo corre cuando cambia de
  // verdad algún dato que afecta a los logros, evitando loops de re-render.
  const signature = [
    ready,
    workouts.length,
    prs.length,
    completedSets.length,
    streak.longestStreak,
    categories.size,
    guideCount,
    savedIds.length,
    savedIds.join(','),
    snapshot.join(','),
  ].join('|')

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => {
      // Stats bag real derivado de Dexie: categorías del catálogo para cardio
      // y guías disponibles para el target dinámico de guias-completas.
      const stats = deriveAchievementStats({
        workouts,
        prs,
        completedSets,
        exerciseCategories: categories,
        guideCount,
        streak,
        now: new Date(),
      })
      const earnedIds = checkAchievements(stats)

      // Contador «veces conseguido»: transición no-cumplido → cumplido.
      const { counts: nextCounts, snapshot: nextSnapshot } = nextAchievementCounts(
        { counts, snapshot },
        earnedIds
      )
      void metaRepo.setJson(ACHIEVEMENT_COUNTS_KEY, nextCounts)
      void metaRepo.setJson(ACHIEVEMENT_SNAPSHOT_KEY, nextSnapshot)

      const freshIds = earnedIds.filter((id) => !savedIds.includes(id))
      if (freshIds.length === 0) return
      // Persistir ANTES de mostrar garantiza "solo una vez" aunque se recargue.
      const merged = [...new Set([...savedIds, ...freshIds])]
      void metaRepo.setJson(UNLOCKED_ACHIEVEMENTS_KEY, merged)
      // Acumula en vez de sustituir: si ya hay logros en pantalla, los combina.
      const fresh = freshIds.map((id) => getAchievement(id)!).filter(Boolean)
      setUnlocked((prev) => [...prev, ...fresh.filter((a) => !prev.some((p) => p.id === a.id))])
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, EVALUATION_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const dismiss = () => setUnlocked([])

  return { achievements: unlocked, dismiss, counts }
}
