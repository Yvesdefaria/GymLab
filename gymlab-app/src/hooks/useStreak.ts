import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo } from '@/data/repositories'
import { calcStreak } from '@/domain/streak'

export const useStreak = () => {
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const dates = workouts.map((w) => w.startedAt)
  const streak = calcStreak(dates)
  return streak
}
