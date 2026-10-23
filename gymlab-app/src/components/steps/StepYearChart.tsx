// «Año por mes» (dirección C): 12 barras del año calendario. El mes vigente se
// destaca y los meses futuros no se dibujan (no son meses cerrados en cero).
import { useTranslation } from 'react-i18next'
import { Bar, Cell, XAxis } from 'recharts'
import { AnimatedBarChart } from '../stats/AnimatedCharts'
import { ChartTooltip } from '../stats/ChartTooltip'
import { axisTick } from '../stats/chartStyle'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { AppLanguage } from '@/domain/onboarding'
import type { DailyStepsEntry } from '@/domain/types'
import { buildYearSeries } from '@/domain/stepAnalytics'
import { formatDate, formatStepNumber, monthLetters } from '@/lib/intl'
import { StepChartSection } from './StepChartSection'
import { StepEmptyState } from './StepEmptyState'

type StepYearChartProps = {
  entries: DailyStepsEntry[]
  year: number
  today: string
}

export const StepYearChart = ({ entries, year, today }: StepYearChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const series = buildYearSeries(entries, year, today)
  const labels = monthLetters(lang)
  const total = series.reduce((sum, point) => sum + point.steps, 0)

  return (
    <StepChartSection
      title={t('steps.yearSection')}
      meta={t('steps.yearSub', { year })}
      value={total > 0 ? formatStepNumber(total, lang) : undefined}
      valueLabel={total > 0 ? t('steps.yearValue') : undefined}
    >
      {total === 0 ? (
        <StepEmptyState title={t('steps.yearEmpty')} text={t('steps.yearEmptyText')} />
      ) : (
        <div
          role="img"
          aria-label={t('steps.yearAria', {
            year,
            total: formatStepNumber(total, lang),
          })}
        >
          <AnimatedBarChart
            height={110}
            data={series}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              ticks={series.map((point) => point.month)}
              interval={0}
              tickFormatter={(value) => labels[Number(value)] ?? ''}
              tick={axisTick(colors)}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              colors={colors}
              cursor={false}
              labelFormatter={(value) =>
                formatDate(new Date(year, Number(value), 1), lang, { month: 'long' })
              }
              formatter={(value) => [formatStepNumber(Number(value), lang), t('steps.statSteps')]}
            />
            <Bar dataKey="steps" radius={[6, 6, 0, 0]} maxBarSize={22} activeBar={{ stroke: colors.fg, strokeWidth: 2.5 }}>
              {series.map((point) => (
                <Cell
                  key={point.key}
                  fill={
                    point.isFuture
                      ? 'transparent'
                      : point.isCurrent
                        ? colors.goldBright
                        : colors.gold
                  }
                />
              ))}
            </Bar>
          </AnimatedBarChart>
        </div>
      )}
    </StepChartSection>
  )
}
