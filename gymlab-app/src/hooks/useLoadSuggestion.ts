// Hook que calcula la carga sugerida ("Sugerido") para la siguiente serie de un ejercicio
// en sesión, usando el motor único `recommendLoad` (F97.2/97.3/97.4). La base "sesión viva"
// es el mayor peso de una serie de trabajo completada (sin warmups).
// F120/CAR-2: los ajustes llegan por parámetro (los lee una sola vez la página), así cada
// bloque montado no abre su propia liveQuery de settings.
import { useMemo } from 'react'
import { useActiveWorkoutStore, type ActiveSet } from '@/store/activeWorkoutStore'
import { recommendLoad } from '@/domain/loadRecommendation'

// Array vacío estable: evita que `exercise?.sets ?? []` cree una referencia nueva en cada render.
const EMPTY_SETS: ActiveSet[] = []

// Mayor peso de una serie completada de trabajo (excluye warmups): base de la sesión en curso.
const liveTopSetWeight = (sets: ActiveSet[]): number =>
  sets.reduce(
    (best, s) => (s.completed && !s.isWarmup && s.weightKg > 0 ? Math.max(best, s.weightKg) : best),
    0
  )

// Combina el promedio reciente (historial), la sesión en curso, el PR y el RIR para sugerir
// la siguiente carga. Suscripción fina al store: solo reacciona al ejercicio consultado.
export const useLoadSuggestion = (
  exerciseId: number,
  prWeightKg: number,
  recentTopSetAvgKg: number,
  showLoadSuggestion: boolean,
  progressionPct: number
) => {
  const exercise = useActiveWorkoutStore((s) => s.exercises.find((e) => e.exerciseId === exerciseId))
  const sets = exercise?.sets ?? EMPTY_SETS

  const recommendation = useMemo(() => {
    if (!showLoadSuggestion) return { weightKg: 0, baseKg: 0, capped: false }
    // RIR del último set completado: guía el ajuste de progresión.
    const lastRir = [...sets]
      .reverse()
      .find((s) => s.completed && s.rir !== undefined)?.rir
    return recommendLoad({
      recentTopSetAvgKg,
      lastSessionTopSetKg: liveTopSetWeight(sets),
      prWeightKg,
      rir: lastRir,
      progressionPct,
    })
  }, [showLoadSuggestion, progressionPct, sets, prWeightKg, recentTopSetAvgKg])

  return {
    suggestion: recommendation.weightKg,
    capped: recommendation.capped,
    enabled: showLoadSuggestion,
  }
}
