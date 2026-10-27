// Importación de sesiones CSV ya parseadas (F81): crea una sesión por fecha con
// el id REAL en sus series, deduplica por firma de sesión y recalcula los PRs
// afectados. La UI no toca `db`; esta capa la orquesta (patrón workoutDeletion.ts).
import { workoutRepo, workoutSetRepo, prRepo } from '@/data/repositories'
import { db } from '@/data/repositories/dexie/db'
import { bestPRsFromSets } from '@/domain/prs'
import type { ParsedImport } from '@/domain/importParsers'
import type { Workout, WorkoutSet } from '@/domain/types'
import type {
  WorkoutRepository,
  WorkoutSetRepository,
  PRRepository,
} from '@/data/repositories/types'

// Dependencias inyectables: en producción son los repos Dexie; los tests las sustituyen.
export interface ImportWorkoutsDeps {
  transaction: <T>(scope: () => Promise<T>) => Promise<T>
  workouts: Pick<WorkoutRepository, 'getByDate' | 'create'>
  workoutSets: Pick<WorkoutSetRepository, 'getByWorkoutIds' | 'create' | 'getByExercise'>
  prs: Pick<PRRepository, 'upsert' | 'deleteByExercise'>
}

const defaultDeps: ImportWorkoutsDeps = {
  // Una sola transacción rw sobre workouts, series y PRs: el import es atómico.
  transaction: (scope) =>
    db.transaction('rw', [db.workouts, db.workoutSets, db.prs], scope),
  workouts: workoutRepo,
  workoutSets: workoutSetRepo,
  prs: prRepo,
}

// Firma de una sesión: multiconjunto de exerciseId/peso/reps. Ignora setNumber,
// completed y el orden, así un reimport del mismo archivo cuenta como duplicado.
const sessionSignature = (sets: WorkoutSet[]): string =>
  sets
    .map((s) => `${s.exerciseId}:${s.weightKg}:${s.reps}`)
    .sort()
    .join('|')

// Descarta el id placeholder del parser: el repo asigna el id real.
const toWorkoutDraft = (workout: Workout): Omit<Workout, 'id'> => ({
  startedAt: workout.startedAt,
  finishedAt: workout.finishedAt,
  routineId: workout.routineId,
  routineDayId: workout.routineDayId,
  localDate: workout.localDate,
  notes: workout.notes,
  totalVolume: workout.totalVolume,
})

// Agrupa series por una clave numérica (placeholder de workout en el parseo).
const groupByWorkoutId = (sets: WorkoutSet[]): Map<number, WorkoutSet[]> => {
  const groups = new Map<number, WorkoutSet[]>()
  for (const set of sets) {
    const list = groups.get(set.workoutId)
    if (list) list.push(set)
    else groups.set(set.workoutId, [set])
  }
  return groups
}

export const importParsedWorkouts = async (
  parsed: ParsedImport,
  deps: ImportWorkoutsDeps = defaultDeps
): Promise<{ imported: number; duplicates: number }> => {
  const setsByPlaceholder = groupByWorkoutId(parsed.sets)

  let imported = 0
  let duplicates = 0
  const affectedExerciseIds = new Set<number>()

  await deps.transaction(async () => {
    // Firmas de los workouts ya guardados por fecha (cacheada; el import las amplía).
    const signaturesByDate = new Map<string, Set<string>>()
    const existingSignatures = async (date: string): Promise<Set<string>> => {
      const cached = signaturesByDate.get(date)
      if (cached) return cached
      const existing = await deps.workouts.getByDate(date)
      const existingSets = await deps.workoutSets.getByWorkoutIds(existing.map((w) => w.id))
      const setsByWorkout = groupByWorkoutId(existingSets)
      const signatures = new Set(
        existing.map((w) => sessionSignature(setsByWorkout.get(w.id) ?? []))
      )
      signaturesByDate.set(date, signatures)
      return signatures
    }

    for (const parsedWorkout of parsed.workouts) {
      const sessionSets = setsByPlaceholder.get(parsedWorkout.id) ?? []
      const signature = sessionSignature(sessionSets)
      const signatures = await existingSignatures(parsedWorkout.localDate)
      if (signatures.has(signature)) {
        duplicates += 1
        continue
      }

      const realId = await deps.workouts.create(toWorkoutDraft(parsedWorkout))
      for (const set of sessionSets) {
        // El id REAL enlaza las series con su sesión (el placeholder ya no sale de aquí).
        await deps.workoutSets.create({ ...set, workoutId: realId })
        affectedExerciseIds.add(set.exerciseId)
      }
      // La firma nueva evita duplicados entre sesiones idénticas del mismo archivo.
      signatures.add(signature)
      imported += 1
    }

    // PRs de los ejercicios importados: mejor peso por ejercicio+reps de las series
    // restantes, o eliminación si no queda ninguna válida (mismo criterio que F98.6).
    for (const exerciseId of affectedExerciseIds) {
      const remaining = await deps.workoutSets.getByExercise(exerciseId)
      const best = bestPRsFromSets(remaining)
      await deps.prs.deleteByExercise(exerciseId)
      for (const pr of best) await deps.prs.upsert(pr)
    }
  })

  return { imported, duplicates }
}
