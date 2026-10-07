// Hook reactivo de logros: consume la capa única de datos (fan-out + stats ya
// derivados) y, cuando se desbloquea un logro nuevo (sesión completada, PR,
// racha...), lo persiste en meta.unlockedAchievements y lo devuelve para
// mostrarlo en el modal una vez. También mantiene el contador «veces conseguido»
// (meta.achievementCounts) que alimenta las chapas-medalla del perfil/logros.
import { useEffect, useMemo, useState } from 'react'
import { metaRepo } from '@/data/repositories'
import {
  checkAchievements,
  getAchievement,
  nextAchievementCounts,
  type Achievement,
  type Collectible,
} from '@/domain/achievements'
import {
  achievementStatePatch,
  freshAchievementIds,
  newCollectibleDelta,
  reconcileAchievementState,
} from '@/domain/achievementReconcile'
import type { DailyStepsEntry, MealEntry, Workout } from '@/domain/types'
import {
  ACHIEVEMENT_COUNTS_KEY,
  ACHIEVEMENT_SNAPSHOT_KEY,
  COLLECTIBLES_KEY,
  UNLOCKED_ACHIEVEMENTS_KEY,
  useAchievementsData,
} from './useAchievementsData'

export {
  UNLOCKED_ACHIEVEMENTS_KEY,
  ACHIEVEMENT_COUNTS_KEY,
  ACHIEVEMENT_SNAPSHOT_KEY,
  COLLECTIBLES_KEY,
}

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

  const {
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
  } = useAchievementsData()

  // Firma con primitivas (no objetos): el efecto solo corre cuando cambia de
  // verdad algún dato que afecta a los logros, evitando loops de re-render.
  // F120/A4: memoizada sobre los arrays fuente; sin esto cada render del host
  // (navegación, contexto) reconstruía digests O(steps + meals + workouts).
  const signature = useMemo(
    () =>
      [
        ready,
        workouts.length,
        prs.length,
        completedSets.length,
        streak.longestStreak,
        exerciseCategories.size,
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
      ].join('|'),
    [ready, workouts, prs, completedSets, streak, exerciseCategories, guideCount, savedIds, snapshot, collectibles, stepDays, meals, bodyWeights, photos]
  )

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => {
      const earnedIds = checkAchievements(stats)

      // 1) Contador «veces conseguido»: transición no-cumplido → cumplido.
      const counted = nextAchievementCounts({ counts, snapshot }, earnedIds)

      // 2) Reconciliación global (F112, D6/D7): re-bloqueo de lo no sostenido,
      //    contadores restringidos a earned, snapshot := earned y chapas
      //    retrocedidas de forma determinística.
      const reconciled = reconcileAchievementState(
        { unlocked: savedIds, counts: counted.counts, snapshot: counted.snapshot, collectibles },
        earnedIds
      )
      // 3) freshIds contra el savedIds PRE-reconciliación: re-bloquear no dispara
      //    modal; volver a ganarlo más adelante sí (es un logro nuevo, D7). Los
      //    recién ganados se unen al set persistido (la reconciliación solo recorta).
      const freshIds = freshAchievementIds(earnedIds, savedIds)
      const nextState = {
        ...reconciled,
        unlocked: [...new Set([...reconciled.unlocked, ...freshIds])],
      }

      // 4) Escrituras solo-si-cambió: un estado idéntico no toca meta. `counts` NO
      //    entra a la firma del effect, así que estas escrituras no lo re-disparan.
      const patch = achievementStatePatch(
        { unlocked: savedIds, counts, snapshot, collectibles },
        nextState
      )
      if (patch.unlocked) void metaRepo.setJson(UNLOCKED_ACHIEVEMENTS_KEY, patch.unlocked)
      if (patch.counts) void metaRepo.setJson(ACHIEVEMENT_COUNTS_KEY, patch.counts)
      if (patch.snapshot) void metaRepo.setJson(ACHIEVEMENT_SNAPSHOT_KEY, patch.snapshot)
      if (patch.collectibles) void metaRepo.setJson(COLLECTIBLES_KEY, patch.collectibles)

      // 5) Variantes nuevas del cálculo (incluye la re-concedida tras un retroceso).
      const delta = newCollectibleDelta(collectibles, nextState.collectibles)
      if (delta.length > 0) setNewGranted(delta)

      if (freshIds.length === 0) return
      // Acumula en vez de sustituir: si ya hay logros en pantalla, los combina.
      const fresh = freshIds.map((id) => getAchievement(id)!).filter(Boolean)
      setUnlocked((prev) => [...prev, ...fresh.filter((a) => !prev.some((p) => p.id === a.id))])
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, EVALUATION_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // stats y exerciseMuscles viven en la capa única: cambian cuando cambia la
    // firma o el mapa muscular, igual que antes.
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
