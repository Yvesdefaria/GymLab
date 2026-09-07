// StepWeekChart: barras diarias de la semana actual con la meta como línea de
// referencia (Recharts). Las etiquetas de días salen de weekdayLetters (idioma
// actual) y los datos se moldean con buildWeekSeries.
import { useTranslation } from 'react-i18next'
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts'
import { Target } from 'lucide-react'
import { ChartCard } from '../stats/ChartCard'
import { ChartTooltip } from '../stats/ChartTooltip'
import { AnimatedBarChart } from '../stats/AnimatedCharts'
import { axisTick, mobileBarGap } from '../stats/chartStyle'
import { useThemeColors } from '@/hooks/useThemeColors'
import { toLocalDateStr } from '@/domain/dates'
import { formatDayShort, formatNumber, weekdayLetters } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { DailyStepsEntry } from '@/domain/types'
import { buildWeekSeries } from './stepSeries'

type StepWeekChartProps = {
  week: DailyStepsEntry[]
  goal: number
}

export const StepWeekChart = ({ week, goal }: StepWeekChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()

  const series = buildWeekSeries(week, toLocalDateStr(), weekdayLetters(lang, 1))
  const total = week.reduce((sum, e) => sum + e.steps, 0)

  if (total <= 0) {
    return (
      <ChartCard title={t('steps.weekSection')}>
        <p className="py-4 text-center text-sm text-muted">{t('steps.weekEmpty')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('steps.weekSection')}
      subtitle={t('steps.weekSub', { count: formatNumber(total, lang) })}
      footer={
        goal > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold">
            <Target className="size-3" aria-hidden />
            {t('steps.weekGoal')}: {formatNumber(goal, lang)}
          </div>
        ) : undefined
      }
    >
      <div role="img" aria-label={t('steps.weekSection')}>
        <AnimatedBarChart
          height={200}
          data={series}
          {...mobileBarGap}
          margin={{ top: 18, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisTick(colors)} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
          <ChartTooltip
            colors={colors}
            labelFormatter={(_, payload) => formatDayShort(payload[0]?.payload?.date ?? '', lang)}
            formatter={(value) => [formatNumber(Number(value), lang), t('steps.statSteps')]}
          />
          {goal > 0 && (
            <ReferenceLine y={goal} stroke={colors.gold} strokeDasharray="6 4" strokeWidth={1.5} />
          )}
          <Bar dataKey="steps" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {series.map((p) => (
              <Cell key={p.date} fill={p.isToday ? colors.cta : colors.gold} />
            ))}
            <LabelList
              dataKey="steps"
              position="top"
              offset={4}
              formatter={(value) => {
                const n = Number(value)
                return n > 0 ? formatNumber(n, lang) : ''
              }}
              style={{ fill: colors.fg, fontSize: 10, fontWeight: 500 }}
            />
          </Bar>
        </AnimatedBarChart>
      </div>
    </ChartCard>
  )
}