import { useCallback } from 'react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSessionPreload } from '@/hooks/useSessionPreload'
import { useExerciseRecents } from '@/hooks/useExerciseFavorites'

export interface StartRoutineDayItem {
  exerciseId: number
  exerciseName: string
  restSec?: number
  supersetGroup?: string
  targetSets: number
  targetReps: number
}

export const useStartSession = () => {
  const { loadLastSets, buildSets } = useSessionPreload()
  const loadRoutineDay = useActiveWorkoutStore((s) => s.loadRoutineDay)
  const addExercise = useActiveWorkoutStore((s) => s.addExercise)
  const { record } = useExerciseRecents()

  const startFreeExercise = useCallback(
    async (exerciseId: number, exerciseName: string) => {
      const lastMap = await loadLastSets([exerciseId])
      const sets = buildSets(exerciseId, exerciseName, {
        targetSets: 0,
        targetReps: 0,
        last: lastMap.get(exerciseId),
      })
      addExercise(exerciseId, exerciseName, sets)
      void record(exerciseId)
    },
    [loadLastSets, buildSets, addExercise, record]
  )

  const startRoutineDay = useCallback(
    async (items: StartRoutineDayItem[], routineId: number, routineDayId: number) => {
      const lastMap = await loadLastSets(items.map((it) => it.exerciseId))
      loadRoutineDay(
        items.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName: it.exerciseName,
          restSec: it.restSec,
          supersetGroup: it.supersetGroup,
          sets: buildSets(it.exerciseId, it.exerciseName, {
            targetSets: it.targetSets,
            targetReps: it.targetReps,
            last: lastMap.get(it.exerciseId),
          }),
        })),
        routineId,
        routineDayId
      )
    },
    [loadLastSets, buildSets, loadRoutineDay]
  )

  return { startFreeExercise, startRoutineDay }
}
