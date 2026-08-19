// Hook para repetir el último workout de un día de rutina.
import { useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { workoutRepo, workoutSetRepo } from '@/data/repositories'

// Encuentra el último workout de un rutinaDayId y devuelve sus series.
export const useLastWorkout = (routineDayId: number | null) => {
  const workouts = useLiveList(() => workoutRepo.getAll())

  const lastWorkout = useMemo(() => {
    if (!routineDayId) return null
    const matching = workouts
      .filter((w) => w.routineDayId === routineDayId && w.finishedAt)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    return matching[0] ?? null
  }, [workouts, routineDayId])

  const lastSets = useLiveList(
    () => (lastWorkout ? workoutSetRepo.getByWorkout(lastWorkout.id) : []),
    [lastWorkout?.id]
  )

  return { lastWorkout, lastSets }
}
