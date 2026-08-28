// ChartTooltip: tooltip Recharts con el estilo compartido de la app (glassmorphic, tonos del tema).
// Es la única fuente del aspecto de los tooltips de gráficos; las métricas/formatters específicos
// de cada gráfico se pasan como props (`formatter`, `labelFormatter`, `cursor`, ...).
import type { ComponentProps } from 'react'
import { Tooltip } from 'recharts'
import type { ThemeColors } from '@/hooks/useThemeColors'
import { tooltipStyle } from './chartStyle'

type ChartTooltipProps = ComponentProps<typeof Tooltip> & { colors: ThemeColors }

export const ChartTooltip = ({ colors, ...rest }: ChartTooltipProps) => (
  <Tooltip
    contentStyle={tooltipStyle(colors)}
    labelStyle={{ color: colors.muted }}
    itemStyle={{ color: colors.fg }}
    {...rest}
  />
)