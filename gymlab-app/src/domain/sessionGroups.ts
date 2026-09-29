// Agrupación de superseries en la sesión activa: solo se agrupan ejercicios consecutivos que
// comparten un superset (mismo label no nulo); cada ejercicio suelto es su propio grupo.
export interface ExerciseGroup<T> {
  key: string
  label: string | null
  exercises: T[]
}

// Agrupa ejercicios consecutivos con el mismo superset; cada suelto (sin grupo) va por separado.
export const groupExercises = <
  T extends { exerciseId: number; supersetGroup?: string; sets: { completed: boolean }[] },
>(
  exercises: T[]
): ExerciseGroup<T>[] => {
  const groups: ExerciseGroup<T>[] = []
  for (const ex of exercises) {
    const label = ex.supersetGroup ?? null
    const last = groups[groups.length - 1]
    if (last && label !== null && last.label === label) {
      last.exercises.push(ex)
    } else {
      groups.push({ key: label ?? `solo-${ex.exerciseId}`, label, exercises: [ex] })
    }
  }
  return groups
}

// Identidad única por grupo (R3-001): `key` no lo es — dos sueltos consecutivos del mismo
// ejercicio comparten `solo-<id>`, y dos supersets con el mismo label separados por otro grupo
// comparten label. Sufija las repeticiones (#2, #3…) hasta obtener una clave no usada —el label
// de superserie es texto libre, así que una etiqueta literal «A#2» también puede chocar—; sin
// repeticiones devuelve las claves originales sin cambios.
export const uniqueGroupKeys = <T>(groups: ExerciseGroup<T>[]): string[] => {
  const used = new Set<string>()
  return groups.map((group) => {
    let candidate = group.key
    let occurrence = 1
    while (used.has(candidate)) {
      occurrence += 1
      candidate = `${group.key}#${occurrence}`
    }
    used.add(candidate)
    return candidate
  })
}

// Un grupo (superset) está completo solo si todos sus ejercicios tienen todas las series hechas.
export const isGroupComplete = <T extends { sets: { completed: boolean }[] }>(
  g: ExerciseGroup<T>
): boolean =>
  g.exercises.every((ex) => ex.sets.length > 0 && ex.sets.every((s) => s.completed))

// Índice del primer grupo incompleto: punto de arranque del carrusel. Con todos completos
// o sin grupos devuelve 0 (el carrusel no se monta si la sesión no tiene ejercicios).
export const firstIncompleteGroupIndex = <T extends { sets: { completed: boolean }[] }>(
  groups: ExerciseGroup<T>[]
): number => {
  const index = groups.findIndex((group) => !isGroupComplete(group))
  return index === -1 ? 0 : index
}

// Índice del primer grupo incompleto DESPUÉS de `from`; null si no queda ninguno
// (el auto-avance no se mueve, igual que F34c cuando no hay destino).
export const nextIncompleteGroupIndex = <T extends { sets: { completed: boolean }[] }>(
  groups: ExerciseGroup<T>[],
  from: number
): number | null => {
  for (let index = from + 1; index < groups.length; index++) {
    if (!isGroupComplete(groups[index])) return index
  }
  return null
}

// Reajusta el índice activo tras quitar grupos: el grupo que ocupó el lugar del eliminado
// (siguiente) o, si era el último, el anterior. Sin grupos válidos devuelve 0.
export const clampGroupIndex = (index: number, groupCount: number): number =>
  Math.max(0, Math.min(index, groupCount - 1))