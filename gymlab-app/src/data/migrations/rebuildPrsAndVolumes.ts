// Reconstrucción determinista de los derivados de una sesión:
// - PRs: mejor peso por ejercicio y reps (1..12), solo series de trabajo.
// - Volumen: solo series de trabajo (sin calentamientos).
// Se usa en la migración v17 y en el import de backup; al ser puro se puede testear
// sin IndexedDB y re-ejecutar sin estado oculto.
import type { PRRow, WorkoutSet } from '@/domain/types'

const REP_CAP = 12

export interface RebuildResult {
  // Filas listas para `prs` (sin id; la tabla lo autoincrementa).
  prs: Omit<PRRow, 'id'>[]
  volumeByWorkout: Map<number, number>
}

export const rebuildPrsAndVolumes = (sets: WorkoutSet[]): RebuildResult => {
  const best = new Map<string, Omit<PRRow, 'id'>>()
  const volumeByWorkout = new Map<number, number>()

  for (const set of sets) {
    const working = set.completed && !set.isWarmup && set.weightKg > 0 && set.reps > 0
    if (!working) continue

    volumeByWorkout.set(
      set.workoutId,
      (volumeByWorkout.get(set.workoutId) ?? 0) + set.weightKg * set.reps
    )

    if (set.reps < 1 || set.reps > REP_CAP) continue
    const key = `${set.exerciseId}:${set.reps}`
    const current = best.get(key)
    if (!current || set.weightKg > current.weightKg) {
      best.set(key, {
        exerciseId: set.exerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
        date: set.createdAt,
      })
    }
  }

  return { prs: [...best.values()], volumeByWorkout }
}
