import { useCallback } from 'react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import {
  saveWorkoutSession,
  type SaveWorkoutSessionResult,
  type WorkoutSessionSnapshot,
} from '@/data/workoutSession'
import type { PRRecord } from '@/domain/types'

export const useFinishWorkout = (prMap: Map<number, PRRecord>) => {
  const reset = useActiveWorkoutStore((s) => s.reset)

  return useCallback(async (): Promise<SaveWorkoutSessionResult | null> => {
    const state = useActiveWorkoutStore.getState()
    if (state.exercises.length === 0) return null

    const snapshot: WorkoutSessionSnapshot = {
      exercises: state.exercises,
      startedAt: state.startedAt,
      routineId: state.routineId,
      routineDayId: state.routineDayId,
    }

    const saved = await saveWorkoutSession(snapshot, prMap)
    reset()
    return saved
  }, [prMap, reset])
}
