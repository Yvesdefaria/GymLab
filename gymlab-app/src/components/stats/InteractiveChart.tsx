// InteractiveChart: wrapper que añade goal/comparison lines y tap-to-drill-down a charts Recharts.
import { useCallback, type ReactNode } from 'react'
import { ReferenceLine, Tooltip } from 'recharts'
import { AnimatedAreaChart, AnimatedBarChart } from './AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { tooltipStyle } from './chartStyle'

type ComparisonPoint = { date: string; [key: string]: string | number }

type InteractiveAreaProps = {
  data: Record<string, unknown>[]
  height?: number
  label?: string
  margin?: { top?: number; right?: number; left?: number; bottom?: number }
  goalValue?: number
  goalLabel?: string
  averageValue?: number
  averageLabel?: string
  comparisonData?: ComparisonPoint[]
  comparisonKey: string
  onDotClick?: (data: Record<string, unknown>) => void
  children: ReactNode
}

export const InteractiveAreaChart = ({
  data,
  height = 220,
  label,
  margin = { top: 8, right: 4, left: 0, bottom: 0 },
  goalValue,
  goalLabel = 'Objetivo',
  averageValue,
  averageLabel = 'Promedio',
  comparisonData,
  comparisonKey,
  onDotClick,
  children,
}: InteractiveAreaProps) => {
  const colors = useThemeColors()

  // Merge comparison data into main data for ghost line
  const mergedData = comparisonData
    ? data.map((d, i) => ({
        ...d,
        [`_comp_${comparisonKey}`]: comparisonData[i]?.[comparisonKey],
      }))
    : data

  const handleClick = useCallback(
    (state?: { activePayload?: Array<{ payload: Record<string, unknown> }> }) => {
      if (state?.activePayload?.[0] && onDotClick) {
        onDotClick(state.activePayload[0].payload)
      }
    },
    [onDotClick],
  )

  return (
    <div onClick={() => handleClick()}>
      <AnimatedAreaChart data={mergedData} height={height} label={label} margin={margin}>
        {children}
        {/* Comparison ghost line */}
        {comparisonData && (
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
          />
        )}
        {/* Goal line */}
        {goalValue != null && (
          <ReferenceLine
            y={goalValue}
            stroke={colors.gold}
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: goalLabel,
              position: 'right',
              fill: colors.gold,
              fontSize: 10,
              fontWeight: 600,
            }}
          />
        )}
        {/* Average line */}
        {averageValue != null && (
          <ReferenceLine
            y={averageValue}
            stroke={colors.muted}
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: averageLabel,
              position: 'right',
              fill: colors.muted,
              fontSize: 10,
            }}
          />
        )}
      </AnimatedAreaChart>
    </div>
  )
}

type InteractiveBarProps = {
  data: Record<string, unknown>[]
  height?: number
  label?: string
  margin?: { top?: number; right?: number; left?: number; bottom?: number }
  layout?: 'horizontal' | 'vertical'
  goalValue?: number
  goalLabel?: string
  onBarClick?: (data: Record<string, unknown>) => void
  children: ReactNode
}

export const InteractiveBarChart = ({
  data,
  height = 240,
  label,
  margin = { top: 4, right: 4, left: 0, bottom: 4 },
  layout = 'horizontal',
  goalValue,
  goalLabel: _goalLabel,
  onBarClick: _onBarClick,
  children,
}: InteractiveBarProps) => {
  const colors = useThemeColors()

  return (
    <AnimatedBarChart
      data={data}
      height={height}
      label={label}
      margin={margin}
      layout={layout}
    >
      {children}
      {goalValue != null && layout === 'horizontal' && (
        <ReferenceLine
          y={goalValue}
          stroke={colors.gold}
          strokeDasharray="6 4"
          strokeWidth={1.5}
        />
      )}
    </AnimatedBarChart>
  )
}
