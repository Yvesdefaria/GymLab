// Hook que prepara los datos para iniciar una sesión: últimas cargas y borradores de series.
import { useCallback } from 'react'
import { useSettings } from './useSettings'
import { workoutSetRepo } from '@/data/repositories'
import { buildWorkoutSets, type LastSetInfo } from '@/domain/session'
import type { ActiveSet } from '@/store/activeWorkoutStore'

// Expone loadLastSets (últimas series de los ejercicios) y buildSets (borradores según ajustes).
export const useSessionPreload = () => {
  const { settings } = useSettings()

  // Consulta las últimas series registradas por ejercicio para precargar pesos.
  const loadLastSets = useCallback((exerciseIds: number[]) => workoutSetRepo.getLastSets(exerciseIds), [])

  // Construye los sets iniciales (con warmups y precarga según configuración) para añadirlos a la sesión.
  const buildSets = useCallback(
    (exerciseId: number, exerciseName: string, opts: { targetSets: number; targetReps: number; last?: LastSetInfo }): ActiveSet[] => {
      const drafts = buildWorkoutSets({
        targetSets: opts.targetSets,
        targetReps: opts.targetReps,
        last: opts.last,
        preloadEnabled: settings.preloadLast,
        preloadSetCount: settings.preloadSetCount,
        preloadMode: settings.preloadWeightMode,
        preloadValue: settings.preloadWeightValue,
        warmupEnabled: settings.warmupSets,
        warmupPercents: settings.warmupPercents,
      })
      return drafts.map((d, i) => ({
        id: `set-${Date.now()}-${exerciseId}-${i}`,
        exerciseId,
        exerciseName,
        setNumber: i + 1,
        weightKg: d.weightKg,
        reps: d.reps,
        completed: false,
        isWarmup: d.isWarmup,
      }))
    },
    [settings]
  )

  return { loadLastSets, buildSets }
}
