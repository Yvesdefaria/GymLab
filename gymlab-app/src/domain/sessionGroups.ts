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
// Precondición: `from` >= -1 (la búsqueda arranca en from+1); con `from` fuera de rango
// devuelve null.
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
// Precondición: `groupCount` >= 1 — con 0 (carrusel desmontado) devuelve 0.
export const clampGroupIndex = (index: number, groupCount: number): number =>
  Math.max(0, Math.min(index, groupCount - 1))

// Huella estable de un grupo: ids de TODAS sus series en orden de render. El renombre por
// colisión de keys (sufijos `#n` sobre labels repetidos) no la toca; solo cambia si el
// grupo cambia de composición (series agregadas o quitadas). Es la identidad que distingue
// «el mismo grupo siguió» de «otro grupo ocupa ahora esta key» sin adivinar por el texto
// de la key (los labels de superserie son texto libre y pueden contener `#2`).
export const groupFingerprint = <T extends { sets: { id: string }[] }>(
  group: ExerciseGroup<T>
): string => group.exercises.flatMap((ex) => ex.sets.map((s) => s.id)).join('|')

// Firma estable del estado del carrusel (F120/CAR-1): composición (claves únicas) +
// completitud + huella por grupo. El efecto de auto-avance depende de este string en vez
// de `groups` por identidad, así teclear una serie no reconstruye el mapa de transiciones
// (la firma solo cambia al completar/descompletar, al cambiar la estructura de grupos o al
// cambiar la composición de un grupo — p. ej. agregar/quitar una serie).
export const groupsCompletionSignature = <T extends { sets: { id: string; completed: boolean }[] }>(
  groups: ExerciseGroup<T>[],
  groupKeys: string[]
): string =>
  groups
    .map(
      (group, index) =>
        `${groupKeys[index] ?? ''}:${isGroupComplete(group) ? 1 : 0}:${groupFingerprint(group)}`
    )
    .join('|')

// Fila persistida entre renders por key: completitud del grupo + huella del ocupante.
// La huella distingue «el mismo grupo siguió bajo esta key» de «otro grupo ocupa ahora
// esta key» (renombre por borrado/colisión de duplicados): solo con la MISMA huella la
// transición incompleto→completo es atribuible (113b/R3-001). Las keys intactas siguen
// avanzando aunque en el mismo pase otra familia se borre o renombre (113.R3-002).
export interface CompletionRow {
  complete: boolean
  fingerprint: string
}

// Decisión PURA del auto-avance (F34c + 113b): con el mapa del render anterior, devuelve
// el índice del próximo grupo incompleto al que deslizar (o null) y el mapa del render
// actual, listo para persistir en el ref. Es la lógica que ejercía el efecto de
// `SessionCarousel`, extraída para poder probarla sin montar el componente (113a).
// Reglas: avanza en la transición incompleto→completo de un grupo con huella IDÉNTICA a
// la de la fila previa de su key; un solo avance por pase; un grupo nuevo (sin fila
// previa) no avanza.
export const nextAutoAdvance = <T extends { sets: { id: string; completed: boolean }[] }>(
  previous: ReadonlyMap<string, CompletionRow>,
  groups: ExerciseGroup<T>[],
  groupKeys: string[]
): { target: number | null; current: Map<string, CompletionRow> } => {
  const current = new Map<string, CompletionRow>()
  for (let index = 0; index < groups.length; index += 1) {
    current.set(groupKeys[index], {
      complete: isGroupComplete(groups[index]),
      fingerprint: groupFingerprint(groups[index]),
    })
  }
  for (let index = 0; index < groups.length; index += 1) {
    const key = groupKeys[index]
    const before = previous.get(key)
    const after = current.get(key)
    // Grupo nuevo (sin fila previa) o key reocupada por otro grupo (huella distinta):
    // la transición no es atribuible.
    if (before === undefined || after === undefined) continue
    if (before.fingerprint !== after.fingerprint) continue
    if (before.complete !== false || !after.complete) continue
    const target = nextIncompleteGroupIndex(groups, index)
    if (target !== null) return { target, current }
  }
  return { target: null, current }
}
