// «Mes por día» (dirección C): área diaria del mes seleccionado, con línea de
// meta y corte en hoy para el mes vigente. Sigue al calendario de actividad.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, ReferenceLine, XAxis } from 'recharts'
import { AnimatedAreaChart } from '../stats/AnimatedCharts'
import { ChartTooltip } from '../stats/ChartTooltip'
import { axisTick } from '../stats/chartStyle'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { AppLanguage } from '@/domain/onboarding'
import type { DailyStepsEntry } from '@/domain/types'
import { buildMonthSeries, getDaysWithData, getMonthTotal } from '@/domain/stepAnalytics'
import { formatDate, formatStepNumber } from '@/lib/intl'
import { StepChartSection } from './StepChartSection'
import { StepEmptyState } from './StepEmptyState'

type StepMonthChartProps = {
  entries: DailyStepsEntry[]
  monthKey: string
  goal: number
  today: string
}

export const StepMonthChart = ({ entries, monthKey, goal, today }: StepMonthChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()

  const series = useMemo(
    () => buildMonthSeries(entries, monthKey, today),
    [entries, monthKey, today],
  )
  const total = getMonthTotal(entries)
  const days = getDaysWithData(entries)
  const rawMonth = formatDate(`${monthKey}-01T12:00:00`, lang, { month: 'long' })
  const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)
  const lastDay = series.at(-1)?.day ?? 1
  const ticks = [1, 5, 10, 15, 20, lastDay].filter(
    (day, index, all) => day <= lastDay && all.indexOf(day) === index,
  )

  return (
    <StepChartSection
      title={t('steps.monthSection')}
      meta={t('steps.monthSub', { month: monthLabel, count: days })}
      value={total > 0 ? formatStepNumber(total, lang) : undefined}
      valueLabel={total > 0 ? t('steps.monthValue') : undefined}
    >
      {total === 0 ? (
        <StepEmptyState title={t('steps.monthEmpty')} text={t('steps.monthEmptyText')} />
      ) : (
        <div
          role="img"
          aria-label={t('steps.monthAria', {
            month: monthLabel,
            total: formatStepNumber(total, lang),
          })}
        >
          <AnimatedAreaChart
            height={110}
            data={series}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="step-month-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-cta)" stopOpacity={0.42} />
                <stop offset="100%" stopColor="var(--color-cta)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              ticks={ticks}
              interval={0}
              tickFormatter={(value) => String(value)}
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
              labelFormatter={(label) => `${label} ${monthLabel}`}
              formatter={(value) => [formatStepNumber(Number(value), lang), t('steps.statSteps')]}
            />
            <Area
              type="monotone"
              dataKey="steps"
              stroke={colors.gold}
              strokeWidth={2}
              fill="url(#step-month-grad)"
            />
          </AnimatedAreaChart>
        </div>
      )}
    </StepChartSection>
  )
}
