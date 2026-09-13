// Borrado permanente de una sesión (F98.6): cascada atómica workout + series +
// journal y recálculo de los PRs afectados. La UI no toca `db`; esta capa la orquesta.
import { workoutRepo, workoutSetRepo, sessionJournalRepo, prRepo } from '@/data/repositories'
import { db } from '@/data/repositories/dexie/db'
import { bestPRFromSets } from '@/domain/prs'
import type {
  WorkoutRepository,
  WorkoutSetRepository,
  SessionJournalRepository,
  PRRepository,
} from '@/data/repositories/types'

// Dependencias inyectables: en producción son los repos Dexie; los tests las sustituyen.
export interface WorkoutDeletionDeps {
  transaction: <T>(scope: () => Promise<T>) => Promise<T>
  workoutSets: Pick<WorkoutSetRepository, 'getByWorkout' | 'getByExercise' | 'deleteByWorkout'>
  sessionJournals: Pick<SessionJournalRepository, 'delete'>
  workouts: Pick<WorkoutRepository, 'delete'>
  prs: Pick<PRRepository, 'upsert' | 'deleteByExercise'>
}

const defaultDeps: WorkoutDeletionDeps = {
  // Una sola transacción rw sobre las cuatro tablas: la cascada es atómica (D8).
  transaction: (scope) =>
    db.transaction('rw', [db.workouts, db.workoutSets, db.sessionJournals, db.prs], scope),
  workoutSets: workoutSetRepo,
  sessionJournals: sessionJournalRepo,
  workouts: workoutRepo,
  prs: prRepo,
}

// Borra una sesión y todo su rastro. Los PRs de los ejercicios con series en la
// sesión se recalculan sobre las series restantes (mejor 1RM, o eliminación si no
// queda ninguna); los ejercicios no afectados no se tocan. Idempotente.
export const deleteWorkoutSession = async (
  workoutId: number,
  deps: WorkoutDeletionDeps = defaultDeps
): Promise<void> => {
  // Los ejercicios afectados se leen antes del borrado (sus series ya no existirán).
  const sets = await deps.workoutSets.getByWorkout(workoutId)
  const affectedExerciseIds = Array.from(new Set(sets.map((set) => set.exerciseId)))

  await deps.transaction(async () => {
    await deps.workoutSets.deleteByWorkout(workoutId)
    await deps.sessionJournals.delete(workoutId)
    await deps.workouts.delete(workoutId)

    for (const exerciseId of affectedExerciseIds) {
      const remaining = await deps.workoutSets.getByExercise(exerciseId)
      const best = bestPRFromSets(remaining)
      if (best) await deps.prs.upsert(best)
      else await deps.prs.deleteByExercise(exerciseId)
    }
  })
}
