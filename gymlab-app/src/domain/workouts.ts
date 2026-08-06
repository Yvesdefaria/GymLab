import type { Workout } from './types'

export const workoutDate = (w: { localDate?: string; startedAt: string }): Date => {
  return w.localDate ? new Date(w.localDate + 'T12:00:00') : new Date(w.startedAt)
}

export const workoutDurationMin = (
  w: Pick<Workout, 'startedAt' | 'finishedAt'>
): number | null => {
  if (!w.finishedAt) return null
  return Math.max(1, Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000))
}

export const weeklyVolume = (
  workouts: { localDate?: string; startedAt: string; totalVolume: number }[],
  now: Date = new Date()
): number => {
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  return workouts
    .filter((w) => workoutDate(w) >= weekAgo)
    .reduce((acc, w) => acc + w.totalVolume, 0)
}
