// Paleta de colores para gráficos derivada de los tokens del tema.
// 9 colores con suficiente contraste entre sí para donuts, barras y áreas.
// Funciona en todas las paletas (gold/energy/crimson/electric/violet/gray) × 2 temas.
import type { ThemeColors } from '@/hooks/useThemeColors'

/** 9 colores de gráficos derivados del tema activo. */
export const chartPalette = (c: ThemeColors): string[] => [
  c.accent,           // color principal (tono dorado de la paleta)
  c.success,          // verde
  '#3b82f6',          // azul estable (no depende de paleta)
  '#a855f7',          // violeta estable
  c.danger,           // rojo peligro
  '#eab308',          // amarillo estable
  '#14b8a6',          // turquesa estable
  '#ec4899',          // rosa estable
  adjustLightness(c.accent, -15), // variante más oscura del accent
]

// Ajusta la luminosidad de un color hex (positivo = más claro, negativo = más oscuro).
function adjustLightness(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = Math.min(255, Math.max(0, parseInt(h.slice(0, 2), 16) + amount))
  const g = Math.min(255, Math.max(0, parseInt(h.slice(2, 4), 16) + amount))
  const b = Math.min(255, Math.max(0, parseInt(h.slice(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/** Alturas estándar para gráficos mobile. */
export const CHART_HEIGHTS = {
  area: 220,
  bar: 240,
  donut: 200,
} as const

/** Ancho del eje Y estándar. */
export const Y_AXIS_WIDTH = 36
