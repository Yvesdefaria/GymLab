import type { ThemeColors } from '@/hooks/useThemeColors'

export const tooltipStyle = (colors: ThemeColors) => ({
  backgroundColor: colors.bgElevated,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  color: colors.fg,
  fontSize: 12,
})

export const axisTick = (colors: ThemeColors) => ({
  fill: colors.muted,
  fontSize: 11,
})
