// Hook que calcula la carga sugerida para la siguiente serie de un ejercicio en sesión.
import { useMemo } from 'react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSettings } from '@/hooks/useSettings'
import { suggestNextLoad, bestCompletedSetWeight } from '@/domain/loadSuggestion'

// Combina último peso completado, RIR y PR para sugerir la siguiente carga (según ajustes).
export const useLoadSuggestion = (exerciseId: number, prWeightKg: number) => {
  const exercises = useActiveWorkoutStore((s) => s.exercises)
  const { settings } = useSettings()

  const exercise = exercises.find((e) => e.exerciseId === exerciseId)
  const sets = exercise?.sets ?? []

  // Recalcula la sugerencia solo si cambian cargas, RIR, PR o la configuración de progresión.
  const suggestion = useMemo(() => {
    if (!settings.showLoadSuggestion) return 0
    const lastWeightKg = bestCompletedSetWeight(sets)
    // RIR del último set completado: guía el ajuste de progresión.
    const lastRir = [...sets]
      .reverse()
      .find((s) => s.completed && s.rir !== undefined)?.rir
    return suggestNextLoad({
      lastWeightKg,
      prWeightKg,
      rir: lastRir,
      progressionPct: settings.loadProgressionPct,
    })
  }, [settings.showLoadSuggestion, settings.loadProgressionPct, sets, prWeightKg])

  return { suggestion, enabled: settings.showLoadSuggestion }
}
