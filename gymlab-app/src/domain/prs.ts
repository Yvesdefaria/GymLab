import type { WorkoutSet, PRRecord } from './types'

export const estimate1RM = (weightKg: number, reps: number): number => {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  // Brzycki formula: 1RM = weight × (36 / (37 − reps))
  return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10
}

export const detectPRsFromSets = (
  sets: WorkoutSet[],
  existingPRs: Map<number, PRRecord>
): PRRecord[] => {
  const newPRs: PRRecord[] = []
  const exerciseBests = new Map<number, PRRecord>()

  for (const set of sets) {
    if (!set.completed || set.weightKg <= 0) continue
    const e1rm = estimate1RM(set.weightKg, set.reps)
    const existing = exerciseBests.get(set.exerciseId)

    if (!existing || e1rm > existing.estimated1RM) {
      exerciseBests.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
        date: set.createdAt,
        estimated1RM: e1rm,
      })
    }
  }

  for (const [exerciseId, best] of exerciseBests) {
    const existing = existingPRs.get(exerciseId)
    if (!existing || best.estimated1RM > existing.estimated1RM) {
      newPRs.push(best)
    }
  }

  return newPRs
}

export const isPR = (
  weightKg: number,
  reps: number,
  existingPR: PRRecord | undefined
): boolean => {
  if (!existingPR) return true
  return estimate1RM(weightKg, reps) > existingPR.estimated1RM
}
