// Cálculo del 1RM estimado y detección de récords personales (PR) en las sesiones.
// Un PR es un hecho: el mayor peso levantado por ejercicio y cantidad de repeticiones.
// La estimación de 1RM se deriva al leer; nunca se guarda dentro del récord.
import type { WorkoutSet, PRRecord } from './types'
import { toLocalDateStr, weekStartKey } from './dates'
import { isWorkingSet } from './setFilters'

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
// Es un promedio **por serie**: úsalo para comparar series dentro de una misma sesión.
// Para rangos entre sesiones, usa `averageE1rmPerSession`.
export const averageE1rm = (sets: WorkoutSet[]): number => {
  let total = 0
  let count = 0
  for (const set of sets) {
    if (!isWorkingSet(set)) continue
    const value = estimate1RMValue(set.weightKg, set.reps)
    if (value === null || value <= 0) continue
    total += value
    count += 1
  }
  return count === 0 ? 0 : total / count
}

// Promedio de e1RM por sesión: mejor serie de cada workout y media de sesiones.
// Una sesión con 10 series no pesa 10 veces más que una con 2 (H9).
export const averageE1rmPerSession = (sets: WorkoutSet[]): number => {
  const bestByWorkout = new Map<number, number>()
  for (const set of sets) {
    if (!isWorkingSet(set)) continue
    const value = estimate1RMValue(set.weightKg, set.reps)
    if (value === null || value <= 0) continue
    bestByWorkout.set(set.workoutId, Math.max(bestByWorkout.get(set.workoutId) ?? 0, value))
  }
  if (bestByWorkout.size === 0) return 0
  const total = [...bestByWorkout.values()].reduce((acc, value) => acc + value, 0)
  return total / bestByWorkout.size
}

// Clave lógica de un récord: mismo ejercicio + misma cantidad de reps.
export const prKey = (exerciseId: number, reps: number): string => `${exerciseId}:${reps}`

// Adjunta la estimación derivada para la UI sin persistirla.
const withEstimate = (record: Omit<PRRecord, 'estimated1RM'>): PRRecord => ({
  ...record,
  estimated1RM: estimate1RM(record.weightKg, record.reps),
})

// Candidatos válidos: series de trabajo dentro del rango fiable de reps.
const isRecordCandidate = (set: WorkoutSet): boolean =>
  isWorkingSet(set) && set.reps >= 1 && set.reps <= MAX_E1RM_REPS

// Mejor hecho por [ejercicio + reps] dentro de una lista de series.
const bestByRep = (sets: WorkoutSet[]): Map<string, PRRecord> => {
  const best = new Map<string, PRRecord>()
  for (const set of sets) {
    if (!isRecordCandidate(set)) continue
    const key = prKey(set.exerciseId, set.reps)
    const current = best.get(key)
    if (!current || set.weightKg > current.weightKg) {
      best.set(
        key,
        withEstimate({
          exerciseId: set.exerciseId,
          weightKg: set.weightKg,
          reps: set.reps,
          date: set.createdAt,
        })
      )
    }
  }
  return best
}

// PRs nuevos de una sesión: mejor peso por ejercicio+reps que supera el récord previo.
export const detectPRsFromSets = (
  sets: WorkoutSet[],
  existingPRs: readonly PRRecord[]
): PRRecord[] => {
  const existingByKey = new Map<string, PRRecord>()
  for (const pr of existingPRs) existingByKey.set(prKey(pr.exerciseId, pr.reps), pr)

  const out: PRRecord[] = []
  for (const [key, record] of bestByRep(sets)) {
    const existing = existingByKey.get(key)
    if (!existing || record.weightKg > existing.weightKg) out.push(record)
  }
  return out
}

// Todos los récords que quedan tras borrar una sesión: mejor peso por [ejercicio + reps].
// Idempotente por construcción: mismo estado → mismas filas.
export const bestPRsFromSets = (sets: WorkoutSet[]): PRRecord[] => [...bestByRep(sets).values()]

// Indica si una serie de trabajo supera el récord del mismo ejercicio y reps.
// Un calentamiento, una serie fuera de rango o sin fuerza nunca es PR.
export const isPR = (
  weightKg: number,
  reps: number,
  existingPR: { weightKg: number } | undefined,
  isWarmup = false
): boolean => {
  if (isWarmup) return false
  if (reps < 1 || reps > MAX_E1RM_REPS || weightKg <= 0) return false
  if (!existingPR) return true
  return weightKg > existingPR.weightKg
}
