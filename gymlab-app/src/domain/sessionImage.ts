// Exportar sesión como imagen: prepara datos para renderizar en canvas.
import type { Workout, WorkoutSet } from './types'

export interface SessionImageData {
  date: string
  duration: string
  volume: number
  exercises: { name: string; sets: number; weight: number }[]
  prCount: number
  appName: string
}

// Prepara datos de sesión para exportar como imagen.
export const prepareSessionImage = (
  workout: Workout,
  sets: WorkoutSet[],
  exerciseNames: Map<number, string>,
  prCount: number,
): SessionImageData => {
  // Calcular duración.
  const startMs = new Date(workout.startedAt).getTime()
  const endMs = workout.finishedAt ? new Date(workout.finishedAt).getTime() : Date.now()
  const durationMin = Math.round((endMs - startMs) / 60000)

  // Agrupar series por ejercicio.
  const byExercise = new Map<number, WorkoutSet[]>()
  for (const s of sets) {
    if (!s.completed) continue
    const list = byExercise.get(s.exerciseId) ?? []
    list.push(s)
    byExercise.set(s.exerciseId, list)
  }

  const exercises = Array.from(byExercise.entries()).map(([exId, exSets]) => ({
    name: exerciseNames.get(exId) ?? `Ejercicio ${exId}`,
    sets: exSets.length,
    weight: Math.max(...exSets.map((s) => s.weightKg)),
  }))

  return {
    date: workout.localDate,
    duration: `${durationMin} min`,
    volume: workout.totalVolume,
    exercises,
    prCount,
    appName: 'GymLab',
  }
}
