// Guardas numéricas para sanear entradas y evitar valores inválidos en cálculos.
// Limita un valor a [min, max]; NaN cae al mínimo para no propagar inválidos a los cálculos.
export const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

// Porcentaje 0-100 seguro: comparte la guarda de NaN de clamp (barras de
// progreso, anillos y heatmaps que recortan el % mostrado a 100).
export const clampPercent = (value: number): number => clamp(value, 0, 100)

// Resultado explícito del parser decimal: nunca se confunde un texto inválido
// con el número 0 (a diferencia de `Number('')`/`parseFloat('abc')`).
export type DecimalParse =
  | { ok: true; value: number }
  | { ok: false; error: 'empty' | 'invalid' }

// Parser decimal compartido: acepta ',' o '.' como separador, recorta espacios
// y devuelve un resultado inválido explícito para texto vacío o no numérico.
export const parseDecimal = (raw: string): DecimalParse => {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: false, error: 'empty' }
  // Solo se reemplaza el primer separador: entradas con varios ('1,2,3') quedan
  // como NaN y se rechazan en vez de interpretarse parcialmente.
  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value)) return { ok: false, error: 'invalid' }
  return { ok: true, value }
}
