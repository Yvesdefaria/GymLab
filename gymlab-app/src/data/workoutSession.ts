// Persistencia de una sesión de entrenamiento: crea el workout, sus series, detecta PRs
// y devuelve el resumen de lo guardado. Orquesta repos y lógica de dominio, sin tocar UI.
import { workoutRepo, workoutSetRepo, prRepo } from '@/data/repositories'
import { detectPRsFromSets } from '@/domain/prs'
import { computeSessionStats } from '@/domain/sessionProgress'
import { toLocalDateStr } from '@/domain/dates'
import type { PRRecord, WorkoutSet } from '@/domain/types'
import type { ActiveExercise } from '@/store/activeWorkoutStore'

// Instantánea de la sesión activa que se pasa al guardado (datos del store de sesión).
export interface WorkoutSessionSnapshot {
  exercises: ActiveExercise[]
  startedAt: string | null
  routineId: number | null
  routineDayId: number | null
}

// Resumen del guardado: métricas para el resumen final de la sesión.
export interface SaveWorkoutSessionResult {
  workoutId: number
  totalVolume: number
  exerciseCount: number
  completedSets: number
  totalSets: number
  durationMin: number
  prCount: number
  skippedSets: number
}

// Guarda la sesión de una vez: cabecera, series completadas, PRs nuevos y resumen.
export const saveWorkoutSession = async (
  snapshot: WorkoutSessionSnapshot,
  existingPRs: Map<number, PRRecord>
): Promise<SaveWorkoutSessionResult> => {
  const { exercises, startedAt, routineId, routineDayId } = snapshot
  const finishedAt = new Date()
  const finishedAtISO = finishedAt.toISOString()

  const stats = computeSessionStats(exercises)

  const workoutId = await workoutRepo.create({
    startedAt: startedAt ?? finishedAtISO,
    finishedAt: finishedAtISO,
    routineId,
    routineDayId,
    localDate: toLocalDateStr(),
    notes: '',
    totalVolume: stats.totalVolume,
  })

  const savedSets: WorkoutSet[] = []
  let skippedSets = 0
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (!set.completed) continue
      // Serie marcada como hecha pero sin peso ni reps: se omite, no se guarda.
      if (set.weightKg <= 0 && set.reps <= 0) {
        skippedSets += 1
        continue
      }
      const draft = {
        workoutId,
        exerciseId: ex.exerciseId,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        completed: true,
        isWarmup: set.isWarmup,
        rpe: set.rpe,
        rir: set.rir,
        supersetGroup: set.supersetGroup,
        createdAt: finishedAtISO,
      }
      const id = await workoutSetRepo.create(draft)
      savedSets.push({ ...draft, id })
    }
  }

  // Compara las series guardadas con los PRs previos y registra solo los nuevos.
  const newPRs = detectPRsFromSets(savedSets, existingPRs)
  for (const pr of newPRs) {
    await prRepo.upsert(pr)
  }

  // Duración real solo si hay hora de inicio; mínimo 1 min para no mostrar 0.
  const durationMin = startedAt
    ? Math.max(1, Math.round((finishedAt.getTime() - new Date(startedAt).getTime()) / 60000))
    : 0

  return {
    workoutId,
    totalVolume: stats.totalVolume,
    exerciseCount: stats.exerciseCount,
    completedSets: savedSets.length,
    totalSets: stats.totalSets,
    durationMin,
    prCount: newPRs.length,
    skippedSets,
  }
}
