import type { WorkoutSet, Workout } from './types'
import { estimate1RM } from './prs'

export interface E1rmPoint {
  date: string
  estimated1RM: number
}

export const buildE1rmSeries = (
  sets: WorkoutSet[],
  workoutsById: ReadonlyMap<number, Workout>
): E1rmPoint[] => {
  const byDate = new Map<string, number>()

  for (const set of sets) {
    if (!set.completed || set.weightKg <= 0 || set.reps <= 0) continue
    const workout = workoutsById.get(set.workoutId)
    if (!workout) continue

    const estimated1RM = estimate1RM(set.weightKg, set.reps)
    const best = byDate.get(workout.startedAt) ?? 0
    if (estimated1RM > best) byDate.set(workout.startedAt, estimated1RM)
  }

  return Array.from(byDate, ([date, estimated1RM]) => ({ date, estimated1RM })).sort(
    (a, b) => a.date.localeCompare(b.date)
  )
}
