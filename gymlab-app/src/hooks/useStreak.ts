import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo } from '@/data/repositories'
import { calcStreak } from '@/domain/streak'
import { toLocalDateStr } from '@/domain/dates'

export const useStreak = () => {
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const dates = workouts.map((w) => w.localDate || toLocalDateStr(new Date(w.startedAt)))
  return calcStreak(dates)
}
