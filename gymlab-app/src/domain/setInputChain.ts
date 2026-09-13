// Orden puro de la cadena de foco al pulsar Enter (F98.4, numeric-input R1).
// Deriva el orden del rol del input y del orden de las series — nunca del DOM —
// de modo que el rediseño de la fila (98.5) no puede romper la cadena.
export type SetField = 'weight' | 'reps' | 'rpe' | 'rir'

export interface SetInputRef {
  setId: string
  field: SetField
}

// Campos de una serie de fuerza: RPE y RIR solo existen en modo fuerza.
const fieldsFor = (forceMode: boolean): SetField[] =>
  forceMode ? ['weight', 'reps', 'rpe', 'rir'] : ['weight', 'reps']

// Cadena completa: por cada serie, sus campos en orden de rol.
export const buildSetInputOrder = (
  sets: { id: string }[],
  forceMode: boolean
): SetInputRef[] => {
  const fields = fieldsFor(forceMode)
  const order: SetInputRef[] = []
  for (const set of sets) {
    for (const field of fields) order.push({ setId: set.id, field })
  }
  return order
}

// Clave del registro de refs: `${setId}:${field}`.
export const setInputKey = (setId: string, field: SetField): string =>
  `${setId}:${field}`

// Siguiente input de la cadena; null cuando el actual es el último (debe hacer blur).
// `isFocusable` permite saltar campos no renderizados (p. ej. RPE con showRpe off).
export const nextSetInput = (
  order: SetInputRef[],
  current: SetInputRef,
  isFocusable?: (ref: SetInputRef) => boolean
): SetInputRef | null => {
  const index = order.findIndex(
    (ref) => ref.setId === current.setId && ref.field === current.field
  )
  if (index === -1) return null
  for (let i = index + 1; i < order.length; i++) {
    if (!isFocusable || isFocusable(order[i])) return order[i]
  }
  return null
}
