// Exportar sesión como imagen: prepara datos para renderizar en canvas.
import type { Workout, WorkoutSet } from './types'

export interface SessionImageData {
  date: string
  duration: string
  volume: number
  exercises: { name: string; sets: number; weight: number }[]
  prCount: number
  appName: string
  // Nombre visible del entreno (título de rutina o etiqueta genérica localizada);
  // lo resuelve el llamador antes de pintar (el dominio se mantiene puro).
  workoutName: string
}

// Plantillas de tarjeta disponibles; labelKey se traduce como share.template.<id>.
export type PhotoTemplateId = 'classic' | 'hero' | 'compact'

// Unión de literales de las claves i18n para que t() las tipifique sin que el
// dominio importe i18n (sigue siendo TypeScript puro).
export type PhotoTemplateLabelKey =
  | 'share.template.classic'
  | 'share.template.hero'
  | 'share.template.compact'

export const DEFAULT_PHOTO_TEMPLATE: PhotoTemplateId = 'classic'

export const SESSION_IMAGE_TEMPLATES: ReadonlyArray<{ id: PhotoTemplateId; labelKey: PhotoTemplateLabelKey }> = [
  { id: 'classic', labelKey: 'share.template.classic' },
  { id: 'hero', labelKey: 'share.template.hero' },
  { id: 'compact', labelKey: 'share.template.compact' },
]

// Nombre a mostrar en la foto: título de rutina, o la etiqueta genérica localizada
// cuando la sesión no tiene rutina o no se encontró su título.
export const resolveWorkoutName = (
  routineTitle: string | null | undefined,
  fallbackLabel: string
): string => (routineTitle && routineTitle.trim() !== '' ? routineTitle : fallbackLabel)

// Prepara datos de sesión para exportar como imagen.
export const prepareSessionImage = (
  workout: Workout,
  sets: WorkoutSet[],
  exerciseNames: Map<number, string>,
  prCount: number,
  workoutName = '',
): SessionImageData => {
  const startMs = new Date(workout.startedAt).getTime()
  const endMs = workout.finishedAt ? new Date(workout.finishedAt).getTime() : Date.now()
  const durationMin = Math.round((endMs - startMs) / 60000)

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
    workoutName,
  }
}
