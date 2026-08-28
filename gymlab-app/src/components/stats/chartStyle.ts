// Mapa único de la infraestructura de gráficos Recharts (Fase 91 · WP5).
// - `tooltipStyle` / `axisTick`: estilos base del tooltip y de los ticks de ejes.
// - `mobileXAxis` / `mobileYAxis` / `mobileBarGap`: contrato de ejes/barras para móvil.
// - `ChartTooltip` (`./ChartTooltip`): tooltip con estilos aplicados; única fuente del aspecto
//   del tooltip, con métricas/formatters específicos de cada gráfico vía props.
// - `ChartCard` (`./ChartCard`): tarjeta/titular único que envuelve los gráficos.
// - `AnimatedCharts` (`./AnimatedCharts`): wrappers animados (Area/Bar/Donut);
//   `DrillDownPanel` (`./DrillDownPanel`): drill-down compartido.
// - `Sparkline` (`@/components/ui/Sparkline`): mini-gráfico SVG inline de tendencia (home), único en su estilo.
import type { ThemeColors } from '@/hooks/useThemeColors'

// Caja del tooltip glassmorphic con backdrop blur y borde dorado sutil.
export const tooltipStyle = (colors: ThemeColors) => ({
  backgroundColor: `color-mix(in srgb, ${colors.bgElevated} 85%, transparent)`,
  border: `1px solid color-mix(in srgb, ${colors.gold} 25%, ${colors.border})`,
  borderRadius: '12px',
  color: colors.fg,
  fontSize: 13,
  padding: '8px 12px',
  boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
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