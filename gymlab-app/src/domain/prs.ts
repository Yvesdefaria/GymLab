// Cálculo del 1RM estimado y detección de récords personales (PR) en las sesiones.
import type { WorkoutSet, PRRecord } from './types'
import { toLocalDateStr, weekStartKey } from './dates'

// Normaliza la fecha de un PR a 'YYYY-MM-DD' local (acepta ISO completo o solo día).
export const prDateKey = (date: string): string =>
  date.length === 10 ? date : toLocalDateStr(new Date(date))

// Cuenta los PRs registrados en la semana que contiene `now`.
export const countPrsInWeek = (prs: PRRecord[], now = new Date()): number => {
  const weekKey = weekStartKey(toLocalDateStr(now))
  return prs.filter((pr) => weekStartKey(prDateKey(pr.date)) === weekKey).length
}

// Cuenta los PRs cuya fecha cae dentro de la ventana temporal de un entrenamiento.
// Los PRs se persisten con date = finishedAt de su sesión (ver detectPRsFromSets), así
// que la ventana ISO exacta [startedAt, finishedAt] desambigua sesiones del mismo día.
export const countPrsInWorkout = (
  workout: { startedAt: string; finishedAt: string | null },
  prs: PRRecord[]
): number => {
  if (!workout.finishedAt) return 0
  const startMs = new Date(workout.startedAt).getTime()
  const endMs = new Date(workout.finishedAt).getTime()
  return prs.filter((pr) => {
    const t = new Date(pr.date).getTime()
    return t >= startMs && t <= endMs
  }).length
}

// Máximo de repeticiones donde Brzycki sigue siendo una estimación defendible.
// Por encima de 12, la fórmula se aleja de la fuerza máxima y empieza a describir
// resistencia: a 36 reps devuelve peso × 36. Antes de ese absurdo, se rechaza.
export const MAX_E1RM_REPS = 12

// Núcleo del cálculo: devuelve null cuando el set no permite una estimación honesta.
export const estimate1RMValue = (weightKg: number, reps: number): number | null => {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return null
  if (reps <= 0 || weightKg <= 0) return null
  if (reps === 1) return weightKg
  if (reps > MAX_E1RM_REPS) return null
  // Brzycki: 1RM = weight × (36 / (37 − reps))
  return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10
}

// Compatibilidad con los consumidores que esperan un número: 0 = sin estimación.
export const estimate1RM = (weightKg: number, reps: number): number =>
  estimate1RMValue(weightKg, reps) ?? 0

// Promedio de e1RM de un conjunto de series, ignorando las que no tienen estimación.
// Evita diluir la media con ceros cuando un set cae fuera del rango fiable.
export const averageE1rm = (sets: WorkoutSet[]): number => {
  let total = 0
  let count = 0
  for (const set of sets) {
    const value = estimate1RMValue(set.weightKg, set.reps)
    if (value === null || value <= 0) continue
    total += value
    count += 1
  }
  return count === 0 ? 0 : total / count
}

// Devuelve los PR nuevos por ejercicio: los mejores 1RM de la sesión que superan los ya registrados.
// Solo series completadas, de trabajo (nunca warmups), con peso y reps positivas.
export const detectPRsFromSets = (
  sets: WorkoutSet[],
  existingPRs: Map<number, PRRecord>
): PRRecord[] => {
  const newPRs: PRRecord[] = []
  const exerciseBests = new Map<number, PRRecord>()

  for (const set of sets) {
    if (!set.completed || set.isWarmup || set.weightKg <= 0 || set.reps <= 0) continue
    const e1rm = estimate1RM(set.weightKg, set.reps)
    if (e1rm <= 0) continue
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

// Mejor PR (1RM estimado) entre las series de trabajo de un ejercicio. Recomputa el
// PR tras borrar una sesión (F98.6): la fila resultante es la mejor que queda, y null
// cuando no queda ninguna serie válida (el PR debe eliminarse). Idempotente por
// construcción: mismo estado → misma fila. Misma semántica que detectPRsFromSets
// (solo series completadas, de trabajo y con peso), reutilizando estimate1RM.
export const bestPRFromSets = (sets: WorkoutSet[]): PRRecord | null => {
  let best: PRRecord | null = null
  for (const set of sets) {
    if (!set.completed || set.isWarmup || set.weightKg <= 0 || set.reps <= 0) continue
    const estimated1RM = estimate1RM(set.weightKg, set.reps)
    if (estimated1RM <= 0) continue
    if (!best || estimated1RM > best.estimated1RM) {
      best = {
        exerciseId: set.exerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
        date: set.createdAt,
        estimated1RM,
      }
    }
  }
  return best
}

// Indica si una serie supera el mejor 1RM estimado guardado para ese ejercicio.
// Un set fuera del rango fiable (o sin fuerza) nunca es PR.
export const isPR = (
  weightKg: number,
  reps: number,
  existingPR: { estimated1RM: number } | undefined
): boolean => {
  const estimated = estimate1RMValue(weightKg, reps)
  if (estimated === null || estimated <= 0) return false
  if (!existingPR) return true
  return estimated > existingPR.estimated1RM
}
