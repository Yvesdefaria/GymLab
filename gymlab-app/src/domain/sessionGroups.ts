// Agrupación de superseries en la sesión activa: ejercicios consecutivos que comparten grupo.
export interface ExerciseGroup<T> {
  key: string
  label: string | null
  exercises: T[]
}

// Agrupa ejercicios consecutivos con el mismo superset (null = ejercicio suelto).
export const groupExercises = <
  T extends { exerciseId: number; supersetGroup?: string; sets: { completed: boolean }[] },
>(
  exercises: T[]
): ExerciseGroup<T>[] => {
  const groups: ExerciseGroup<T>[] = []
  for (const ex of exercises) {
    const label = ex.supersetGroup ?? null
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.exercises.push(ex)
    } else {
      groups.push({ key: label ?? `solo-${ex.exerciseId}`, label, exercises: [ex] })
    }
  }
  return groups
}

// Un grupo (superset) está completo solo si todos sus ejercicios tienen todas las series hechas.
export const isGroupComplete = <T extends { sets: { completed: boolean }[] }>(
  g: ExerciseGroup<T>
): boolean =>
  g.exercises.every((ex) => ex.sets.length > 0 && ex.sets.every((s) => s.completed))