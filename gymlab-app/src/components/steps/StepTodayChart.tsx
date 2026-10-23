// «Hoy por hora» (dirección C): área real de pasos por hora. Si la plataforma no
// expone salud o no hay permiso, muestra un estado vacío honesto; el alta manual
// no inventa horas.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, XAxis } from 'recharts'
import { AnimatedAreaChart } from '../stats/AnimatedCharts'
import { ChartTooltip } from '../stats/ChartTooltip'
import { axisTick } from '../stats/chartStyle'
import { Button } from '../ui/Button'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { AppLanguage } from '@/domain/onboarding'
import { formatStepNumber } from '@/lib/intl'
import { StepChartSection } from './StepChartSection'
import { StepEmptyState } from './StepEmptyState'

type StepTodayChartProps = {
  hours: number[] | null
  available: boolean | null
  canConnect: boolean
  onConnect: () => void
}

export const StepTodayChart = ({
  hours,
  available,
  canConnect,
  onConnect,
}: StepTodayChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()

  const data = useMemo(
    () => (hours ?? []).map((steps, hour) => ({ hour, steps })),
    [hours],
  )
  const total = data.reduce((sum, point) => sum + point.steps, 0)
  const peak = data.reduce(
    (best, point) => (point.steps > best.steps ? point : best),
    { hour: 0, steps: 0 },
  )
  const hasData = total > 0
  const loading = hours === null || available === null

  return (
    <StepChartSection
      title={t('steps.today')}
      meta={
        hasData
          ? t('steps.todayPeak', {
              hour: peak.hour,
              count: formatStepNumber(peak.steps, lang),
            })
          : t('steps.todayByHour')
      }
      value={hasData ? formatStepNumber(total, lang) : undefined}
      valueLabel={hasData ? t('steps.statSteps') : undefined}
    >
      {loading ? (
        <div className="h-[110px] animate-pulse rounded-xl bg-bg-elevated/40" aria-hidden />
      ) : available === false ? (
        <StepEmptyState
          title={t('steps.todayEmptyTitle')}
          text={t('steps.todayEmptyText')}
          action={
            canConnect ? (
              <Button variant="flat" size="sm" onClick={onConnect}>
                {t('steps.todayConnect')}
              </Button>
            ) : undefined
          }
        />
      ) : !hasData ? (
        <StepEmptyState
          title={t('steps.todayNoStepsTitle')}
          text={t('steps.todayNoStepsText')}
        />
      ) : (
        <div
          role="img"
          aria-label={t('steps.todayAria', {
            total: formatStepNumber(total, lang),
            hour: peak.hour,
          })}
        >
          <AnimatedAreaChart
            height={110}
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="step-today-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-cta)" stopOpacity={0.42} />
                <stop offset="100%" stopColor="var(--color-cta)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              ticks={[0, 6, 12, 18, 23]}
              interval={0}
              tickFormatter={(value) => String(value).padStart(2, '0')}
              tick={axisTick(colors)}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              colors={colors}
              cursor={false}
              labelFormatter={(label) => `${String(label).padStart(2, '0')}:00`}
              formatter={(value) => [formatStepNumber(Number(value), lang), t('steps.statSteps')]}
            />
            <Area
              type="monotone"
              dataKey="steps"
              stroke={colors.gold}
              strokeWidth={2}
              fill="url(#step-today-grad)"
            />
          </AnimatedAreaChart>
        </div>
      )}
    </StepChartSection>
  )
}
