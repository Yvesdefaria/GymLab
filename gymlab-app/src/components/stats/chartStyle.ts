// Estilos compartidos (tooltip y ticks de ejes) para los gráficos Recharts, usando los tokens del tema.
import type { ThemeColors } from '@/hooks/useThemeColors'

// Caja del tooltip alineada con el tema (fondo elevado, borde y radio).
export const tooltipStyle = (colors: ThemeColors) => ({
  backgroundColor: colors.bgElevated,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  color: colors.fg,
  fontSize: 12,
})

// Texto de los ticks de los ejes: color muted y tamaño fijo.
export const axisTick = (colors: ThemeColors) => ({
  fill: colors.muted,
  fontSize: 11,
})
