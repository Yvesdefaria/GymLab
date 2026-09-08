// Guardas numéricas para sanear entradas y evitar valores inválidos en cálculos.
// Limita un valor a [min, max]; NaN cae al mínimo para no propagar inválidos a los cálculos.
export const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

// Porcentaje 0-100 seguro: comparte la guarda de NaN de clamp (barras de
// progreso, anillos y heatmaps que recortan el % mostrado a 100).
export const clampPercent = (value: number): number => clamp(value, 0, 100)
