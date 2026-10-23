// Gráfica semanal de /pasos (dirección C): barras por día de la semana actual,
// sin tarjeta, con línea de meta y estado vacío. Se conserva el comportamiento
// de la gráfica original (Recharts + wrapper animado).
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, Cell, ReferenceLine, XAxis } from 'recharts'
import { AnimatedBarChart } from '../stats/AnimatedCharts'
import { ChartTooltip } from '../stats/ChartTooltip'
import { axisTick } from '../stats/chartStyle'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { AppLanguage } from '@/domain/onboarding'
import type { DailyStepsEntry } from '@/domain/types'
import { toLocalDateStr } from '@/domain/dates'
import { formatDayShort, formatStepNumber, weekdayLetters } from '@/lib/intl'
import { buildWeekSeries } from './stepSeries'
import { StepChartSection } from './StepChartSection'
import { StepEmptyState } from './StepEmptyState'

type StepWeekChartProps = {
  week: DailyStepsEntry[]
  goal: number
}

export const StepWeekChart = memo(function StepWeekChart({ week, goal }: StepWeekChartProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const today = toLocalDateStr()

  const series = useMemo(
    () => buildWeekSeries(week, today, weekdayLetters(lang, 1)),
    [week, today, lang],
  )
  const total = useMemo(() => week.reduce((sum, entry) => sum + entry.steps, 0), [week])

  const range =
    series.length > 0
      ? `${formatDayShort(series[0].date, lang)} – ${formatDayShort(series[6].date, lang)}`
      : undefined

  return (
    <StepChartSection
      title={t('steps.weekSection')}
      meta={range}
      value={total > 0 ? formatStepNumber(total, lang) : undefined}
      valueLabel={total > 0 ? t('steps.statSteps') : undefined}
    >
      {total <= 0 ? (
        <StepEmptyState title={t('steps.weekEmpty')} text={t('steps.weekEmptyText')} />
      ) : (
        <div
          role="img"
          aria-label={t('steps.weekSub', { count: formatStepNumber(total, lang) })}
        >
          <AnimatedBarChart
            height={110}
            data={series}
            margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              interval={0}
              tick={axisTick(colors)}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine
              y={goal}
              stroke={colors.gold}
              strokeDasharray="5 5"
              strokeOpacity={0.55}
            />
            <ChartTooltip
              colors={colors}
              cursor={false}
              labelFormatter={(_, payload) =>
                formatDayShort(payload[0]?.payload?.date ?? '', lang)
              }
              formatter={(value) => [formatStepNumber(Number(value), lang), t('steps.statSteps')]}
            />
            <Bar dataKey="steps" radius={[6, 6, 0, 0]} maxBarSize={22}>
              {series.map((point) => (
                <Cell
                  key={point.date}
                  fill={point.isToday ? colors.goldBright : colors.gold}
                />
              ))}
            </Bar>
          </AnimatedBarChart>
        </div>
      )}
    </StepChartSection>
  )
})
