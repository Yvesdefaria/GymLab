// Hook reactivo de logros: vigila workouts/PRs/series en Dexie y, cuando se
// desbloquea un logro nuevo (sesión completada, PR, racha...), lo persiste en
// meta.unlockedAchievements y lo devuelve para mostrarlo en el modal una vez.
// También mantiene el contador «veces conseguido» (meta.achievementCounts) que
// alimenta las chapas-medalla del perfil/página de logros.
import { useEffect, useMemo, useState } from 'react'
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
  checkAchievements,
  getAchievement,
  grantedCollectibles,
  mergeCollectibles,
  nextAchievementCounts,
  type Achievement,
  type Collectible,
} from '@/domain/achievements'
import { deriveAchievementStats } from '@/domain/achievementProgress'
import type {
  DailyStepsEntry,
  ExerciseCategory,
  MealEntry,
  MuscleGroup,
  Workout,
} from '@/domain/types'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'

export const UNLOCKED_ACHIEVEMENTS_KEY = 'unlockedAchievements'
export const ACHIEVEMENT_COUNTS_KEY = 'achievementCounts'
export const ACHIEVEMENT_SNAPSHOT_KEY = 'achievementSnapshot'
export const COLLECTIBLES_KEY = 'collectibles'

// Guardar una sesión escribe workouts, series y PRs en una ráfaga de
// mutaciones Dexie; evaluamos tras un debounce para no mostrar el modal con
// una lista parcial ni escribir meta en cada escritura intermedia.
const EVALUATION_DEBOUNCE_MS = 600

// Digests del key de cambio: capturan ediciones que conservan longitudes y
// totales pero cambian la DISTRIBUCIÓN que miden varias medallas.

// Pasos por día (fecha:pasos:distancia): 4 de las 5 medidas de pasos y
// pasos-50km dependen de cómo se reparte el total entre días.
export const stepDaysDigest = (stepDays: DailyStepsEntry[]): string =>
  stepDays.map((d) => `${d.localDate}:${d.steps}:${d.distanceKm ?? 0}`).join('|')

// Inicio/fin por sesión: longestSessionMin depende de los instantes reales.
export const workoutTimesDigest = (workouts: Workout[]): string =>
  workouts.map((w) => `${w.startedAt}:${w.finishedAt ?? ''}`).join('|')

// Proteína total por día (fecha:gramos): maxDailyProteinG mira el pico diario,
// no el total global.
export const mealProteinByDayDigest = (meals: MealEntry[]): string => {
  const byDay = new Map<string, number>()
  for (const meal of meals) {
    const protein = meal.items.reduce((sum, item) => sum + item.proteinG, 0)
    byDay.set(meal.localDate, (byDay.get(meal.localDate) ?? 0) + protein)
  }
  return [...byDay.entries()].map(([date, protein]) => `${date}:${protein}`).join('|')
}

export const useAchievements = () => {
  const [unlocked, setUnlocked] = useState<Achievement[]>([])
  const [newGranted, setNewGranted] = useState<Collectible[]>([])

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
  const collectiblesRaw = useLiveQuery(
    () => metaRepo.getJson<Collectible[]>(COLLECTIBLES_KEY, []),
    []
  )
  // Histórico de pasos (F109.1): alimenta las medidas de los logros unificados.
  const stepDaysRaw = useLiveQuery(() => stepRepo.getAll(), [])
  // Familias nuevas (F109.2): comidas, peso corporal y fotos de progreso.
  const mealsRaw = useLiveQuery(() => mealRepo.getAll(), [])
  const bodyWeightsRaw = useLiveQuery(() => bodyWeightRepo.getAll(), [])
  const photosRaw = useLiveQuery(() => progressPhotoRepo.getAll(), [])

  const ready =
    workoutsRaw !== undefined && prsRaw !== undefined && completedSetsRaw !== undefined &&
    savedIdsRaw !== undefined && countsRaw !== undefined && snapshotRaw !== undefined &&
    collectiblesRaw !== undefined && stepDaysRaw !== undefined &&
    mealsRaw !== undefined && bodyWeightsRaw !== undefined && photosRaw !== undefined

  const workouts = workoutsRaw ?? []
  const prs = prsRaw ?? []
  const completedSets = completedSetsRaw ?? []
  const savedIds = savedIdsRaw ?? []
  const counts = countsRaw ?? {}
  const snapshot = snapshotRaw ?? []
  const collectibles = collectiblesRaw ?? []
  const stepDays = stepDaysRaw ?? []
  const meals = mealsRaw ?? []
  const bodyWeights = bodyWeightsRaw ?? []
  const photos = photosRaw ?? []

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
  // Grupos musculares de los mismos ejercicios (F109.2): volumen por grupo de los retos.
  const exerciseMuscles = useMemo(() => {
    const map = new Map<number, MuscleGroup>()
    for (const exercise of exercisesRaw ?? []) {
      map.set(exercise.id, exercise.muscleGroup)
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
    collectibles.length,
    collectibles.map((c) => `${c.achievementId}:${c.variantId}`).join(','),
    // Pasos: digest por día — count + total no ven una edición compensatoria
    // (9.999+1 → 10.000+0) que sí cambia las medidas de distribución.
    stepDaysDigest(stepDays),
    // Sesiones: los instantes alimentan longestSessionMin (la longitud no los ve).
    workoutTimesDigest(workouts),
    // Comidas/peso/fotos (F109.2): además de la longitud, las fechas y la
    // proteína total detectan ediciones de una comida sin alta nueva.
    meals.length,
    meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.proteinG, 0), 0),
    meals.map((m) => m.localDate).join(','),
    // Proteína por día: el pico diario depende de la distribución, no del total.
    mealProteinByDayDigest(meals),
    bodyWeights.length,
    photos.length,
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
        stepDays,
        exerciseMuscles,
        meals,
        bodyWeights,
        photos,
      })
      const earnedIds = checkAchievements(stats)

      // Contador «veces conseguido»: transición no-cumplido → cumplido.
      const { counts: nextCounts, snapshot: nextSnapshot } = nextAchievementCounts(
        { counts, snapshot },
        earnedIds
      )
      void metaRepo.setJson(ACHIEVEMENT_COUNTS_KEY, nextCounts)
      void metaRepo.setJson(ACHIEVEMENT_SNAPSHOT_KEY, nextSnapshot)

      // Variantes de chapa (F95.1): la concesión deriva del contador YA
      // incrementado y el merge es idempotente (re-evaluar no duplica). El
      // delta es la cola apendida y se persiste ANTES del early-return: un
      // re-logro sin ids nuevos (freshIds vacío) también otorga variante.
      const nextCollectibles = mergeCollectibles(collectibles, grantedCollectibles(nextCounts))
      void metaRepo.setJson(COLLECTIBLES_KEY, nextCollectibles)
      const delta = nextCollectibles.slice(collectibles.length)
      if (delta.length > 0) setNewGranted(delta)

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
    // exerciseMuscles se lee en las stats (volumen por grupo); va como
    // dependencia explícita igual que en useAchievementProgress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, exerciseMuscles])

  // Cerrar el modal también descarta el anuncio de variantes pendientes para
  // que un re-logro posterior no re-anuncie una variante ya consumida.
  const dismiss = () => {
    setUnlocked([])
    setNewGranted([])
  }

  return { achievements: unlocked, dismiss, counts, newGranted }
}
