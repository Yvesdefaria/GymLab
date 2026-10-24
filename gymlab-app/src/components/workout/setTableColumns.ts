// F132.2/B2 — grilla compartida entre el header del ejercicio y cada serie.
// Orden fijo: # · peso/duración · reps/distancia · [RPE] · [RIR] · check.
// Las columnas de esfuerzo solo existen si el ajuste está encendido y la serie
// no es cardio; así la tabla no deja huecos vacíos.
export const setTableColumns = (showRpe: boolean, showRir: boolean): string => {
  const columns = ['22px', 'minmax(0,1fr)', 'minmax(0,1fr)']
  if (showRpe) columns.push('40px')
  if (showRir) columns.push('40px')
  columns.push('30px')
  return columns.join(' ')
}

export type SetColumnsKey = 'rpe-rir' | 'rpe' | 'rir' | 'none'

export const setColumnsKey = (showRpe: boolean, showRir: boolean): SetColumnsKey => {
  if (showRpe && showRir) return 'rpe-rir'
  if (showRpe) return 'rpe'
  if (showRir) return 'rir'
  return 'none'
}
