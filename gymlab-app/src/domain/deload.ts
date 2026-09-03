// Lógica de la semana de descarga (deload) del programa activo.
import { toLocalDateStr } from './dates'
import type { Workout, WorkoutSet, ActiveProgram } from './types'
import { detectDeloadSignal } from './progress'
import { calcStreak } from './streak'

export const DELOAD_WEEK_DAYS = 7

// Umbral de score a partir del cual se recomienda activar el deload (0-100).
export const DELOAD_SCORE_THRESHOLD = 60

// Fecha de fin de la deload: hoy + 7 días.
export const deloadUntilDate = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + DELOAD_WEEK_DAYS)
  return toLocalDateStr(d)
}

// La deload está activa si está marcada y la fecha límite aún no ha pasado; sin fecha, se considera indefinida.
export const isDeloadActive = (
  active: boolean | undefined,
  until: string | null | undefined
): boolean => {
  if (!active) return false
  if (!until) return true
  return new Date(`${until}T23:59:59`).getTime() >= Date.now()
}

// Señales individuales que alimentan el score de deload (cada una puntúa de 0 a su tope).
export interface DeloadSignals {
  volumeDrop: number // 0-30: caída ≥15% del volumen medio semanal
  sustainedHighRpe: number // 0-25: RPE promedio ≥8 en la última semana
  performanceDrop: number // 0-25: repeticiones completadas bajan vs objetivo
  consecutiveWeeks: number // 0-10: >8 semanas seguidas entrenando
  programScheduled: number // 0-10: la semana del programa activo coincide con deloadWeek
}

// Score total (0-100) de la decisión de deload + señales desglosadas.
export interface DeloadScore {
  overall: number
  suggestsDeload: boolean
  signals: DeloadSignals
}

// Media ponderada de RPE de los sets de la última semana (evita inflar por sets sueltos).
const recentAvgRpe = (sets: WorkoutSet[], days = 7): number => {
  const cutoff = Date.now() - days * 86_400_000
  const recent = sets.filter((s) => new Date(s.createdAt).getTime() >= cutoff && s.rpe != null)
  if (recent.length === 0) return 0
  return recent.reduce((a, s) => a + (s.rpe ?? 0), 0) / recent.length
}

// Nº de semanas completadas desde el inicio del programa activo (1-indexada).
const currentProgramWeek = (program: ActiveProgram): number => {
  const start = new Date(`${program.startDate}T00:00:00`)
  const diff = Math.floor((Date.now() - start.getTime()) / (7 * 86_400_000))
  return Math.max(1, diff + 1)
}

// Semanas consecutivas cumplidas (racha larga de semanas con ≥3 sesiones).
const streakWeeks = (workouts: Workout[]): number => {
  const dates = workouts.map((w) => w.startedAt)
  return calcStreak(dates).currentStreak
}

/** Combina las señales recientes en un score 0-100 de recomendación de deload.
 *  `programWeek` opcional fuerza el nº de semana del programa (para tests); si no,
 *  se deriva del `startDate` del programa activo. */
export const calcDeloadScore = (
  workouts: Workout[],
  sets: WorkoutSet[],
  program: ActiveProgram,
  programWeek?: number
): DeloadScore => {
  const signal = detectDeloadSignal(workouts)

  let volumeDrop = 0
  if (signal?.suggestsDeload) volumeDrop = 30

  const avgRpe = recentAvgRpe(sets)
  let sustainedHighRpe = 0
  if (avgRpe >= 8) sustainedHighRpe = 25

  // Caída de rendimiento: el nº medio de reps y sets completados en la última semana
  // frente a la anterior se estima por la evolución del volumen diario (proxy).
  let performanceDrop = 0
  const DAY = 86_400_000
  const now = Date.now()
  const recentSets = sets.filter((s) => new Date(s.createdAt).getTime() >= now - 7 * DAY)
  const olderSets = sets.filter((s) => {
    const t = new Date(s.createdAt).getTime()
    return t >= now - 14 * DAY && t < now - 7 * DAY
  })
  if (recentSets.length >= 2 && olderSets.length >= 2) {
    const recentReps = recentSets.reduce((a, s) => a + s.reps, 0) / recentSets.length
    const olderReps = olderSets.reduce((a, s) => a + s.reps, 0) / olderSets.length
    if (olderReps > 0 && recentReps >= 0 && recentReps <= olderReps * 0.9) performanceDrop = 25
  }

  let consecutiveWeeks = 0
  const streak = streakWeeks(workouts)
  if (streak > 8) consecutiveWeeks = 10

  let programScheduled = 0
  const week = programWeek ?? currentProgramWeek(program)
  if (program.deloadWeek && week % program.deloadWeek === 0) programScheduled = 10

  const overall = Math.min(
    100,
    volumeDrop + sustainedHighRpe + performanceDrop + consecutiveWeeks + programScheduled
  )

  return {
    overall,
    suggestsDeload: overall >= DELOAD_SCORE_THRESHOLD,
    signals: { volumeDrop, sustainedHighRpe, performanceDrop, consecutiveWeeks, programScheduled },
  }
}

// Guía por serie: peso sugerido reducido durante la semana de deload.
export interface DeloadGuidance {
  setId: string
  weightKg: number
  suggestedWeightKg: number
  reductionPct: number
}

// Redondea a un múltiplo de 0.5 kg.
const roundToHalf = (n: number): number => Math.round(n * 2) / 2

/** Sugiere un peso reducido (por defecto 10%) por serie durante el deload.
 *  Las series de peso corporal (0 kg) se mantienen sin cambio (sugerido = 0). */
export const generateDeloadGuidance = (
  sets: WorkoutSet[],
  reductionPct = 10
): DeloadGuidance[] => {
  const factor = 1 - reductionPct / 100
  return sets.map((s) => ({
    setId: String(s.id),
    weightKg: s.weightKg,
    suggestedWeightKg: roundToHalf(s.weightKg * factor),
    reductionPct,
  }))
}

// Peso sugerido reducido para un único valor de carga (visible por serie en la sesión durante el deload).
export const deloadSuggestedWeight = (weightKg: number, reductionPct = 10): number =>
  weightKg > 0 ? roundToHalf(weightKg * (1 - reductionPct / 100)) : 0

// Progreso del día (1..7) dentro de la semana de deload. `until` es el último día de la semana;
// recién activada (until = hoy + 7) es el día 1, y un día antes de terminar es el día 7.
export const deloadDayProgress = (until?: string | null): number => {
  if (!until) return 1
  const end = new Date(`${until}T00:00:00`)
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)
  const daysRemaining = Math.round((end.getTime() - today.getTime()) / 86_400_000)
  const day = DELOAD_WEEK_DAYS - daysRemaining + 1
  return Math.min(7, Math.max(1, day))
}
