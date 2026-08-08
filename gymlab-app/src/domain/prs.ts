// Cálculo del 1RM estimado y detección de récords personales (PR) en las sesiones.
import type { WorkoutSet, PRRecord } from './types'

export const estimate1RM = (weightKg: number, reps: number): number => {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  // Brzycki formula: 1RM = weight × (36 / (37 − reps))
  return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10
}

// Devuelve los PR nuevos por ejercicio: los mejores 1RM de la sesión que superan los ya registrados.
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

// Indica si una serie supera el mejor 1RM estimado guardado para ese ejercicio.
export const isPR = (
  weightKg: number,
  reps: number,
  existingPR: { estimated1RM: number } | undefined
): boolean => {
  if (!existingPR) return true
  return estimate1RM(weightKg, reps) > existingPR.estimated1RM
}
