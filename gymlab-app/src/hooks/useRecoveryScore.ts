// Hook que calcula el score de recuperación combinando racha, journal y días sin entrenar.
// F84e: añade el factor de actividad (pasos de hoy / meta) solo cuando hay dato de pasos.
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTodayStepEntry } from './useTodayStepEntry'
import { stepRepo } from '@/data/repositories'
import { computeRecoveryScore } from '@/domain/recoveryScore'
import { DEFAULT_STEPS_GOAL } from '@/domain/stepsTracker'
import { diffLocalDays, toLocalDateStr, localDateOf } from '@/domain/dates'
import { calcStreak } from '@/domain/streak'
import type { Workout, SessionJournalEntry } from '@/domain/types'

// Recibe workouts y journals ya resueltos (la home los comparte con otras tarjetas):
// aquí solo se consultan pasos de hoy y la meta, que nadie más usa. La racha se
// deriva de los mismos workouts para no disparar una consulta getAll() extra.
export const useRecoveryScore = (
  workouts: Workout[],
  journals: SessionJournalEntry[]
) => {
  const today = useTodayStepEntry()
  const stepsGoal = useLiveQuery(() => stepRepo.getGoal(), []) ?? DEFAULT_STEPS_GOAL

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
      currentStreak: calcStreak(workouts.map(localDateOf)).currentStreak,
      ...(activityRatio !== undefined ? { activityRatio } : {}),
    })
  }, [workouts, journals, today, stepsGoal])
}