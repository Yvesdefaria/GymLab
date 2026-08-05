import { calcTotalVolume } from './volume'

export const sessionProgressPct = (completedSets: number, totalSets: number): number => {
  if (totalSets <= 0) return 0
  return Math.min(100, Math.round((completedSets / totalSets) * 100))
}

export interface SessionTargets {
  plannedSets: number
  completedSets: number
}

export const countSessionSets = (
  exercises: { sets: { completed: boolean }[] }[]
): SessionTargets => {
  let plannedSets = 0
  let completedSets = 0
  for (const ex of exercises) {
    plannedSets += ex.sets.length
    completedSets += ex.sets.filter((s) => s.completed).length
  }
  return { plannedSets, completedSets }
}

export interface SessionStats {
  totalVolume: number
  exerciseCount: number
  completedSets: number
  totalSets: number
}

export const computeSessionStats = (
  exercises: { sets: { weightKg: number; reps: number; completed: boolean }[] }[]
): SessionStats => {
  const { plannedSets, completedSets } = countSessionSets(exercises)
  const completedVolumeSets = exercises.flatMap((ex) =>
    ex.sets
      .filter((s) => s.completed)
      .map((s) => ({ weightKg: s.weightKg, reps: s.reps }))
  )
  return {
    totalVolume: calcTotalVolume(completedVolumeSets),
    exerciseCount: exercises.length,
    completedSets,
    totalSets: plannedSets,
  }
}
