// Hook que calcula el score de recuperación combinando racha, journal y días sin entrenar.
// F84e: añade el factor de actividad (pasos de hoy / meta) solo cuando hay dato de pasos.
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLiveList } from './useLiveList'
import { useStreak } from './useStreak'
import { useTodayStepEntry } from './useTodayStepEntry'
import { workoutRepo, sessionJournalRepo, stepRepo } from '@/data/repositories'
import { computeRecoveryScore } from '@/domain/recoveryScore'
import { DEFAULT_STEPS_GOAL } from '@/domain/stepsTracker'
import { diffLocalDays, toLocalDateStr, localDateOf } from '@/domain/dates'

export const useRecoveryScore = () => {
  const workouts = useLiveList(() => workoutRepo.getAll())
  const journals = useLiveList(() => sessionJournalRepo.getAll())
  const today = useTodayStepEntry()
  const stepsGoal = useLiveQuery(() => stepRepo.getGoal(), []) ?? DEFAULT_STEPS_GOAL
  const streak = useStreak()

  return useMemo(() => {
    if (journals.length === 0) return null

    const lastWorkoutDate = workouts.length > 0 ? localDateOf(workouts[0]) : null
    const daysSince = lastWorkoutDate
      ? diffLocalDays(lastWorkoutDate, toLocalDateStr())
      : null

    // Journal más reciente
    const latest = journals[journals.length - 1]

    // Ratio pasos de hoy / meta (0-1): solo añade información si hoy hay registro.
    const activityRatio =
      today && stepsGoal > 0 ? Math.min(1, today.steps / stepsGoal) : undefined

    return computeRecoveryScore({
      daysSinceLastWorkout: daysSince,
      sleep: latest.sleep,
      soreness: latest.soreness,
      currentStreak: streak.currentStreak,
      ...(activityRatio !== undefined ? { activityRatio } : {}),
    })
  }, [workouts, journals, streak, today, stepsGoal])
}
