import type { FatigueLevel, MuscleGroup, Workout, WorkoutSet, Exercise } from './types'
import { diffLocalDays, toLocalDateStr } from './dates'

export const fatigueFromHours = (hoursSince: number | null): FatigueLevel => {
  if (hoursSince === null) return 'fresh'
  if (hoursSince < 18) return 'sore'
  if (hoursSince < 48) return 'fatigued'
  if (hoursSince < 72) return 'warm'
  return 'fresh'
}

export const lastTrainedByMuscle = (
  workouts: Workout[],
  sets: WorkoutSet[],
  exercises: Pick<Exercise, 'id' | 'muscleGroup'>[]
): Partial<Record<MuscleGroup, string>> => {
  const exMap = new Map(exercises.map((e) => [e.id, e.muscleGroup]))
  const workoutDate = new Map(workouts.map((w) => [w.id, w.localDate || toLocalDateStr(new Date(w.startedAt))]))
  const last: Partial<Record<MuscleGroup, string>> = {}

  for (const s of sets) {
    if (!s.completed) continue
    const mg = exMap.get(s.exerciseId)
    if (!mg) continue
    const date = workoutDate.get(s.workoutId)
    if (!date) continue
    const prev = last[mg]
    if (!prev || date > prev) last[mg] = date
  }
  return last
}

export const fatigueMap = (
  lastByMuscle: Partial<Record<MuscleGroup, string>>,
  now = new Date()
): Partial<Record<MuscleGroup, FatigueLevel>> => {
  const today = toLocalDateStr(now)
  const result: Partial<Record<MuscleGroup, FatigueLevel>> = {}
  for (const [mg, date] of Object.entries(lastByMuscle) as [MuscleGroup, string][]) {
    const days = diffLocalDays(date, today)
    const hours = days * 24 + now.getHours()
    result[mg] = fatigueFromHours(hours)
  }
  return result
}

export const fatigueLabel: Record<FatigueLevel, string> = {
  fresh: 'Recuperado',
  warm: 'Activo',
  fatigued: 'Fatigado',
  sore: 'Muy reciente',
}

export const fatigueColorClass: Record<FatigueLevel, string> = {
  fresh: 'fill-muted/40 stroke-border',
  warm: 'fill-accent/30 stroke-accent/60',
  fatigued: 'fill-cta/50 stroke-cta',
  sore: 'fill-success/40 stroke-success',
}
