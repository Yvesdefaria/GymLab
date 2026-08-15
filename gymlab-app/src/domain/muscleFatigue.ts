// Cálculo del nivel de fatiga por grupo muscular según cuándo se entrenó por última vez.
import type { FatigueLevel, MuscleGroup, Workout, WorkoutSet, Exercise } from './types'
import { diffLocalDays, localDateOf, toLocalDateStr } from './dates'

// Traduce horas desde el último entreno a un nivel de fatiga (umbrales empíricos en horas).
export const fatigueFromHours = (hoursSince: number | null): FatigueLevel => {
  if (hoursSince === null) return 'fresh'
  if (hoursSince < 18) return 'sore'
  if (hoursSince < 48) return 'fatigued'
  if (hoursSince < 72) return 'warm'
  return 'fresh'
}

// Última fecha de entreno por grupo muscular, a partir de las series completadas.
export const lastTrainedByMuscle = (
  workouts: Workout[],
  sets: WorkoutSet[],
  exercises: Pick<Exercise, 'id' | 'muscleGroup'>[]
): Partial<Record<MuscleGroup, string>> => {
  const exMap = new Map(exercises.map((e) => [e.id, e.muscleGroup]))
  const workoutDate = new Map(workouts.map((w) => [w.id, localDateOf(w)]))
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

// Mapa grupo muscular → nivel de fatiga a día de hoy, estimando horas desde el último entreno.
export const fatigueMap = (
  lastByMuscle: Partial<Record<MuscleGroup, string>>,
  now = new Date()
): Partial<Record<MuscleGroup, FatigueLevel>> => {
  const today = toLocalDateStr(now)
  const result: Partial<Record<MuscleGroup, FatigueLevel>> = {}
  for (const [mg, date] of Object.entries(lastByMuscle) as [MuscleGroup, string][]) {
    const days = diffLocalDays(date, today)
    // Horas aproximadas: días completos transcurridos más la hora actual (suficiente para el nivel).
    const hours = days * 24 + now.getHours()
    result[mg] = fatigueFromHours(hours)
  }
  return result
}

// Etiqueta de UI por nivel de fatiga.
export const fatigueLabel: Record<FatigueLevel, string> = {
  fresh: 'Recuperado',
  warm: 'Activo',
  fatigued: 'Fatigado',
  sore: 'Muy reciente',
}

// Clases Tailwind de color por nivel de fatiga, para pintar el mapa muscular.
export const fatigueColorClass: Record<FatigueLevel, string> = {
  fresh: 'fill-muted/40 stroke-border',
  warm: 'fill-accent/30 stroke-accent/60',
  fatigued: 'fill-cta/50 stroke-cta',
  sore: 'fill-success/40 stroke-success',
}
