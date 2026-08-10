// Estilos y helpers compartidos para los gráficos Recharts — mobile-first, accesibles y legibles.
import type { ThemeColors } from '@/hooks/useThemeColors'

// Caja del tooltip alineada con el tema (fondo elevado, borde y radio, texto suficientemente grande).
export const tooltipStyle = (colors: ThemeColors) => ({
  backgroundColor: colors.bgElevated,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  color: colors.fg,
  fontSize: 13,
  padding: '8px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
})

// Texto de los ticks de los ejes: color muted y 11px (legible en móvil sin ocupar demasiado).
export const axisTick = (colors: ThemeColors) => ({
  fill: colors.muted,
  fontSize: 11,
})

// Espaciado de barras optimizado para móvil: suficiente separación entre barras para legibilidad.
export const mobileBarGap = { barCategoryGap: '20%' as const }

// Configuración del eje X para móvil: oculta la línea, espaciado mínimo entre ticks para
// evitar solapamiento, y permite a Recharts auto-saltar ticks cuando no caben.
export const mobileXAxis = {
  axisLine: false as const,
  tickLine: false as const,
  minTickGap: 12,
  interval: 'preserveStartEnd' as const,
}

// Configuración del eje Y para móvil: oculta líneas y datos muy anchos no ocupan espacio.
export const mobileYAxis = {
  axisLine: false as const,
  tickLine: false as const,
  width: 36,
}