// Hook que calcula el score de recuperación combinando racha, journal y días sin entrenar.
import { useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { useStreak } from './useStreak'
import { workoutRepo, sessionJournalRepo } from '@/data/repositories'
import { computeRecoveryScore } from '@/domain/recoveryScore'
import { diffLocalDays, toLocalDateStr, localDateOf } from '@/domain/dates'

export const useRecoveryScore = () => {
  const workouts = useLiveList(() => workoutRepo.getAll())
  const journals = useLiveList(() => sessionJournalRepo.getAll())
  const streak = useStreak()

  return useMemo(() => {
    if (journals.length === 0) return null

    const lastWorkoutDate = workouts.length > 0 ? localDateOf(workouts[0]) : null
    const daysSince = lastWorkoutDate
      ? diffLocalDays(lastWorkoutDate, toLocalDateStr())
      : null

    // Journal más reciente
    const latest = journals[journals.length - 1]

    return computeRecoveryScore({
      daysSinceLastWorkout: daysSince,
      sleep: latest.sleep,
      soreness: latest.soreness,
      currentStreak: streak.currentStreak,
    })
  }, [workouts, journals, streak])
}
