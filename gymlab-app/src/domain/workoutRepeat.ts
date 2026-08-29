// Reconstruye una sesión a partir de la última sesión guardada de un día ("Repetir última sesión").
// Devuelve los ítems por ejercicio listos para cargar en la sesión activa (shape estructural, sin
// importar el store: domain puro).

// Serie histórica tal como la guarda el workout (base para repetir con los mismos pesos/reps).
export interface RepeatSetInput {
  exerciseId: number
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
  isWarmup?: boolean
  rpe?: number | null
  rir?: number | null
  supersetGroup?: string | null
  durationSeconds?: number
  distanceMeters?: number | null
}

export interface RepeatSessionSet {
  id: string
  exerciseId: number
  exerciseName: string
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
  isWarmup?: boolean
  rpe?: number
  rir?: number
  supersetGroup?: string
  durationSeconds?: number
  distanceMeters?: number
}

export interface RepeatSessionItem {
  exerciseId: number
  exerciseName: string
  sets: RepeatSessionSet[]
}

// Agrupa las series por ejercicio y las devuelve listas para cargar en la sesión: mismas
// cargas y flags de la última sesión, pero sin marcar nada como completado (`nameOf` resuelve
// el nombre del ejercicio, con fallback `Ejercicio <id>` si no hay coincidencia).
export const buildRepeatItems = (
  sets: RepeatSetInput[],
  nameOf: (exerciseId: number) => string | undefined
): RepeatSessionItem[] => {
  const grouped = new Map<number, RepeatSetInput[]>()
  for (const s of sets) {
    const group = grouped.get(s.exerciseId) ?? []
    group.push(s)
    grouped.set(s.exerciseId, group)
  }
  const ts = Date.now()
  return [...grouped.entries()].map(([exerciseId, groupSets]) => {
    const exerciseName = nameOf(exerciseId) ?? `Ejercicio ${exerciseId}`
    return {
      exerciseId,
      exerciseName,
      sets: groupSets.map((s) => ({
        id: `repeat-${ts}-${exerciseId}-${s.setNumber}`,
        exerciseId: s.exerciseId,
        exerciseName,
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps,
        completed: false,
        isWarmup: s.isWarmup,
        rpe: s.rpe ?? undefined,
        rir: s.rir ?? undefined,
        supersetGroup: s.supersetGroup ?? undefined,
        durationSeconds: s.durationSeconds,
        distanceMeters: s.distanceMeters ?? undefined,
      })),
    }
  })
}