// Cálculo del nivel de fatiga por grupo muscular según cuándo se entrenó por última vez.
import type { FatigueLevel, MuscleGroup, Workout, WorkoutSet } from './types'
import { localDateOf } from './dates'

// Traduce horas desde el último entreno a un nivel de fatiga (umbrales empíricos en horas).
export const fatigueFromHours = (hoursSince: number | null): FatigueLevel => {
  if (hoursSince === null) return 'fresh'
  if (hoursSince < 18) return 'sore'
  if (hoursSince < 48) return 'fatigued'
  if (hoursSince < 72) return 'warm'
  return 'fresh'
}

// Horas reales transcurridas entre dos instantes (nunca negativas).
export const hoursSince = (at: Date, now = new Date()): number =>
  Math.max(0, (now.getTime() - at.getTime()) / 3_600_000)

// Instante de fin de una sesión. Si el registro viejo no trae una hora válida,
// cae al mediodía local de su fecha (nunca inventa una hora del día).
const workoutInstant = (workout: Workout): Date => {
  const raw = workout.finishedAt ?? workout.startedAt
  const parsed = raw ? new Date(raw) : new Date(Number.NaN)
  if (!Number.isNaN(parsed.getTime())) return parsed
  return new Date(`${localDateOf(workout)}T12:00:00`)
}

// Último instante de entreno por grupo muscular, a partir de las series completadas.
// `musclesByExercise` es el mapa id→grupo que ya expone la capa única de datos.
export const lastTrainedByMuscle = (
  workouts: Workout[],
  sets: WorkoutSet[],
  musclesByExercise: ReadonlyMap<number, MuscleGroup>
): Partial<Record<MuscleGroup, Date>> => {
  const workoutAt = new Map(workouts.map((w) => [w.id, workoutInstant(w)]))
  const last: Partial<Record<MuscleGroup, Date>> = {}

  for (const s of sets) {
    if (!s.completed) continue
    const mg = musclesByExercise.get(s.exerciseId)
    if (!mg) continue
    const at = workoutAt.get(s.workoutId)
    if (!at) continue
    const prev = last[mg]
    if (!prev || at > prev) last[mg] = at
  }
  return last
}

// Mapa grupo muscular → nivel de fatiga a día de hoy, con las horas reales desde el entreno.
export const fatigueMap = (
  lastByMuscle: Partial<Record<MuscleGroup, Date>>,
  now = new Date()
): Partial<Record<MuscleGroup, FatigueLevel>> => {
  const result: Partial<Record<MuscleGroup, FatigueLevel>> = {}
  for (const [mg, at] of Object.entries(lastByMuscle) as [MuscleGroup, Date][]) {
    result[mg] = fatigueFromHours(hoursSince(at, now))
  }
  return result
}

// Clases Tailwind de color por nivel de fatiga, para pintar el mapa muscular.
// Escala semántica: neutro (recuperado) → dorado (activo/fatigado) → rojo (muy reciente).
// El verde queda reservado a meta/PR/cumplido y no se usa para fatiga.
export const fatigueColorClass: Record<FatigueLevel, string> = {
  fresh: 'fill-muted/25 stroke-border',
  warm: 'fill-gold/25 stroke-gold/60',
  fatigued: 'fill-gold/55 stroke-gold',
  sore: 'fill-danger/35 stroke-danger',
}
